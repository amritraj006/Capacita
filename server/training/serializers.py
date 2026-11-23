from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import TrainingProgram
from courses.models import Course

User = get_user_model()

class CourseSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'title', 'code', 'category', 'level']

class TrainingProgramSerializer(serializers.ModelSerializer):
    courses = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Course.objects.all(),
        required=False
    )
    courses_details = CourseSummarySerializer(source='courses', many=True, read_only=True)
    courses_count = serializers.IntegerField(source='courses.count', read_only=True)

    lead_trainer = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role__in=['ADMIN', 'TRAINER']),
        required=False,
        allow_null=True
    )
    lead_trainer_name = serializers.SerializerMethodField()

    class Meta:
        model = TrainingProgram
        fields = [
            'id',
            'title',
            'code',
            'description',
            'courses',
            'courses_details',
            'courses_count',
            'lead_trainer',
            'lead_trainer_name',
            'status',
            'start_date',
            'end_date',
            'location_or_link',
            'target_audience',
            'max_participants',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'courses_count', 'courses_details', 'lead_trainer_name']

    def get_lead_trainer_name(self, obj):
        if obj.lead_trainer:
            name = f"{obj.lead_trainer.first_name} {obj.lead_trainer.last_name}".strip()
            return name or obj.lead_trainer.email
        return 'Unassigned'

    def validate_code(self, value):
        return value.strip().upper()
