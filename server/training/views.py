from rest_framework import viewsets, filters, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import TrainingProgram
from .serializers import TrainingProgramSerializer
from .permissions import TrainingPermission
from employees.models import Employee
from enrollments.models import Enrollment
from enrollments.serializers import EnrollmentSerializer

class TrainingProgramViewSet(viewsets.ModelViewSet):
    serializer_class = TrainingProgramSerializer
    permission_classes = [TrainingPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'code', 'description', 'target_audience', 'location_or_link']
    ordering_fields = ['start_date', 'code', 'title', 'created_at']
    ordering = ['-start_date', 'title']

    def get_queryset(self):
        queryset = TrainingProgram.objects.prefetch_related('courses', 'enrollments').select_related('lead_trainer').all()

        # Status filter
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param.upper())

        # Trainer filter
        trainer_param = self.request.query_params.get('lead_trainer')
        if trainer_param:
            queryset = queryset.filter(lead_trainer_id=trainer_param)

        # Role-based scoping
        user = self.request.user
        if user.is_authenticated:
            if user.role == 'TRAINER':
                queryset = queryset.filter(lead_trainer=user)
            elif user.role == 'EMPLOYEE':
                queryset = queryset.exclude(status='DRAFT')

        return queryset

    @action(detail=True, methods=['get'])
    def enrollments(self, request, pk=None):
        """Return all enrollments for this training program."""
        program = self.get_object()
        enrs = program.enrollments.select_related(
            'employee__user', 'employee__department', 'course', 'training_program__lead_trainer', 'enrolled_by'
        ).all()
        serializer = EnrollmentSerializer(enrs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def bulk_enroll(self, request, pk=None):
        """Admin-only: enroll multiple employees or an entire department into this training program."""
        if request.user.role != 'ADMIN':
            return Response({"detail": "Administrator access required."}, status=status.HTTP_403_FORBIDDEN)

        program = self.get_object()
        employee_ids = request.data.get('employee_ids', [])
        department_id = request.data.get('department_id')
        enrollment_type = request.data.get('enrollment_type', Enrollment.EnrollmentType.MANDATORY)

        target_employees = Employee.objects.filter(is_active=True)
        if department_id:
            target_employees = target_employees.filter(department_id=department_id)
        elif employee_ids:
            target_employees = target_employees.filter(id__in=employee_ids)
        else:
            return Response(
                {"detail": "Provide employee_ids or department_id."},
                status=status.HTTP_400_BAD_REQUEST
            )

        current_active_count = program.enrollments.exclude(status=Enrollment.Status.DROPPED).count()
        enrolled_count = 0
        skipped_count = 0

        for emp in target_employees:
            exists = Enrollment.objects.filter(
                employee=emp, training_program=program
            ).exclude(status=Enrollment.Status.DROPPED).exists()
            if exists:
                skipped_count += 1
                continue
            if current_active_count + enrolled_count >= program.max_participants:
                break
            Enrollment.objects.create(
                employee=emp,
                training_program=program,
                enrolled_by=request.user,
                enrollment_type=enrollment_type,
            )
            enrolled_count += 1

        return Response({
            "detail": f"Enrolled {enrolled_count} employee(s). Skipped {skipped_count} already enrolled.",
            "enrolled_count": enrolled_count,
            "skipped_count": skipped_count,
        })
