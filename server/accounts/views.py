from rest_framework import status, views, permissions, viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils import timezone
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.db.models import Q

from .models import TrainerApplication
from .serializers import (
    UserSerializer,
    UserAdminSerializer,
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    TrainerApplicationSerializer,
    TrainerApplySerializer,
    TrainerReapplySerializer,
)
from .permissions import IsAdmin, IsTrainer, IsEmployee, is_trainer_approved

User = get_user_model()


class UserManagementViewSet(viewsets.ModelViewSet):
    """
    Admin-only endpoint for creating and managing Admin, Trainer, and User accounts.
    Strictly protected: only authenticated Administrators can access this endpoint.
    """
    serializer_class = UserAdminSerializer
    permission_classes = [IsAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['email', 'first_name', 'last_name', 'phone']
    ordering_fields = ['created_at', 'first_name', 'email']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = User.objects.all()
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role.upper())
            if role.upper() == 'TRAINER':
                approved_only = self.request.query_params.get('approved_only')
                if approved_only == 'true':
                    queryset = queryset.filter(
                        Q(trainer_application__isnull=True) | Q(trainer_application__status=TrainerApplication.Status.APPROVED)
                    )

        is_active = self.request.query_params.get('is_active')
        if is_active is not None and is_active != '':
            queryset = queryset.filter(is_active=is_active.lower() in ['true', '1'])
        return queryset

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        user = self.get_object()
        if user == request.user:
            return Response({"detail": "You cannot deactivate your own account."}, status=status.HTTP_400_BAD_REQUEST)

        # Prevent deactivating the last active administrator
        if user.role == User.Role.ADMIN and user.is_active:
            other_active_admins = User.objects.filter(
                role=User.Role.ADMIN,
                is_active=True
            ).exclude(pk=user.pk).count()
            if other_active_admins == 0:
                return Response(
                    {"detail": "Cannot deactivate the last active administrator account."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])
        if hasattr(user, 'employee_profile'):
            user.employee_profile.is_active = user.is_active
            user.employee_profile.save(update_fields=['is_active'])
        state = 'activated' if user.is_active else 'deactivated'
        return Response({"detail": f"User {user.email} {state}.", "is_active": user.is_active})

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user == request.user:
            return Response(
                {"detail": "You cannot delete your own account while logged in."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Prevent deleting the last active administrator
        if user.role == User.Role.ADMIN and user.is_active:
            other_active_admins = User.objects.filter(
                role=User.Role.ADMIN,
                is_active=True
            ).exclude(pk=user.pk).count()
            if other_active_admins == 0:
                return Response(
                    {"detail": "Cannot delete the last active administrator account."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return super().destroy(request, *args, **kwargs)


class RegisterView(views.APIView):
    """
    Public Registration Endpoint.
    Open to anonymous users.
    Security policy: Creates EMPLOYEE accounts ONLY. Any role sent in the request is discarded.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        data.pop('role', None)

        serializer = RegisterSerializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                "detail": "Account registered successfully.",
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PublicDepartmentListView(views.APIView):
    """Public read-only list of active departments for the Trainer Application form."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from departments.models import Department
        depts = Department.objects.filter(is_active=True).order_by('name').values('id', 'name', 'code')
        return Response(list(depts), status=status.HTTP_200_OK)


class TrainerApplyView(views.APIView):
    """
    Dedicated Public Trainer Self-Registration Endpoint.
    Creates a user account with the TRAINER role and records a PENDING TrainerApplication.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = TrainerApplySerializer(data=request.data)
        if serializer.is_valid():
            application = serializer.save()
            user = application.user
            refresh = RefreshToken.for_user(user)
            return Response({
                "detail": "Trainer application submitted successfully and is pending administrative review.",
                "user": UserSerializer(user).data,
                "application": TrainerApplicationSerializer(application).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TrainerApplicationMeView(views.APIView):
    """
    Allows authenticated trainers to inspect their own application status and review remarks.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != User.Role.TRAINER:
            return Response({"detail": "Only trainers have an application profile."}, status=status.HTTP_403_FORBIDDEN)

        if not hasattr(user, 'trainer_application'):
            # Return synthesized approved application for admin-provisioned trainers
            return Response({
                "id": None,
                "user_id": user.id,
                "applicant_name": f"{user.first_name} {user.last_name}".strip() or user.email,
                "applicant_email": user.email,
                "applicant_phone": user.phone,
                "department": None,
                "department_name": "Unassigned",
                "department_code": "",
                "status": TrainerApplication.Status.APPROVED,
                "rejection_reason": "",
                "qualifications": "",
                "experience": "",
                "skills": "",
                "introduction": "Account provisioned directly by Administrator.",
                "history": [],
            }, status=status.HTTP_200_OK)

        serializer = TrainerApplicationSerializer(user.trainer_application)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TrainerReapplyView(views.APIView):
    """
    Allows a rejected trainer to submit an updated application.
    Preserves previous application history and changes status to PENDING.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != User.Role.TRAINER or not hasattr(user, 'trainer_application'):
            return Response({"detail": "No trainer application found for this account."}, status=status.HTTP_404_NOT_FOUND)

        application = user.trainer_application
        if application.status != TrainerApplication.Status.REJECTED:
            return Response(
                {"detail": "Only rejected applications can be resubmitted."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = TrainerReapplySerializer(data=request.data)
        if serializer.is_valid():
            # Archive previous rejected state into history
            archive_entry = {
                "submitted_at": application.created_at.isoformat() if application.created_at else None,
                "reviewed_at": application.reviewed_at.isoformat() if application.reviewed_at else None,
                "rejection_reason": application.rejection_reason,
                "qualifications": application.qualifications,
                "experience": application.experience,
                "skills": application.skills,
                "introduction": application.introduction,
                "department_id": application.department_id,
            }
            history = list(application.history or [])
            history.append(archive_entry)
            application.history = history

            # Update with new application details
            application.qualifications = serializer.validated_data['qualifications'].strip()
            application.experience = serializer.validated_data['experience'].strip()
            application.skills = serializer.validated_data['skills'].strip()
            application.introduction = serializer.validated_data['introduction'].strip()
            if 'department_id' in serializer.validated_data:
                application.department = serializer.validated_data['department_id']

            application.status = TrainerApplication.Status.PENDING
            application.rejection_reason = ''
            application.reviewed_by = None
            application.reviewed_at = None
            application.save()

            # Update user info if provided
            if serializer.validated_data.get('first_name'):
                user.first_name = serializer.validated_data['first_name'].strip()
            if serializer.validated_data.get('last_name'):
                user.last_name = serializer.validated_data['last_name'].strip()
            if serializer.validated_data.get('phone'):
                user.phone = serializer.validated_data['phone'].strip()
            user.save()

            return Response({
                "detail": "Application resubmitted successfully and is now pending review.",
                "application": TrainerApplicationSerializer(application).data
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TrainerDeleteAccountView(views.APIView):
    """
    Allows a rejected trainer to permanently delete their account and application data.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        user = request.user
        if user.role != User.Role.TRAINER:
            return Response({"detail": "Action available only for trainer accounts."}, status=status.HTTP_403_FORBIDDEN)

        if hasattr(user, 'trainer_application') and user.trainer_application.status != TrainerApplication.Status.REJECTED:
            return Response(
                {"detail": "Only rejected trainer applicants can delete their accounts via this endpoint."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.delete()
        return Response({"detail": "Your account and application have been permanently removed."}, status=status.HTTP_200_OK)


class TrainerApplicationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin-only ViewSet for reviewing, approving, and rejecting Trainer Applications.
    """
    serializer_class = TrainerApplicationSerializer
    permission_classes = [IsAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'user__email',
        'user__first_name',
        'user__last_name',
        'skills',
        'qualifications',
        'department__name'
    ]
    ordering_fields = ['created_at', 'status', 'reviewed_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = TrainerApplication.objects.select_related('user', 'department', 'reviewed_by').all()
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param.upper())
        return queryset

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        app = self.get_object()
        app.status = TrainerApplication.Status.APPROVED
        app.reviewed_by = request.user
        app.reviewed_at = timezone.now()
        app.save()

        # Ensure applicant's user account is active
        app.user.is_active = True
        app.user.save(update_fields=['is_active'])

        return Response({
            "detail": f"Application for {app.user.email} approved successfully.",
            "status": TrainerApplication.Status.APPROVED
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        app = self.get_object()
        reason = request.data.get('rejection_reason', '').strip()
        if not reason:
            return Response(
                {"rejection_reason": "A rejection reason must be provided."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Archive to history
        archive_entry = {
            "submitted_at": app.created_at.isoformat() if app.created_at else None,
            "reviewed_at": timezone.now().isoformat(),
            "rejection_reason": reason,
            "qualifications": app.qualifications,
            "experience": app.experience,
            "skills": app.skills,
            "introduction": app.introduction,
            "department_id": app.department_id,
        }
        history = list(app.history or [])
        history.append(archive_entry)
        app.history = history

        app.status = TrainerApplication.Status.REJECTED
        app.rejection_reason = reason
        app.reviewed_by = request.user
        app.reviewed_at = timezone.now()
        app.save()

        return Response({
            "detail": f"Application for {app.user.email} rejected.",
            "status": TrainerApplication.Status.REJECTED,
            "rejection_reason": reason
        }, status=status.HTTP_200_OK)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)


class UserProfileView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        # Prevent users from changing their own role or promoting themselves
        if 'role' in request.data and request.data['role'] != request.user.role:
            return Response(
                {"detail": "You are not permitted to change your account role."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            return Response({"detail": "Password changed successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email'].lower()
            try:
                user = User.objects.get(email=email)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                token = default_token_generator.make_token(user)
                return Response({
                    "detail": "Password reset instructions generated.",
                    "reset_token": token,
                    "uid": uid,
                }, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                return Response({
                    "detail": "If this email exists in our system, a reset token has been provided."
                }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            uid = serializer.validated_data['uid']
            token = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']

            try:
                user_id = force_str(urlsafe_base64_decode(uid))
                user = User.objects.get(pk=user_id)
            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                return Response({"detail": "Invalid reset link or user."}, status=status.HTTP_400_BAD_REQUEST)

            if default_token_generator.check_token(user, token):
                user.set_password(new_password)
                user.save()
                return Response({"detail": "Password has been reset successfully."}, status=status.HTTP_200_OK)
            else:
                return Response({"detail": "Token is invalid or has expired."}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Role-Based Test Verification Endpoints
class AdminOnlyTestView(views.APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response({
            "detail": "Admin access verified.",
            "user": request.user.email,
            "role": request.user.role,
        })


class TrainerOnlyTestView(views.APIView):
    permission_classes = [IsTrainer]

    def get(self, request):
        return Response({
            "detail": "Trainer access verified.",
            "user": request.user.email,
            "role": request.user.role,
        })


class EmployeeOnlyTestView(views.APIView):
    permission_classes = [IsEmployee]

    def get(self, request):
        return Response({
            "detail": "Employee access verified.",
            "user": request.user.email,
            "role": request.user.role,
        })
