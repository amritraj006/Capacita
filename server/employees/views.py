from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Employee
from .serializers import EmployeeSerializer
from .permissions import EmployeePermission

class EmployeeViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeSerializer
    permission_classes = [EmployeePermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'employee_id',
        'designation',
        'user__first_name',
        'user__last_name',
        'user__email',
        'department__name',
        'department__code',
    ]
    ordering_fields = ['employee_id', 'joining_date', 'created_at', 'designation']
    ordering = ['employee_id']

    def get_queryset(self):
        queryset = Employee.objects.select_related('user', 'department').all()

        # Department filter
        dept = self.request.query_params.get('department')
        if dept:
            queryset = queryset.filter(department_id=dept)

        # Status filter
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() in ['true', '1'])

        # Role-based visibility: Non-admins only see active employees
        if not (self.request.user.is_authenticated and self.request.user.role == 'ADMIN'):
            queryset = queryset.filter(is_active=True)

        return queryset

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """Activates or deactivates an employee and their corresponding login user."""
        employee = self.get_object()
        new_status = not employee.is_active
        employee.is_active = new_status
        employee.save()

        # Update linked user account
        user = employee.user
        user.is_active = new_status
        user.save()

        status_text = 'activated' if new_status else 'deactivated'
        return Response({
            "detail": f"Employee {employee.employee_id} successfully {status_text}.",
            "is_active": new_status,
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        """Allows authenticated employees to view and update their own profile."""
        try:
            employee = Employee.objects.select_related('user', 'department').get(user=request.user)
        except Employee.DoesNotExist:
            return Response(
                {"detail": "No employee profile associated with this account."},
                status=status.HTTP_404_NOT_FOUND
            )

        if request.method == 'GET':
            serializer = self.get_serializer(employee)
            return Response(serializer.data, status=status.HTTP_200_OK)

        elif request.method == 'PATCH':
            # Permitted self-update fields: phone, first_name, last_name
            permitted_data = {}
            if 'phone' in request.data:
                permitted_data['phone'] = request.data['phone']
            if 'first_name' in request.data or 'last_name' in request.data:
                permitted_data['user'] = {}
                if 'first_name' in request.data:
                    permitted_data['user']['first_name'] = request.data['first_name']
                if 'last_name' in request.data:
                    permitted_data['user']['last_name'] = request.data['last_name']

            serializer = self.get_serializer(employee, data=permitted_data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
