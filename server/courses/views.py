from rest_framework import viewsets, filters, permissions, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from .models import Course, CourseModule
from .serializers import CourseSerializer, CourseModuleSerializer
from .permissions import CoursePermission

class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer
    permission_classes = [CoursePermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'code', 'category', 'instructor', 'description']
    ordering_fields = ['code', 'title', 'category', 'created_at']
    ordering = ['code']

    def get_queryset(self):
        queryset = Course.objects.prefetch_related('modules').all()

        # Category filter
        cat = self.request.query_params.get('category')
        if cat:
            queryset = queryset.filter(category__iexact=cat)

        # Level filter
        lvl = self.request.query_params.get('level')
        if lvl:
            queryset = queryset.filter(level=lvl.upper())

        # Status / availability filter
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() in ['true', '1'])

        # Non-staff/trainers only see active courses
        if not (self.request.user.is_authenticated and self.request.user.role in ['ADMIN', 'TRAINER']):
            queryset = queryset.filter(is_active=True)

        return queryset

    def destroy(self, request, *args, **kwargs):
        course = self.get_object()
        if course.training_programs.exists() or course.enrollments.exists():
            return Response(
                {
                    "detail": (
                        f"Cannot delete course '{course.title}' because it is currently used in "
                        "training programs or employee enrollments. You can unpublish it instead."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[CoursePermission])
    def toggle_publish(self, request, pk=None):
        course = self.get_object()
        course.is_active = not course.is_active
        course.save(update_fields=['is_active', 'updated_at'])
        return Response(CourseSerializer(course, context={'request': request}).data)

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[CoursePermission],
        parser_classes=[MultiPartParser, FormParser, JSONParser]
    )
    def add_module(self, request, pk=None):
        course = self.get_object()
        next_order = (course.modules.count() + 1)
        data = request.data.copy()
        data['course'] = course.id
        if 'order' not in data or not data['order']:
            data['order'] = next_order

        serializer = CourseModuleSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(CourseSerializer(course, context={'request': request}).data)
        return Response(serializer.errors, status=400)


class CourseModuleViewSet(viewsets.ModelViewSet):
    queryset = CourseModule.objects.all()
    serializer_class = CourseModuleSerializer
    permission_classes = [CoursePermission]
