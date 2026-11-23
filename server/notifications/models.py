from django.db import models
from django.conf import settings


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        TRAINING_ASSIGNMENT = 'TRAINING_ASSIGNMENT', 'Training Assignment'
        ENROLLMENT_UPDATE = 'ENROLLMENT_UPDATE', 'Course Enrollment Update'
        UPCOMING_TRAINING = 'UPCOMING_TRAINING', 'Upcoming Training Activity'
        ASSESSMENT = 'ASSESSMENT', 'Assessment Notification'
        COMPLETION = 'COMPLETION', 'Completion & Certificate'

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=30,
        choices=NotificationType.choices,
        default=NotificationType.ENROLLMENT_UPDATE
    )
    is_read = models.BooleanField(default=False)
    link_url = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read', '-created_at']),
        ]

    def __str__(self):
        return f"[{self.notification_type}] {self.recipient.email} - {self.title}"
