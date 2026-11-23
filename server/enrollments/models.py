from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError

class Enrollment(models.Model):
    class Type(models.TextChoices):
        MANDATORY = 'MANDATORY', 'Mandatory'
        VOLUNTARY = 'VOLUNTARY', 'Voluntary'

    class Status(models.TextChoices):
        ENROLLED = 'ENROLLED', 'Enrolled'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'
        DROPPED = 'DROPPED', 'Dropped'

    employee = models.ForeignKey(
        'employees.Employee',
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='enrollments'
    )
    training_program = models.ForeignKey(
        'training.TrainingProgram',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='enrollments'
    )
    enrolled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='enrollments_assigned'
    )
    enrollment_type = models.CharField(
        max_length=20,
        choices=Type.choices,
        default=Type.MANDATORY
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ENROLLED
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-enrolled_at']
        constraints = [
            models.UniqueConstraint(
                fields=['employee', 'course'],
                name='unique_employee_course_enrollment',
                condition=models.Q(course__isnull=False)
            ),
            models.UniqueConstraint(
                fields=['employee', 'training_program'],
                name='unique_employee_training_enrollment',
                condition=models.Q(training_program__isnull=False)
            ),
        ]

    def clean(self):
        if not self.course and not self.training_program:
            raise ValidationError("An enrollment must be associated with either a course or a training program.")
        if self.course and self.training_program:
            raise ValidationError("An enrollment cannot be associated with both a course and a training program simultaneously.")

    def __str__(self):
        target = self.course.code if self.course else (self.training_program.code if self.training_program else 'N/A')
        return f"{self.employee.employee_id} -> {target} ({self.status})"
