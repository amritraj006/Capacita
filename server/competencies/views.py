from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import CompetencyCategory, Competency, EmployeeCompetency, CompetencyEvaluationLog
from .serializers import (
    CompetencyCategorySerializer,
    CompetencySerializer,
    EmployeeCompetencySerializer,
    CompetencyEvaluationLogSerializer
)
from .permissions import CompetencyFrameworkPermission, EmployeeCompetencyPermission


class CompetencyCategoryViewSet(viewsets.ModelViewSet):
    """API endpoint for managing broad competency categories."""
    queryset = CompetencyCategory.objects.prefetch_related('competencies').all()
    serializer_class = CompetencyCategorySerializer
    permission_classes = [CompetencyFrameworkPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class CompetencyViewSet(viewsets.ModelViewSet):
    """API endpoint for defining competencies, descriptions, target levels, and curricula associations."""
    queryset = Competency.objects.select_related('category').prefetch_related(
        'associated_courses', 'associated_programs'
    ).all()
    serializer_class = CompetencySerializer
    permission_classes = [CompetencyFrameworkPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'name', 'description', 'category__name']
    ordering_fields = ['code', 'name', 'created_at', 'target_level']
    ordering = ['code']

    def get_queryset(self):
        queryset = super().get_queryset()
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        target_level = self.request.query_params.get('target_level')
        if target_level:
            queryset = queryset.filter(target_level=target_level)

        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        return queryset


class EmployeeCompetencyViewSet(viewsets.ModelViewSet):
    """API endpoint for maintaining employee competency records and recording evaluations."""
    queryset = EmployeeCompetency.objects.select_related(
        'employee__user', 'employee__department', 'competency__category', 'evaluated_by'
    ).prefetch_related(
        'competency__associated_courses', 'competency__associated_programs', 'evaluation_history'
    ).all()
    serializer_class = EmployeeCompetencySerializer
    permission_classes = [EmployeeCompetencyPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'employee__user__first_name', 'employee__user__last_name',
        'employee__employee_id', 'employee__user__email',
        'competency__code', 'competency__name'
    ]
    ordering_fields = ['created_at', 'current_level', 'status', 'evaluated_at']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        # Employees only view their own competency records
        if user.is_authenticated and user.role == 'EMPLOYEE':
            return queryset.filter(employee__user=user)

        # Filters for Admin / Trainer
        employee_id = self.request.query_params.get('employee')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)

        competency_id = self.request.query_params.get('competency')
        if competency_id:
            queryset = queryset.filter(competency_id=competency_id)

        current_level = self.request.query_params.get('current_level')
        if current_level:
            queryset = queryset.filter(current_level=current_level)

        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        return queryset

    @action(detail=True, methods=['post'])
    def evaluate(self, request, pk=None):
        """
        Record a competency evaluation for an employee:
        Expects: { current_level: 'ADVANCED', status: 'VERIFIED', evaluation_notes: 'Evidence...' }
        Automatically logs to CompetencyEvaluationLog.
        """
        employee_competency = self.get_object()

        new_level = request.data.get('current_level')
        new_status = request.data.get('status', EmployeeCompetency.Status.VERIFIED)
        notes = request.data.get('evaluation_notes', '')

        if new_level and new_level not in EmployeeCompetency.Level.values:
            return Response(
                {"detail": f"Invalid level. Must be one of {EmployeeCompetency.Level.values}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_status and new_status not in EmployeeCompetency.Status.values:
            return Response(
                {"detail": f"Invalid status. Must be one of {EmployeeCompetency.Status.values}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_level:
            employee_competency.current_level = new_level
        if new_status:
            employee_competency.status = new_status

        employee_competency.evaluated_by = request.user
        employee_competency.evaluated_at = timezone.now()
        employee_competency.evaluation_notes = notes
        employee_competency.save()

        # Audit history log
        CompetencyEvaluationLog.objects.create(
            employee_competency=employee_competency,
            assessed_level=employee_competency.current_level,
            status=employee_competency.status,
            evaluated_by=request.user,
            evaluated_at=employee_competency.evaluated_at,
            comments=notes
        )

        employee_competency.refresh_from_db()
        serializer = self.get_serializer(employee_competency)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_competencies(self, request):
        """Dedicated endpoint for employees to inspect their personal competency matrix and development."""
        user = request.user
        if not hasattr(user, 'employee_profile'):
            return Response({"detail": "Employee profile not found."}, status=status.HTTP_404_NOT_FOUND)

        employee = user.employee_profile
        records = EmployeeCompetency.objects.filter(employee=employee).select_related(
            'competency__category', 'evaluated_by'
        ).prefetch_related(
            'competency__associated_courses', 'competency__associated_programs', 'evaluation_history'
        )

        total_tracked = records.count()
        verified_count = records.filter(status=EmployeeCompetency.Status.VERIFIED).count()
        needs_improvement = records.filter(status=EmployeeCompetency.Status.NEEDS_IMPROVEMENT).count()
        pending_review = records.filter(status=EmployeeCompetency.Status.PENDING_REVIEW).count()

        serializer = self.get_serializer(records, many=True)
        return Response({
            'summary': {
                'total_tracked': total_tracked,
                'verified': verified_count,
                'needs_improvement': needs_improvement,
                'pending_review': pending_review,
            },
            'records': serializer.data
        })
