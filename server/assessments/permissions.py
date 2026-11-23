from rest_framework import permissions

class AssessmentPermission(permissions.BasePermission):
    """
    Administrator: Full CRUD on assessments and questions.
    Trainer: Can create and update assessments for assigned courses/programs; can read all.
    Employee: Read-only access to active assessments.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        if request.user.role == 'ADMIN':
            return True

        if request.user.role == 'TRAINER':
            return True

        if request.user.role == 'EMPLOYEE':
            # Employees can read assessments and use employee specific actions
            if request.method in permissions.SAFE_METHODS or view.action in ['submit', 'my_assigned']:
                return True

        return False

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True

        if request.user.role == 'TRAINER':
            return True

        if request.user.role == 'EMPLOYEE':
            return obj.is_active and request.method in permissions.SAFE_METHODS

        return False


class SubmissionPermission(permissions.BasePermission):
    """
    Administrator & Trainer: Can view submissions and record evaluations.
    Employee: Can only view their own submissions and results.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        if request.user.role in ['ADMIN', 'TRAINER']:
            return True

        if request.user.role == 'EMPLOYEE':
            if request.method in permissions.SAFE_METHODS or view.action in ['my_submissions']:
                return True

        return False

    def has_object_permission(self, request, view, obj):
        if request.user.role in ['ADMIN', 'TRAINER']:
            return True

        if request.user.role == 'EMPLOYEE':
            return obj.employee.user == request.user and request.method in permissions.SAFE_METHODS

        return False
