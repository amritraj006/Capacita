from django.db import models
from django.conf import settings
from django.utils import timezone
from courses.models import Course
from training.models import TrainingProgram
from employees.models import Employee


class Assessment(models.Model):
    """Institutional assessment associated with a Course or Training Program."""
    code = models.CharField(max_length=50, unique=True, help_text="e.g. ASM-SEC-101")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    course = models.ForeignKey(
        Course,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assessments',
        help_text="Course curriculum this assessment evaluates"
    )
    training_program = models.ForeignKey(
        TrainingProgram,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assessments',
        help_text="Training cohort this assessment evaluates"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_assessments'
    )
    passing_percentage = models.PositiveIntegerField(
        default=70,
        help_text="Minimum score percentage required to pass (0-100)"
    )
    time_limit_minutes = models.PositiveIntegerField(
        default=30,
        help_text="Time limit in minutes (0 for untimed)"
    )
    max_attempts = models.PositiveIntegerField(
        default=3,
        help_text="Maximum submission attempts allowed per learner"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['code']
        verbose_name = 'Assessment'
        verbose_name_plural = 'Assessments'

    def __str__(self):
        return f"{self.code} - {self.title}"


class Question(models.Model):
    """Assessment item with prompt, options, answer key, and points."""
    class QuestionType(models.TextChoices):
        SINGLE_CHOICE = 'SINGLE_CHOICE', 'Single Choice (Radio)'
        MULTIPLE_CHOICE = 'MULTIPLE_CHOICE', 'Multiple Choice (Checkbox)'
        TRUE_FALSE = 'TRUE_FALSE', 'True / False'
        SHORT_ANSWER = 'SHORT_ANSWER', 'Short Written Answer'

    assessment = models.ForeignKey(
        Assessment,
        on_delete=models.CASCADE,
        related_name='questions'
    )
    prompt = models.TextField()
    question_type = models.CharField(
        max_length=25,
        choices=QuestionType.choices,
        default=QuestionType.SINGLE_CHOICE
    )
    options = models.JSONField(
        default=list,
        blank=True,
        help_text='List of options: [{"id": "A", "text": "Option 1"}, ...]'
    )
    correct_answer = models.JSONField(
        help_text='Key string or array of keys matching option IDs, or True/False string'
    )
    points = models.PositiveIntegerField(default=1)
    order = models.PositiveIntegerField(default=1)
    explanation = models.TextField(blank=True, help_text="Explanation revealed upon evaluation")

    class Meta:
        ordering = ['assessment', 'order']
        constraints = [
            models.UniqueConstraint(
                fields=['assessment', 'order'],
                name='unique_assessment_question_order'
            )
        ]

    def __str__(self):
        return f"Q{self.order} ({self.assessment.code}): {self.prompt[:50]}..."


class AssessmentSubmission(models.Model):
    """Employee submission record containing overall score, percentage, status, and feedback."""
    class Status(models.TextChoices):
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        SUBMITTED = 'SUBMITTED', 'Submitted'
        EVALUATED = 'EVALUATED', 'Evaluated'

    assessment = models.ForeignKey(
        Assessment,
        on_delete=models.CASCADE,
        related_name='submissions'
    )
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='assessment_submissions'
    )
    attempt_number = models.PositiveIntegerField(default=1)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SUBMITTED
    )
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    total_points = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    is_passed = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(default=timezone.now)
    evaluated_at = models.DateTimeField(null=True, blank=True)
    evaluated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='evaluated_submissions'
    )
    trainer_feedback = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-submitted_at']
        verbose_name = 'Assessment Submission'
        verbose_name_plural = 'Assessment Submissions'

    def __str__(self):
        return f"{self.employee.employee_id} - {self.assessment.code} (Attempt #{self.attempt_number}) - {self.status}"


class SubmissionAnswer(models.Model):
    """Individual question answer for a submission, with points awarded and trainer remarks."""
    submission = models.ForeignKey(
        AssessmentSubmission,
        on_delete=models.CASCADE,
        related_name='answers'
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='submitted_answers'
    )
    selected_answer = models.JSONField(
        help_text="Selected option key, array of keys, or written answer"
    )
    is_correct = models.BooleanField(null=True, blank=True)
    points_awarded = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    evaluator_comment = models.TextField(blank=True)

    class Meta:
        ordering = ['question__order']
        constraints = [
            models.UniqueConstraint(
                fields=['submission', 'question'],
                name='unique_submission_question_answer'
            )
        ]

    def __str__(self):
        return f"Ans for {self.question.id} on Sub #{self.submission.id}: {self.points_awarded} pts"
