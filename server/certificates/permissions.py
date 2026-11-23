from rest_framework import permissions


class CertificatePermission(permissions.BasePermission):
    """
    - Admin:    full CRUD (list, retrieve, generate, revoke)
    - Trainer:  read-only access to all certificates
    - Employee: read-only access to their own certificates only
    - verify action: AllowAny (handled separately in view)
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['ADMIN', 'TRAINER', 'EMPLOYEE']

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.role == 'ADMIN':
            return True

        if user.role == 'TRAINER':
            # Trainers may read but not modify
            return request.method in permissions.SAFE_METHODS

        if user.role == 'EMPLOYEE':
            # Employee can only view their own certificate
            if hasattr(user, 'employee_profile'):
                return obj.employee == user.employee_profile
            return False

        return False
