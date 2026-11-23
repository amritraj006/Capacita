from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, CourseModuleViewSet

router = DefaultRouter()
router.register(r'modules', CourseModuleViewSet, basename='course-module')
router.register(r'', CourseViewSet, basename='course')

urlpatterns = [
    path('', include(router.urls)),
]
