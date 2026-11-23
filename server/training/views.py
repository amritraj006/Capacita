from rest_framework import viewsets, filters, permissions
from .models import TrainingProgram
from .serializers import TrainingProgramSerializer
from .permissions import TrainingPermission

class TrainingProgramViewSet(viewsets.ModelViewSet):
    serializer_class = TrainingProgramSerializer
    permission_classes = [TrainingPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'code', 'description', 'target_audience', 'location_or_link']
    ordering_fields = ['start_date', 'code', 'title', 'created_at']
    ordering = ['-start_date', 'title']

    def get_queryset(self):
        queryset = TrainingProgram.objects.prefetch_related('courses').select_related('lead_trainer').all()

        # Status filter
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param.upper())

        # Trainer filter
        trainer_param = self.request.query_params.get('lead_trainer')
        if trainer_param:
            queryset = queryset.filter(lead_trainer_id=trainer_param)

        # Employees only see non-draft programs
        if not (self.request.user.is_authenticated and self.request.user.role in ['ADMIN', 'TRAINER']):
            queryset = queryset.exclude(status='DRAFT')

        return queryset
