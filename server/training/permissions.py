from rest_framework import permissions

class TrainingPermission(permissions.BasePermission):
    """
    Administrator: Full access (create, edit, delete any program).
    Trainer: Can view all, create new programs, or update assigned programs.
    Employee: Read-only access to published / scheduled training programs.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        if request.user.role in ['ADMIN', 'TRAINER']:
            return True

        return request.method in permissions.SAFE_METHODS

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True

        if request.user.role == 'TRAINER':
            if request.method in permissions.SAFE_METHODS:
                return True
            # Trainer can update if they are the lead trainer
            return obj.lead_trainer == request.user or obj.lead_trainer is None

        return request.method in permissions.SAFE_METHODS
