from django.db import models
from django.utils import timezone

class ModuleProgress(models.Model):
    enrollment = models.ForeignKey(
        'enrollments.Enrollment',
        on_delete=models.CASCADE,
        related_name='module_progress'
    )
    module = models.ForeignKey(
        'courses.CourseModule',
        on_delete=models.CASCADE,
        related_name='progress_records'
    )
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['module__order']
        constraints = [
            models.UniqueConstraint(
                fields=['enrollment', 'module'],
                name='unique_enrollment_module_progress'
            )
        ]

    def save(self, *args, **kwargs):
        if self.is_completed and not self.completed_at:
            self.completed_at = timezone.now()
        elif not self.is_completed:
            self.completed_at = None
        super().save(*args, **kwargs)

    def __str__(self):
        status = "Completed" if self.is_completed else "Pending"
        return f"{self.enrollment.employee.employee_id} - M{self.module.order}: {status}"
