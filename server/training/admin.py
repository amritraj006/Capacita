from django.contrib import admin
from .models import TrainingProgram

@admin.register(TrainingProgram)
class TrainingProgramAdmin(admin.ModelAdmin):
    list_display = ('code', 'title', 'lead_trainer', 'status', 'start_date', 'end_date', 'max_participants')
    list_filter = ('status', 'start_date')
    search_fields = ('code', 'title', 'location_or_link', 'target_audience')
    filter_horizontal = ('courses',)
