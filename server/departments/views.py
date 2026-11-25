from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from .models import Department
from .serializers import DepartmentSerializer
from accounts.permissions import IsAdmin
from employees.serializers import EmployeeSerializer

class DepartmentViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'code', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        queryset = Department.objects.annotate(
            employees_count=Count('employees', filter=Q(employees__is_active=True))
        ).select_related('parent')

        # Non-admins only see active departments
        if not (self.request.user and self.request.user.is_authenticated and self.request.user.role == 'ADMIN'):
            queryset = queryset.filter(is_active=True)

        return queryset

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]

    def destroy(self, request, *args, **kwargs):
        department = self.get_object()
        emp_count = department.employees.count()
        if emp_count > 0:
            return Response(
                {
                    "detail": (
                        f"Cannot delete department '{department.name}' because it has "
                        f"{emp_count} associated employee(s). Reassign or remove employees first."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def employees(self, request, pk=None):
        """Return all employees belonging to this department."""
        department = self.get_object()
        emps = department.employees.select_related('user', 'department').all()
        serializer = EmployeeSerializer(emps, many=True)
        return Response(serializer.data)
