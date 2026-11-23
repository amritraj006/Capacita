from django.urls import path
from .views import (
    AdminDashboardView,
    TrainerDashboardView,
    EmployeeDashboardView,
    ReportsView,
)

urlpatterns = [
    path('admin/', AdminDashboardView.as_view(), name='dashboard-admin'),
    path('trainer/', TrainerDashboardView.as_view(), name='dashboard-trainer'),
    path('employee/', EmployeeDashboardView.as_view(), name='dashboard-employee'),
    path('reports/', ReportsView.as_view(), name='dashboard-reports'),
]
