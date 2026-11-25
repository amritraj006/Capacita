from rest_framework import permissions
from accounts.permissions import is_trainer_approved

class TrainingPermission(permissions.BasePermission):
    """
    Administrator: Full access (create, edit, delete any program).
    Trainer: Can view all, create new programs, or update assigned programs (Approved Trainers only).
    Employee: Read-only access to published / scheduled training programs.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        if request.user.role == 'ADMIN':
            return True

        if request.user.role == 'TRAINER':
            return is_trainer_approved(request.user)

        return request.method in permissions.SAFE_METHODS

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True

        if request.user.role == 'TRAINER':
            if not is_trainer_approved(request.user):
                return False
            if request.method in permissions.SAFE_METHODS:
                return True
            # Trainer can update if they are the lead trainer
            return obj.lead_trainer == request.user or obj.lead_trainer is None

        return request.method in permissions.SAFE_METHODS
