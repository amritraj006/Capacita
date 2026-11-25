from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from .models import TrainerApplication
from departments.models import Department

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    trainer_status = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'phone', 'is_active', 'trainer_status', 'created_at']
        read_only_fields = ['id', 'email', 'role', 'trainer_status', 'created_at']

    def get_trainer_status(self, obj):
        if obj.role == User.Role.TRAINER:
            if hasattr(obj, 'trainer_application'):
                return obj.trainer_application.status
            return 'APPROVED'
        return None

    def validate(self, attrs):
        # Prevent any role modification via this serializer
        attrs.pop('role', None)
        return attrs


class UserAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    assigned_programs_count = serializers.SerializerMethodField(read_only=True)
    trainer_status = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role',
            'phone', 'is_active', 'password', 'assigned_programs_count', 'trainer_status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'assigned_programs_count', 'trainer_status']

    def get_assigned_programs_count(self, obj):
        if hasattr(obj, 'led_trainings'):
            return obj.led_trainings.count()
        return 0

    def get_trainer_status(self, obj):
        if obj.role == User.Role.TRAINER:
            if hasattr(obj, 'trainer_application'):
                return obj.trainer_application.status
            return 'APPROVED'
        return None

    def validate_role(self, value):
        val = value.strip().upper()
        if val not in [User.Role.ADMIN, User.Role.TRAINER, User.Role.EMPLOYEE]:
            raise serializers.ValidationError(f"Invalid role '{value}'. Allowed roles are ADMIN, TRAINER, or EMPLOYEE.")
        return val

    def validate_email(self, value):
        email = value.strip().lower()
        qs = User.objects.filter(email=email)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return email

    def validate(self, attrs):
        # Protect the last active admin from being deactivated or having their role changed
        if self.instance and self.instance.role == User.Role.ADMIN and self.instance.is_active:
            new_is_active = attrs.get('is_active', self.instance.is_active)
            new_role = attrs.get('role', self.instance.role)
            if not new_is_active or new_role != User.Role.ADMIN:
                other_active_admins = User.objects.filter(
                    role=User.Role.ADMIN,
                    is_active=True
                ).exclude(pk=self.instance.pk).count()
                if other_active_admins == 0:
                    raise serializers.ValidationError(
                        "Cannot deactivate or change the role of the last active administrator account."
                    )
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password', None) or 'Capacita@2026'
        email = validated_data.pop('email').strip().lower()
        role = validated_data.get('role', User.Role.TRAINER)
        is_staff = (role == User.Role.ADMIN)

        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=validated_data.get('first_name', '').strip(),
            last_name=validated_data.get('last_name', '').strip(),
            role=role,
            phone=validated_data.get('phone', '').strip(),
            is_active=validated_data.get('is_active', True),
            is_staff=is_staff,
        )
        # If Admin creates a trainer directly, auto-approve their application record
        if role == User.Role.TRAINER and not hasattr(user, 'trainer_application'):
            TrainerApplication.objects.create(
                user=user,
                status=TrainerApplication.Status.APPROVED,
                introduction="Account provisioned directly by Administrator."
            )
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        if instance.role == User.Role.ADMIN:
            instance.is_staff = True
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Extends TokenObtainPair to return user details alongside the JWT token pair."""
    def validate(self, attrs):
        data = super().validate(attrs)
        trainer_status = None
        if self.user.role == User.Role.TRAINER:
            if hasattr(self.user, 'trainer_application'):
                trainer_status = self.user.trainer_application.status
            else:
                trainer_status = 'APPROVED'

        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'role': self.user.role,
            'trainer_status': trainer_status,
        }
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "New passwords do not match."})
        validate_password(attrs['new_password'], self.context['request'].user)
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, write_only=True)
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs


class RegisterSerializer(serializers.ModelSerializer):
    """
    Public Registration Serializer for Employees.
    Security policy: Public registration creates EMPLOYEE accounts only.
    No role field is accepted or permitted from client input.
    """
    password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone', 'password', 'confirm_password']

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return email

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        validate_password(attrs['password'])
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        validated_data.pop('role', None)

        email = validated_data['email'].strip().lower()

        with transaction.atomic():
            user = User.objects.create_user(
                email=email,
                password=validated_data['password'],
                first_name=validated_data.get('first_name', '').strip(),
                last_name=validated_data.get('last_name', '').strip(),
                role=User.Role.EMPLOYEE,
                phone=validated_data.get('phone', '').strip(),
            )

            from employees.models import Employee
            import uuid
            emp_id = f"EMP{user.id:04d}" if user.id else f"EMP{uuid.uuid4().hex[:6].upper()}"
            if Employee.objects.filter(employee_id=emp_id).exists():
                emp_id = f"EMP{uuid.uuid4().hex[:6].upper()}"

            Employee.objects.create(
                user=user,
                employee_id=emp_id,
                designation='Employee',
                phone=validated_data.get('phone', '').strip(),
            )

            return user


class TrainerApplicationSerializer(serializers.ModelSerializer):
    applicant_name = serializers.SerializerMethodField(read_only=True)
    applicant_email = serializers.EmailField(source='user.email', read_only=True)
    applicant_phone = serializers.CharField(source='user.phone', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True, default='Unassigned')
    department_code = serializers.CharField(source='department.code', read_only=True, default='')
    reviewed_by_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = TrainerApplication
        fields = [
            'id', 'user_id', 'applicant_name', 'applicant_email', 'applicant_phone',
            'department', 'department_name', 'department_code',
            'qualifications', 'experience', 'skills', 'introduction',
            'status', 'rejection_reason',
            'reviewed_by', 'reviewed_by_name', 'reviewed_at',
            'history', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user_id', 'applicant_name', 'applicant_email', 'applicant_phone',
            'department_name', 'department_code', 'reviewed_by', 'reviewed_by_name',
            'reviewed_at', 'history', 'created_at', 'updated_at'
        ]

    def get_applicant_name(self, obj):
        name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return name or obj.user.email

    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            name = f"{obj.reviewed_by.first_name} {obj.reviewed_by.last_name}".strip()
            return name or obj.reviewed_by.email
        return None


class TrainerApplySerializer(serializers.Serializer):
    first_name = serializers.CharField(required=True, max_length=150)
    last_name = serializers.CharField(required=True, max_length=150)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        required=False,
        allow_null=True
    )
    qualifications = serializers.CharField(required=True)
    experience = serializers.CharField(required=True)
    skills = serializers.CharField(required=True)
    introduction = serializers.CharField(required=True)

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return email

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        validate_password(attrs['password'])
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        email = validated_data.pop('email').strip().lower()
        password = validated_data.pop('password')
        first_name = validated_data.pop('first_name').strip()
        last_name = validated_data.pop('last_name').strip()
        phone = validated_data.pop('phone', '').strip()
        department = validated_data.pop('department_id', None)

        with transaction.atomic():
            user = User.objects.create_user(
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role=User.Role.TRAINER,
                phone=phone,
                is_active=True,
            )

            application = TrainerApplication.objects.create(
                user=user,
                department=department,
                qualifications=validated_data.get('qualifications', '').strip(),
                experience=validated_data.get('experience', '').strip(),
                skills=validated_data.get('skills', '').strip(),
                introduction=validated_data.get('introduction', '').strip(),
                status=TrainerApplication.Status.PENDING,
            )
            return application


class TrainerReapplySerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        required=False,
        allow_null=True
    )
    qualifications = serializers.CharField(required=True)
    experience = serializers.CharField(required=True)
    skills = serializers.CharField(required=True)
    introduction = serializers.CharField(required=True)
