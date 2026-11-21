from rest_framework import serializers
from .models import Department

class DepartmentSerializer(serializers.ModelSerializer):
    employees_count = serializers.IntegerField(read_only=True, default=0)
    parent_name = serializers.CharField(source='parent.name', read_only=True)

    class Meta:
        model = Department
        fields = [
            'id',
            'name',
            'code',
            'description',
            'parent',
            'parent_name',
            'is_active',
            'employees_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'employees_count', 'parent_name']

    def validate_code(self, value):
        return value.strip().upper()
