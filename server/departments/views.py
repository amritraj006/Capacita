from rest_framework import viewsets, permissions, filters
from django.db.models import Count, Q
from .models import Department
from .serializers import DepartmentSerializer
from accounts.permissions import IsAdmin

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
