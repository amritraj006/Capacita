from rest_framework import serializers
from .models import Assessment, Question, AssessmentSubmission, SubmissionAnswer
from courses.serializers import CourseSerializer
from training.serializers import TrainingProgramSerializer


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = [
            'id', 'assessment', 'prompt', 'question_type', 'options',
            'correct_answer', 'points', 'order', 'explanation'
        ]


class PublicQuestionSerializer(serializers.ModelSerializer):
    """Excludes correct answer and explanation to prevent answer leakage while an employee is taking a test."""
    class Meta:
        model = Question
        fields = ['id', 'prompt', 'question_type', 'options', 'points', 'order']


class AssessmentSerializer(serializers.ModelSerializer):
    questions = serializers.SerializerMethodField(read_only=True)
    questions_count = serializers.IntegerField(source='questions.count', read_only=True)
    total_points = serializers.SerializerMethodField(read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    program_code = serializers.CharField(source='training_program.code', read_only=True)
    program_title = serializers.CharField(source='training_program.title', read_only=True)

    class Meta:
        model = Assessment
        fields = [
            'id', 'code', 'title', 'description', 'course', 'course_code', 'course_title',
            'training_program', 'program_code', 'program_title', 'passing_percentage',
            'time_limit_minutes', 'max_attempts', 'is_active', 'questions_count',
            'total_points', 'questions', 'created_at', 'updated_at'
        ]

    def get_questions(self, obj):
        request = self.context.get('request')
        # If employee is taking the assessment, sanitize answers
        if request and request.user.role == 'EMPLOYEE':
            return PublicQuestionSerializer(obj.questions.all(), many=True).data
        return QuestionSerializer(obj.questions.all(), many=True).data

    def get_total_points(self, obj):
        return sum(q.points for q in obj.questions.all())


class SubmissionAnswerSerializer(serializers.ModelSerializer):
    question_prompt = serializers.CharField(source='question.prompt', read_only=True)
    question_type = serializers.CharField(source='question.question_type', read_only=True)
    question_options = serializers.JSONField(source='question.options', read_only=True)
    correct_answer = serializers.JSONField(source='question.correct_answer', read_only=True)
    explanation = serializers.CharField(source='question.explanation', read_only=True)

    class Meta:
        model = SubmissionAnswer
        fields = [
            'id', 'question', 'question_prompt', 'question_type', 'question_options',
            'selected_answer', 'is_correct', 'points_awarded', 'correct_answer',
            'explanation', 'evaluator_comment'
        ]


class AssessmentSubmissionSerializer(serializers.ModelSerializer):
    assessment_details = serializers.SerializerMethodField(read_only=True)
    employee_details = serializers.SerializerMethodField(read_only=True)
    evaluated_by_name = serializers.SerializerMethodField(read_only=True)
    answers = SubmissionAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = AssessmentSubmission
        fields = [
            'id', 'assessment', 'assessment_details', 'employee', 'employee_details',
            'attempt_number', 'status', 'score', 'total_points', 'percentage',
            'is_passed', 'submitted_at', 'evaluated_at', 'evaluated_by',
            'evaluated_by_name', 'trainer_feedback', 'answers', 'created_at'
        ]

    def get_assessment_details(self, obj):
        asm = obj.assessment
        return {
            'id': asm.id,
            'code': asm.code,
            'title': asm.title,
            'passing_percentage': asm.passing_percentage,
            'course_title': asm.course.title if asm.course else None,
            'program_title': asm.training_program.title if asm.training_program else None,
        }

    def get_employee_details(self, obj):
        emp = obj.employee
        u = emp.user
        return {
            'id': emp.id,
            'employee_id': emp.employee_id,
            'first_name': u.first_name,
            'last_name': u.last_name,
            'email': u.email,
            'designation': getattr(emp, 'designation', ''),
            'department_name': emp.department.name if emp.department else 'Unassigned'
        }

    def get_evaluated_by_name(self, obj):
        if obj.evaluated_by:
            name = f"{obj.evaluated_by.first_name} {obj.evaluated_by.last_name}".strip()
            return name if name else obj.evaluated_by.email
        return None
