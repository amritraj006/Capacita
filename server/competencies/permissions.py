from rest_framework import permissions

class CompetencyFrameworkPermission(permissions.BasePermission):
    """
    Administrator: Full CRUD on Competency Categories and Competencies.
    Trainer & Employee: Read-only access to active competencies.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        if request.user.role == 'ADMIN':
            return True

        return request.method in permissions.SAFE_METHODS

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True
        return request.method in permissions.SAFE_METHODS


class EmployeeCompetencyPermission(permissions.BasePermission):
    """
    Administrator: Full access to maintain and evaluate employee competencies.
    Trainer: Read-only access to review competencies; authorized to evaluate assigned learners.
    Employee: Read-only access to own competency records.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        if request.user.role == 'ADMIN':
            return True

        if view.action in ['my_competencies']:
            return True

        if request.user.role == 'TRAINER':
            if request.method in permissions.SAFE_METHODS or view.action in ['evaluate']:
                return True

        if request.user.role == 'EMPLOYEE' and request.method in permissions.SAFE_METHODS:
            return True

        return False

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True

        if request.user.role == 'TRAINER':
            # Trainers can inspect and evaluate
            return True

        if request.user.role == 'EMPLOYEE':
            return obj.employee.user == request.user and request.method in permissions.SAFE_METHODS

        return False
