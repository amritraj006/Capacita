from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import Employee
from departments.models import Department

User = get_user_model()

class EmployeeSerializer(serializers.ModelSerializer):
    # Embedded user fields
    email = serializers.EmailField(source='user.email')
    first_name = serializers.CharField(source='user.first_name', required=False, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True)
    role = serializers.CharField(source='user.role', default=User.Role.EMPLOYEE)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    # Department fields
    department_id = serializers.PrimaryKeyRelatedField(
        source='department',
        queryset=Department.objects.all(),
        required=False,
        allow_null=True
    )
    department_name = serializers.CharField(source='department.name', read_only=True)
    department_code = serializers.CharField(source='department.code', read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id',
            'employee_id',
            'email',
            'first_name',
            'last_name',
            'role',
            'password',
            'department_id',
            'department_name',
            'department_code',
            'designation',
            'joining_date',
            'phone',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'department_name', 'department_code']

    def validate_employee_id(self, value):
        return value.strip().upper()

    def create(self, validated_data):
        user_data = validated_data.pop('user', {})
        email = user_data.get('email', '').lower()
        password = validated_data.pop('password', None) or 'CapacitaEmp@2026'

        with transaction.atomic():
            # Check if user already exists
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': user_data.get('first_name', ''),
                    'last_name': user_data.get('last_name', ''),
                    'role': user_data.get('role', User.Role.EMPLOYEE),
                }
            )
            if created:
                user.set_password(password)
                user.save()
            else:
                if hasattr(user, 'employee_profile'):
                    raise serializers.ValidationError({"email": "This user already has an employee profile."})

            employee = Employee.objects.create(user=user, **validated_data)
            return employee

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        with transaction.atomic():
            # Update User fields if provided
            user = instance.user
            if 'first_name' in user_data:
                user.first_name = user_data['first_name']
            if 'last_name' in user_data:
                user.last_name = user_data['last_name']
            if 'role' in user_data:
                user.role = user_data['role']
            user.save()

            # If employee is deactivated, deactivate user as well
            if 'is_active' in validated_data:
                user.is_active = validated_data['is_active']
                user.save()

            return super().update(instance, validated_data)
