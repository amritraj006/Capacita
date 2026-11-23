from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompetencyCategoryViewSet, CompetencyViewSet, EmployeeCompetencyViewSet

router = DefaultRouter()
router.register(r'categories', CompetencyCategoryViewSet, basename='competency-category')
router.register(r'framework', CompetencyViewSet, basename='competency')
router.register(r'records', EmployeeCompetencyViewSet, basename='employee-competency')

urlpatterns = [
    path('', include(router.urls)),
]
