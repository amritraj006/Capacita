from rest_framework import serializers
from .models import Course, CourseModule

class CourseModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseModule
        fields = ['id', 'course', 'title', 'content_type', 'content_data', 'order', 'created_at']
        read_only_fields = ['id', 'created_at']

class CourseSerializer(serializers.ModelSerializer):
    modules = CourseModuleSerializer(many=True, read_only=True)
    modules_count = serializers.IntegerField(source='modules.count', read_only=True)

    class Meta:
        model = Course
        fields = [
            'id',
            'title',
            'code',
            'description',
            'category',
            'level',
            'instructor',
            'is_active',
            'modules_count',
            'modules',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'modules_count']

    def validate_code(self, value):
        return value.strip().upper()
