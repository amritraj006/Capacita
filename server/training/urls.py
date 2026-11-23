from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TrainingProgramViewSet

router = DefaultRouter()
router.register(r'programs', TrainingProgramViewSet, basename='training-program')

urlpatterns = [
    path('', include(router.urls)),
]
