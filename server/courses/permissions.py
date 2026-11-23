from rest_framework import permissions

class CoursePermission(permissions.BasePermission):
    """
    Administrator: Full access (create, edit, toggle availability, delete).
    Trainer: Full access to create/edit courses and learning materials.
    Employee: Read-only access to available courses.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        if request.user.role in ['ADMIN', 'TRAINER']:
            return True

        # Employees have read-only access
        return request.method in permissions.SAFE_METHODS
