from django.db import models
from django.conf import settings
from django.utils import timezone
from employees.models import Employee
from courses.models import Course
from training.models import TrainingProgram


class CompetencyCategory(models.Model):
    """Broad category grouping for competencies (e.g. Technical, Leadership, Security)."""
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Competency Category'
        verbose_name_plural = 'Competency Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Competency(models.Model):
    """Institutional competency definition linked to courses and training tracks."""
    class Level(models.TextChoices):
        BASIC = 'BASIC', 'Level 1: Basic Awareness'
        INTERMEDIATE = 'INTERMEDIATE', 'Level 2: Working Knowledge'
        ADVANCED = 'ADVANCED', 'Level 3: Proficient'
        EXPERT = 'EXPERT', 'Level 4: Expert Mastery'

    code = models.CharField(max_length=30, unique=True, help_text="e.g. CMP-SEC-01")
    name = models.CharField(max_length=200)
    category = models.ForeignKey(
        CompetencyCategory,
        on_delete=models.CASCADE,
        related_name='competencies'
    )
    description = models.TextField(help_text="Detailed definition and behavioral indicators")
    target_level = models.CharField(
        max_length=20,
        choices=Level.choices,
        default=Level.INTERMEDIATE,
        help_text="Default baseline proficiency level expected"
    )
    associated_courses = models.ManyToManyField(
        Course,
        blank=True,
        related_name='competencies',
        help_text="Courses that develop this competency"
    )
    associated_programs = models.ManyToManyField(
        TrainingProgram,
        blank=True,
        related_name='competencies',
        help_text="Training programs that cultivate this competency"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Competency'
        verbose_name_plural = 'Competencies'
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name}"


class EmployeeCompetency(models.Model):
    """Individual employee competency record maintaining proficiency level and evaluation status."""
    class Level(models.TextChoices):
        BASIC = 'BASIC', 'Level 1: Basic Awareness'
        INTERMEDIATE = 'INTERMEDIATE', 'Level 2: Working Knowledge'
        ADVANCED = 'ADVANCED', 'Level 3: Proficient'
        EXPERT = 'EXPERT', 'Level 4: Expert Mastery'

    class Status(models.TextChoices):
        PENDING_REVIEW = 'PENDING_REVIEW', 'Pending Review'
        VERIFIED = 'VERIFIED', 'Verified'
        NEEDS_IMPROVEMENT = 'NEEDS_IMPROVEMENT', 'Needs Improvement'

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='competency_records'
    )
    competency = models.ForeignKey(
        Competency,
        on_delete=models.CASCADE,
        related_name='employee_records'
    )
    current_level = models.CharField(
        max_length=20,
        choices=Level.choices,
        default=Level.BASIC
    )
    status = models.CharField(
        max_length=25,
        choices=Status.choices,
        default=Status.PENDING_REVIEW
    )
    evaluated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='evaluated_competencies'
    )
    evaluated_at = models.DateTimeField(null=True, blank=True)
    evaluation_notes = models.TextField(blank=True, help_text="Evaluation rationale, project evidence, or assessment notes")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Employee Competency'
        verbose_name_plural = 'Employee Competencies'
        ordering = ['employee', 'competency']
        constraints = [
            models.UniqueConstraint(
                fields=['employee', 'competency'],
                name='unique_employee_competency'
            )
        ]

    def __str__(self):
        return f"{self.employee.employee_id} - {self.competency.code}: {self.current_level} ({self.status})"


class CompetencyEvaluationLog(models.Model):
    """Audit trail tracking competency development milestones and historical evaluations over time."""
    employee_competency = models.ForeignKey(
        EmployeeCompetency,
        on_delete=models.CASCADE,
        related_name='evaluation_history'
    )
    assessed_level = models.CharField(
        max_length=20,
        choices=EmployeeCompetency.Level.choices
    )
    status = models.CharField(
        max_length=25,
        choices=EmployeeCompetency.Status.choices
    )
    evaluated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    evaluated_at = models.DateTimeField(default=timezone.now)
    comments = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Competency Evaluation Log'
        verbose_name_plural = 'Competency Evaluation Logs'
        ordering = ['-evaluated_at']

    def __str__(self):
        return f"{self.employee_competency.employee.employee_id} - {self.assessed_level} at {self.evaluated_at.strftime('%Y-%m-%d')}"
