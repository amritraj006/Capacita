from rest_framework import permissions

class EnrollmentPermission(permissions.BasePermission):
    """
    Administrator: Full CRUD on all enrollments.
    Trainer: Read-only access to all enrollments, access to trainer monitoring telemetry.
    Employee: Read-only access to own enrollments, permitted to toggle their own module completion.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        if request.user.role == 'ADMIN':
            return True

        if view.action in ['my_learning', 'modules', 'toggle_module', 'trainer_monitoring']:
            return True

        if request.user.role == 'TRAINER' and request.method in permissions.SAFE_METHODS:
            return True

        if request.user.role == 'EMPLOYEE' and request.method in permissions.SAFE_METHODS:
            return True

        return False

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True

        if request.user.role == 'TRAINER':
            return request.method in permissions.SAFE_METHODS

        # Employees can only access their own enrollment
        if request.user.role == 'EMPLOYEE':
            return obj.employee.user == request.user

        return False
