from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Avg, Q
from .models import ModuleProgress
from .serializers import ModuleProgressSerializer
from enrollments.models import Enrollment
from employees.models import Employee
from courses.models import Course, CourseModule


class ModuleProgressViewSet(viewsets.ModelViewSet):
    serializer_class = ModuleProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = ModuleProgress.objects.select_related('enrollment__employee__user', 'module').all()

        if user.role == 'EMPLOYEE':
            queryset = queryset.filter(enrollment__employee__user=user)

        return queryset

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Organizational learning progress telemetry for Administrators and Trainers."""
        user = request.user
        if user.role not in ['ADMIN', 'TRAINER']:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        total_enrollments = Enrollment.objects.count()
        completed_enrollments = Enrollment.objects.filter(status=Enrollment.Status.COMPLETED).count()
        in_progress_enrollments = Enrollment.objects.filter(status=Enrollment.Status.IN_PROGRESS).count()
        enrolled_enrollments = Enrollment.objects.filter(status=Enrollment.Status.ENROLLED).count()

        total_modules_completed = ModuleProgress.objects.filter(is_completed=True).count()
        active_learners = Enrollment.objects.values('employee').distinct().count()

        completion_rate = 0
        if total_enrollments > 0:
            completion_rate = round((completed_enrollments / total_enrollments) * 100, 1)

        # Department breakdown
        dept_stats = []
        employees = Employee.objects.select_related('department').all()
        depts = {}
        for emp in employees:
            d_name = emp.department.name if emp.department else 'Unassigned'
            if d_name not in depts:
                depts[d_name] = {'total_enrolled': 0, 'completed': 0}
            emp_enrs = Enrollment.objects.filter(employee=emp)
            depts[d_name]['total_enrolled'] += emp_enrs.count()
            depts[d_name]['completed'] += emp_enrs.filter(status=Enrollment.Status.COMPLETED).count()

        for d_name, s in depts.items():
            rate = round((s['completed'] / s['total_enrolled'] * 100), 1) if s['total_enrolled'] > 0 else 0
            dept_stats.append({
                'department': d_name,
                'total_enrolled': s['total_enrolled'],
                'completed': s['completed'],
                'completion_rate': rate
            })

        return Response({
            'total_enrollments': total_enrollments,
            'completed_enrollments': completed_enrollments,
            'in_progress_enrollments': in_progress_enrollments,
            'enrolled_enrollments': enrolled_enrollments,
            'total_modules_completed': total_modules_completed,
            'active_learners': active_learners,
            'overall_completion_rate': completion_rate,
            'department_breakdown': dept_stats
        })

    @action(detail=False, methods=['get'])
    def learner_progress(self, request):
        """Detailed progress telemetry showing pending and completed activities for an employee."""
        user = request.user
        emp_id = request.query_params.get('employee_id')

        if user.role == 'EMPLOYEE' or not emp_id:
            if not hasattr(user, 'employee_profile'):
                return Response({"detail": "Employee profile not found."}, status=status.HTTP_404_NOT_FOUND)
            employee = user.employee_profile
        else:
            try:
                employee = Employee.objects.get(id=emp_id)
            except Employee.DoesNotExist:
                return Response({"detail": "Employee not found."}, status=status.HTTP_404_NOT_FOUND)

        enrollments = Enrollment.objects.filter(employee=employee).select_related('course', 'training_program')

        tracks = []
        for enr in enrollments:
            if enr.course:
                course = enr.course
                all_modules = course.modules.all()
                completed_module_ids = set(
                    enr.module_progress.filter(is_completed=True).values_list('module_id', flat=True)
                )

                module_list = []
                for m in all_modules:
                    is_comp = m.id in completed_module_ids
                    mp_rec = enr.module_progress.filter(module=m).first()
                    module_list.append({
                        'id': m.id,
                        'order': m.order,
                        'title': m.title,
                        'content_type': m.content_type,
                        'is_completed': is_comp,
                        'completed_at': mp_rec.completed_at if (mp_rec and is_comp) else None
                    })

                total_mods = len(all_modules)
                comp_mods = len(completed_module_ids)
                pct = round((comp_mods / total_mods * 100), 1) if total_mods > 0 else 0

                tracks.append({
                    'enrollment_id': enr.id,
                    'type': 'COURSE',
                    'target_code': course.code,
                    'target_title': course.title,
                    'status': enr.status,
                    'progress_percentage': pct,
                    'completed_modules': comp_mods,
                    'total_modules': total_mods,
                    'modules': module_list,
                    'enrolled_at': enr.enrolled_at,
                    'completed_at': enr.completed_at,
                })

        return Response({
            'employee_id': employee.employee_id,
            'employee_name': f"{employee.user.first_name} {employee.user.last_name}",
            'department': employee.department.name if employee.department else 'Unassigned',
            'tracks': tracks
        })
