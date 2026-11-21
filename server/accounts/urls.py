from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    RegisterView,
    LogoutView,
    UserProfileView,
    ChangePasswordView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    AdminOnlyTestView,
    TrainerOnlyTestView,
    EmployeeOnlyTestView,
)

urlpatterns = [
    # Auth & Tokens
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('me/', UserProfileView.as_view(), name='user_profile'),

    # Password Management
    path('password/change/', ChangePasswordView.as_view(), name='password_change'),
    path('password/reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),

    # Role-Based Authorization Verification Endpoints
    path('test/admin-only/', AdminOnlyTestView.as_view(), name='test_admin_only'),
    path('test/trainer-only/', TrainerOnlyTestView.as_view(), name='test_trainer_only'),
    path('test/employee-only/', EmployeeOnlyTestView.as_view(), name='test_employee_only'),
]
