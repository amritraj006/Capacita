from rest_framework import serializers
from .models import ModuleProgress

class ModuleProgressSerializer(serializers.ModelSerializer):
    module_title = serializers.CharField(source='module.title', read_only=True)
    module_order = serializers.IntegerField(source='module.order', read_only=True)

    class Meta:
        model = ModuleProgress
        fields = [
            'id',
            'enrollment',
            'module',
            'module_title',
            'module_order',
            'is_completed',
            'completed_at',
            'notes',
        ]
        read_only_fields = ['id', 'completed_at', 'module_title', 'module_order']
