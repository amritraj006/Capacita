from rest_framework import permissions

class EmployeePermission(permissions.BasePermission):
    """
    Administrator: Full access (CRUD, activate/deactivate).
    Trainer: Read-only access to employee directory.
    Employee: Read-only access to directory, self-update on 'me' action.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        if view.action in ['me']:
            return True

        if request.user.role == 'ADMIN':
            return True

        # Trainers and Employees can read
        if request.method in permissions.SAFE_METHODS:
            return True

        return False
