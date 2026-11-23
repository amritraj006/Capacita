from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssessmentViewSet, AssessmentSubmissionViewSet

router = DefaultRouter()
router.register(r'evaluations', AssessmentViewSet, basename='assessment')
router.register(r'submissions', AssessmentSubmissionViewSet, basename='assessment-submission')

urlpatterns = [
    path('', include(router.urls)),
]
