from django.db import models
from django.conf import settings
from django.utils import timezone

class TrainingProgram(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        SCHEDULED = 'SCHEDULED', 'Scheduled'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    title = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    description = models.TextField(blank=True)
    courses = models.ManyToManyField('courses.Course', related_name='training_programs', blank=True)
    lead_trainer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='led_trainings'
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    location_or_link = models.CharField(max_length=255, blank=True)
    target_audience = models.CharField(max_length=150, blank=True)
    max_participants = models.PositiveIntegerField(default=30)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def sync_status_from_dates(self):
        """Automatically determine Upcoming/Ongoing/Completed from dates unless Draft or Cancelled."""
        if self.status in [self.Status.DRAFT, self.Status.CANCELLED]:
            return
        today = timezone.now().date()
        if self.start_date and self.end_date:
            if today < self.start_date:
                self.status = self.Status.SCHEDULED
            elif self.start_date <= today <= self.end_date:
                self.status = self.Status.IN_PROGRESS
            else:
                self.status = self.Status.COMPLETED
        elif self.start_date:
            self.status = self.Status.IN_PROGRESS if today >= self.start_date else self.Status.SCHEDULED
        elif self.end_date and today > self.end_date:
            self.status = self.Status.COMPLETED

    def save(self, *args, **kwargs):
        self.sync_status_from_dates()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.code} - {self.title} ({self.status})"
