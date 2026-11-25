from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Enrollment
from .serializers import EnrollmentSerializer
from .permissions import EnrollmentPermission
from progress.models import ModuleProgress
from courses.models import CourseModule

class EnrollmentViewSet(viewsets.ModelViewSet):
    serializer_class = EnrollmentSerializer
    permission_classes = [EnrollmentPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'employee__employee_id',
        'employee__user__first_name',
        'employee__user__last_name',
        'employee__user__email',
        'course__title',
        'course__code',
        'training_program__title',
        'training_program__code',
    ]
    ordering_fields = ['enrolled_at', 'status', 'enrollment_type', 'completed_at']
    ordering = ['-enrolled_at']

    def get_queryset(self):
        user = self.request.user
        queryset = Enrollment.objects.select_related(
            'employee__user',
            'employee__department',
            'course',
            'training_program__lead_trainer',
            'enrolled_by'
        ).prefetch_related('module_progress', 'course__modules').all()

        # Query param filters
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param.upper())

        course_param = self.request.query_params.get('course')
        if course_param:
            queryset = queryset.filter(course_id=course_param)

        training_param = self.request.query_params.get('training_program')
        if training_param:
            queryset = queryset.filter(training_program_id=training_param)

        employee_param = self.request.query_params.get('employee')
        if employee_param:
            queryset = queryset.filter(employee_id=employee_param)

        # Role-based scoping: Employees can only view their own enrollments
        if user.is_authenticated and user.role == 'EMPLOYEE':
            queryset = queryset.filter(employee__user=user)

        return queryset

    def perform_create(self, serializer):
        serializer.save(enrolled_by=self.request.user)

    @action(detail=True, methods=['get'])
    def modules(self, request, pk=None):
        """Returns all modules for the enrolled course with completion status for this enrollment."""
        enrollment = self.get_object()
        if not enrollment.course:
            return Response({"detail": "This enrollment is for a training program, not a modular course."}, status=status.HTTP_400_BAD_REQUEST)

        modules = enrollment.course.modules.all()
        progress_map = {
            mp.module_id: mp
            for mp in enrollment.module_progress.all()
        }

        modules_data = []
        for m in modules:
            mp = progress_map.get(m.id)
            file_url = request.build_absolute_uri(m.file.url) if getattr(m, 'file', None) else None
            modules_data.append({
                'id': m.id,
                'title': m.title,
                'order': m.order,
                'content_type': m.content_type,
                'content_data': m.content_data,
                'file_url': file_url,
                'is_completed': mp.is_completed if mp else False,
                'completed_at': mp.completed_at if mp else None,
            })

        return Response({
            'enrollment_id': enrollment.id,
            'course_title': enrollment.course.title,
            'course_code': enrollment.course.code,
            'status': enrollment.status,
            'progress_percentage': EnrollmentSerializer(enrollment).data['progress_percentage'],
            'modules': modules_data,
        })

    @action(detail=True, methods=['post'])
    def toggle_module(self, request, pk=None):
        """Toggles the completion of a module for this enrollment and updates overall course progress."""
        enrollment = self.get_object()
        if not enrollment.course:
            return Response({"detail": "No course associated with this enrollment."}, status=status.HTTP_400_BAD_REQUEST)

        module_id = request.data.get('module_id')
        if not module_id:
            return Response({"detail": "module_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            module = enrollment.course.modules.get(id=module_id)
        except CourseModule.DoesNotExist:
            return Response({"detail": "Module not found in this course."}, status=status.HTTP_404_NOT_FOUND)

        progress, created = ModuleProgress.objects.get_or_create(
            enrollment=enrollment,
            module=module,
            defaults={'is_completed': True, 'completed_at': timezone.now()}
        )
        if not created:
            progress.is_completed = not progress.is_completed
            progress.completed_at = timezone.now() if progress.is_completed else None
            progress.save()

        # Update enrollment status
        total_modules = enrollment.course.modules.count()
        completed_modules = enrollment.module_progress.filter(is_completed=True).count()

        if completed_modules == total_modules and total_modules > 0:
            enrollment.status = Enrollment.Status.COMPLETED
            enrollment.completed_at = timezone.now()
        elif completed_modules > 0:
            enrollment.status = Enrollment.Status.IN_PROGRESS
            enrollment.completed_at = None
        else:
            enrollment.status = Enrollment.Status.ENROLLED
            enrollment.completed_at = None
        enrollment.save()

        # Auto-issue certificate & check parent training program completion
        if enrollment.status == Enrollment.Status.COMPLETED:
            self._auto_issue_certificate_if_eligible(enrollment, request.user)
            self._sync_program_completions(enrollment.employee, request.user)

        return Response({
            'module_id': module.id,
            'is_completed': progress.is_completed,
            'enrollment_status': enrollment.status,
            'progress_percentage': round((completed_modules / total_modules) * 100) if total_modules > 0 else 0,
            'completed_modules': completed_modules,
            'total_modules': total_modules,
        })

    def _auto_issue_certificate_if_eligible(self, enrollment, actor):
        try:
            from certificates.models import Certificate
            from certificates.views import _build_certificate_number
            emp = enrollment.employee
            if enrollment.course:
                if Certificate.objects.filter(employee=emp, course=enrollment.course, status=Certificate.Status.ACTIVE).exists():
                    return
                title = f"Certificate of Completion — {enrollment.course.title}"
            elif enrollment.training_program:
                if Certificate.objects.filter(employee=emp, training_program=enrollment.training_program, status=Certificate.Status.ACTIVE).exists():
                    return
                title = f"Certificate of Completion — {enrollment.training_program.title}"
            else:
                return
            Certificate.objects.create(
                certificate_number=_build_certificate_number(course=enrollment.course, training_program=enrollment.training_program),
                title=title,
                employee=emp,
                course=enrollment.course,
                training_program=enrollment.training_program,
                enrollment=enrollment,
                issued_by=actor,
                metadata={'auto_issued': True}
            )
        except Exception:
            pass

    def _sync_program_completions(self, employee, actor):
        prog_enrs = Enrollment.objects.filter(
            employee=employee,
            training_program__isnull=False
        ).exclude(status__in=[Enrollment.Status.COMPLETED, Enrollment.Status.DROPPED]).select_related('training_program')
        for pe in prog_enrs:
            prog_courses = list(pe.training_program.courses.values_list('id', flat=True))
            if not prog_courses:
                continue
            completed_course_ids = set(
                Enrollment.objects.filter(
                    employee=employee,
                    course_id__in=prog_courses,
                    status=Enrollment.Status.COMPLETED
                ).values_list('course_id', flat=True)
            )
            if set(prog_courses).issubset(completed_course_ids):
                pe.status = Enrollment.Status.COMPLETED
                pe.completed_at = timezone.now()
                pe.save(update_fields=['status', 'completed_at'])
                self._auto_issue_certificate_if_eligible(pe, actor)

    @action(detail=False, methods=['post'])
    def open_program_course(self, request):
        """Allows an employee enrolled in a training program to open and track a course inside it."""
        user = request.user
        if not hasattr(user, 'employee_profile'):
            return Response({"detail": "Employee profile not found."}, status=status.HTTP_404_NOT_FOUND)
        training_program_id = request.data.get('training_program_id')
        course_id = request.data.get('course_id')
        if not training_program_id or not course_id:
            return Response({"detail": "training_program_id and course_id are required."}, status=status.HTTP_400_BAD_REQUEST)

        employee = user.employee_profile
        prog_enr = Enrollment.objects.filter(
            employee=employee, training_program_id=training_program_id
        ).exclude(status=Enrollment.Status.DROPPED).first()
        if not prog_enr:
            return Response({"detail": "You are not enrolled in this training program."}, status=status.HTTP_403_FORBIDDEN)

        if not prog_enr.training_program.courses.filter(id=course_id).exists():
            return Response({"detail": "Course is not part of this training program."}, status=status.HTTP_400_BAD_REQUEST)

        course_enr, _ = Enrollment.objects.get_or_create(
            employee=employee,
            course_id=course_id,
            defaults={'enrolled_by': user, 'enrollment_type': prog_enr.enrollment_type}
        )
        return Response(EnrollmentSerializer(course_enr).data)

    @action(detail=False, methods=['get'])
    def my_learning(self, request):
        """Dedicated endpoint for employees to retrieve all their assigned courses and trainings."""
        user = request.user
        if not hasattr(user, 'employee_profile'):
            return Response({"detail": "No employee profile found."}, status=status.HTTP_404_NOT_FOUND)

        employee = user.employee_profile
        enrollments = Enrollment.objects.filter(employee=employee).select_related(
            'course',
            'training_program__lead_trainer',
            'enrolled_by'
        ).prefetch_related('module_progress', 'course__modules')

        course_enrollments = [e for e in enrollments if e.course is not None]
        training_enrollments = [e for e in enrollments if e.training_program is not None]

        completed_count = enrollments.filter(status=Enrollment.Status.COMPLETED).count()
        in_progress_count = enrollments.filter(status=Enrollment.Status.IN_PROGRESS).count()
        enrolled_count = enrollments.filter(status=Enrollment.Status.ENROLLED).count()

        serialized_courses = EnrollmentSerializer(course_enrollments, many=True).data
        serialized_trainings = EnrollmentSerializer(training_enrollments, many=True).data

        return Response({
            'summary': {
                'total_assigned': enrollments.count(),
                'completed': completed_count,
                'in_progress': in_progress_count,
                'not_started': enrolled_count,
            },
            'course_enrollments': serialized_courses,
            'training_enrollments': serialized_trainings,
            'enrolled_courses': serialized_courses,
            'enrolled_programs': serialized_trainings,
        })

    @action(detail=False, methods=['get'])
    def trainer_monitoring(self, request):
        """Telemetry endpoint for trainers and admins to monitor cohort learning progress."""
        queryset = Enrollment.objects.select_related(
            'employee__user',
            'employee__department',
            'course',
            'training_program__lead_trainer'
        ).prefetch_related('module_progress', 'course__modules').all()

        # If trainer, strictly scope to their assigned training programs
        if request.user.role == 'TRAINER':
            queryset = queryset.filter(training_program__lead_trainer=request.user)

        serializer = EnrollmentSerializer(queryset, many=True)
        return Response(serializer.data)
