from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    """Allows access only to administrator users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')

class IsTrainer(BasePermission):
    """Allows access to administrators and trainers."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['ADMIN', 'TRAINER'])

class IsEmployee(BasePermission):
    """Allows access to any authenticated user (Employee, Trainer, or Admin)."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
