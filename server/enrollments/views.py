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
            modules_data.append({
                'id': m.id,
                'title': m.title,
                'order': m.order,
                'content_type': m.content_type,
                'content_data': m.content_data,
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

        return Response({
            'module_id': module.id,
            'is_completed': progress.is_completed,
            'enrollment_status': enrollment.status,
            'progress_percentage': round((completed_modules / total_modules) * 100) if total_modules > 0 else 0,
            'completed_modules': completed_modules,
            'total_modules': total_modules,
        })

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

        # If trainer, prioritize or filter to assigned programs
        if request.user.role == 'TRAINER':
            queryset = queryset.filter(training_program__lead_trainer=request.user) | queryset.filter(course__isnull=False)

        serializer = EnrollmentSerializer(queryset, many=True)
        return Response(serializer.data)
