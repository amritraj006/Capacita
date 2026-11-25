from rest_framework.permissions import BasePermission

def is_trainer_approved(user):
    """
    Checks if a user is an authorized active trainer or administrator.
    Pending or Rejected applicants CANNOT access trainer features.
    """
    if not user or not user.is_authenticated:
        return False
    if user.role == 'ADMIN':
        return True
    if user.role != 'TRAINER' or not user.is_active:
        return False
    if hasattr(user, 'trainer_application'):
        return user.trainer_application.status == 'APPROVED'
    return True

class IsAdmin(BasePermission):
    """Allows access only to administrator users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')

class IsTrainer(BasePermission):
    """Allows access to administrators and APPROVED trainers only."""
    def has_permission(self, request, view):
        return is_trainer_approved(request.user)

class IsEmployee(BasePermission):
    """Allows access to any authenticated user (Employee, Trainer, or Admin)."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
