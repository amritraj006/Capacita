from rest_framework import serializers
from .models import Enrollment
from employees.models import Employee
from courses.models import Course
from training.models import TrainingProgram

class EmployeeMinimalSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Employee
        fields = ['id', 'employee_id', 'name', 'email', 'department_name', 'designation']

    def get_name(self, obj):
        name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return name or obj.user.email

class CourseMinimalSerializer(serializers.ModelSerializer):
    modules_count = serializers.IntegerField(source='modules.count', read_only=True)

    class Meta:
        model = Course
        fields = ['id', 'title', 'code', 'category', 'level', 'instructor', 'duration_hours', 'modules_count']

class TrainingProgramMinimalSerializer(serializers.ModelSerializer):
    lead_trainer_name = serializers.SerializerMethodField()
    courses_count = serializers.IntegerField(source='courses.count', read_only=True)
    courses = CourseMinimalSerializer(many=True, read_only=True)

    class Meta:
        model = TrainingProgram
        fields = [
            'id',
            'title',
            'code',
            'description',
            'status',
            'start_date',
            'end_date',
            'lead_trainer_name',
            'courses_count',
            'courses',
            'location_or_link',
        ]

    def get_lead_trainer_name(self, obj):
        if obj.lead_trainer:
            name = f"{obj.lead_trainer.first_name} {obj.lead_trainer.last_name}".strip()
            return name or obj.lead_trainer.email
        return 'Unassigned'

class EnrollmentSerializer(serializers.ModelSerializer):
    employee = serializers.PrimaryKeyRelatedField(queryset=Employee.objects.all())
    employee_details = EmployeeMinimalSerializer(source='employee', read_only=True)

    course = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(),
        required=False,
        allow_null=True
    )
    course_details = CourseMinimalSerializer(source='course', read_only=True)

    training_program = serializers.PrimaryKeyRelatedField(
        queryset=TrainingProgram.objects.all(),
        required=False,
        allow_null=True
    )
    training_program_details = TrainingProgramMinimalSerializer(source='training_program', read_only=True)

    enrolled_by_name = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    total_modules = serializers.SerializerMethodField()
    completed_modules = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = [
            'id',
            'employee',
            'employee_details',
            'course',
            'course_details',
            'training_program',
            'training_program_details',
            'enrolled_by',
            'enrolled_by_name',
            'enrollment_type',
            'status',
            'progress_percentage',
            'total_modules',
            'completed_modules',
            'enrolled_at',
            'completed_at',
        ]
        read_only_fields = [
            'id',
            'enrolled_at',
            'completed_at',
            'enrolled_by_name',
            'progress_percentage',
            'total_modules',
            'completed_modules',
        ]

    def get_enrolled_by_name(self, obj):
        if obj.enrolled_by:
            name = f"{obj.enrolled_by.first_name} {obj.enrolled_by.last_name}".strip()
            return name or obj.enrolled_by.email
        return 'System / Admin'

    def get_total_modules(self, obj):
        if obj.course:
            return obj.course.modules.count()
        return 0

    def get_completed_modules(self, obj):
        if obj.course:
            return obj.module_progress.filter(is_completed=True).count()
        return 0

    def get_progress_percentage(self, obj):
        if not obj.course:
            return 100 if obj.status == Enrollment.Status.COMPLETED else (50 if obj.status == Enrollment.Status.IN_PROGRESS else 0)

        total = obj.course.modules.count()
        if total == 0:
            return 100 if obj.status == Enrollment.Status.COMPLETED else 0

        completed = obj.module_progress.filter(is_completed=True).count()
        return round((completed / total) * 100)

    def validate(self, attrs):
        course = attrs.get('course')
        training_program = attrs.get('training_program')
        employee = attrs.get('employee')

        if not course and not training_program:
            raise serializers.ValidationError("Must specify either a course or a training program for enrollment.")
        if course and training_program:
            raise serializers.ValidationError("Cannot enroll in both a course and a training program simultaneously.")

        # Check existing active enrollment & capacity
        if self.instance is None:  # on create
            if course and Enrollment.objects.filter(employee=employee, course=course).exclude(status=Enrollment.Status.DROPPED).exists():
                raise serializers.ValidationError({"course": "Employee is already enrolled in this course."})
            if training_program:
                if Enrollment.objects.filter(employee=employee, training_program=training_program).exclude(status=Enrollment.Status.DROPPED).exists():
                    raise serializers.ValidationError({"training_program": "Employee is already enrolled in this training program."})
                active_count = training_program.enrollments.exclude(status=Enrollment.Status.DROPPED).count()
                if active_count >= training_program.max_participants:
                    raise serializers.ValidationError({"training_program": f"Training program capacity ({training_program.max_participants}) has been reached."})

        return attrs
