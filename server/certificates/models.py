import uuid
import secrets
from django.db import models
from django.conf import settings
from django.utils import timezone
from employees.models import Employee
from courses.models import Course
from training.models import TrainingProgram
from enrollments.models import Enrollment


def generate_verification_code():
    return secrets.token_hex(6).upper()  # 12 characters, e.g. A1B2C3D4E5F6


class Certificate(models.Model):
    """Institutional Certificate issued upon verified completion of courses or training cohorts."""
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active / Valid'
        REVOKED = 'REVOKED', 'Revoked'

    certificate_number = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        help_text="Official institutional certificate ID, e.g. CAP-CERT-2026-CS101-ABCD"
    )
    verification_code = models.CharField(
        max_length=32,
        unique=True,
        db_index=True,
        default=generate_verification_code,
        help_text="Public verification hash"
    )
    title = models.CharField(max_length=255)
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='certificates'
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='certificates'
    )
    training_program = models.ForeignKey(
        TrainingProgram,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='certificates'
    )
    enrollment = models.ForeignKey(
        Enrollment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='certificates'
    )
    issued_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='issued_certificates'
    )
    issued_at = models.DateTimeField(default=timezone.now)
    expiry_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )
    grade_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Final course or assessment benchmark score"
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Extra details e.g. duration, instructor name, verification URL"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-issued_at']
        verbose_name = 'Certificate'
        verbose_name_plural = 'Certificates'
        constraints = [
            models.UniqueConstraint(
                fields=['employee', 'course'],
                condition=models.Q(course__isnull=False, status='ACTIVE'),
                name='unique_active_employee_course_cert'
            ),
            models.UniqueConstraint(
                fields=['employee', 'training_program'],
                condition=models.Q(training_program__isnull=False, status='ACTIVE'),
                name='unique_active_employee_training_cert'
            )
        ]

    def __str__(self):
        target = self.course.title if self.course else (self.training_program.title if self.training_program else 'Curriculum')
        return f"{self.certificate_number} - {self.employee.employee_id} ({target})"
