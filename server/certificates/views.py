import uuid
from django.db import IntegrityError
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Certificate
from .serializers import CertificateSerializer, PublicCertificateSerializer
from .permissions import CertificatePermission
from enrollments.models import Enrollment
from employees.models import Employee


def _build_certificate_number(course=None, training_program=None):
    year = timezone.now().year
    suffix = str(uuid.uuid4())[:8].upper()
    if course:
        segment = course.code.replace('-', '').upper()
    elif training_program:
        code_val = getattr(training_program, 'code', '') or ''
        segment = code_val.replace('-', '').upper() if code_val else 'TRN'
    else:
        segment = 'GEN'
    return f"CAP-CERT-{year}-{segment}-{suffix}"


class CertificateViewSet(viewsets.ModelViewSet):
    serializer_class = CertificateSerializer
    permission_classes = [CertificatePermission]

    def get_queryset(self):
        user = self.request.user
        queryset = Certificate.objects.select_related(
            'employee__user',
            'employee__department',
            'course',
            'training_program',
            'enrollment',
            'issued_by',
        ).all()

        if user.role == 'EMPLOYEE':
            if hasattr(user, 'employee_profile'):
                queryset = queryset.filter(employee=user.employee_profile)
            else:
                queryset = queryset.none()
        elif user.role in ['ADMIN', 'TRAINER']:
            employee_id = self.request.query_params.get('employee')
            course_id = self.request.query_params.get('course')
            program_id = self.request.query_params.get('training_program')
            cert_status = self.request.query_params.get('status')

            if employee_id:
                queryset = queryset.filter(employee__id=employee_id)
            if course_id:
                queryset = queryset.filter(course__id=course_id)
            if program_id:
                queryset = queryset.filter(training_program__id=program_id)
            if cert_status:
                queryset = queryset.filter(status=cert_status.upper())

        return queryset

    # ------------------------------------------------------------------
    # my_certificates — employee scoped shortcut
    # ------------------------------------------------------------------
    @action(detail=False, methods=['get'], url_path='my_certificates')
    def my_certificates(self, request):
        user = request.user
        if user.role != 'EMPLOYEE':
            return Response({'detail': 'Only employees can access this endpoint.'}, status=status.HTTP_403_FORBIDDEN)
        if not hasattr(user, 'employee_profile'):
            return Response({'detail': 'Employee profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        certs = Certificate.objects.filter(employee=user.employee_profile).select_related(
            'employee__user', 'employee__department', 'course', 'training_program', 'issued_by'
        ).order_by('-issued_at')
        serializer = CertificateSerializer(certs, many=True)
        return Response(serializer.data)

    # ------------------------------------------------------------------
    # generate — Admin creates certificate for a completed enrollment
    # ------------------------------------------------------------------
    @action(detail=False, methods=['post'], url_path='generate', permission_classes=[permissions.IsAuthenticated])
    def generate(self, request):
        user = request.user
        if user.role != 'ADMIN':
            return Response({'detail': 'Only administrators can generate certificates.'}, status=status.HTTP_403_FORBIDDEN)

        enrollment_id = request.data.get('enrollment_id')
        if not enrollment_id:
            return Response({'detail': 'enrollment_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            enrollment = Enrollment.objects.select_related(
                'employee__user', 'employee__department', 'course', 'training_program'
            ).get(id=enrollment_id)
        except Enrollment.DoesNotExist:
            return Response({'detail': 'Enrollment not found.'}, status=status.HTTP_404_NOT_FOUND)

        if enrollment.status != Enrollment.Status.COMPLETED:
            return Response(
                {'detail': (
                    f'Enrollment is not completed (current status: {enrollment.status}). '
                    'Certificate can only be issued for completed enrollments.'
                )},
                status=status.HTTP_400_BAD_REQUEST
            )

        employee = enrollment.employee
        course = enrollment.course
        training_program = enrollment.training_program

        # Duplicate guard (application-level, DB constraint is secondary)
        existing_qs = Certificate.objects.filter(employee=employee, status=Certificate.Status.ACTIVE)
        if course:
            existing_qs = existing_qs.filter(course=course)
        elif training_program:
            existing_qs = existing_qs.filter(training_program=training_program)

        if existing_qs.exists():
            existing = existing_qs.first()
            serializer = CertificateSerializer(existing)
            return Response(
                {'detail': 'An active certificate already exists for this enrollment.', 'certificate': serializer.data},
                status=status.HTTP_200_OK
            )

        if course:
            cert_title = f"Certificate of Completion — {course.title}"
        elif training_program:
            cert_title = f"Certificate of Completion — {training_program.title}"
        else:
            cert_title = "Certificate of Completion"

        cert_number = _build_certificate_number(course=course, training_program=training_program)

        grade_score = None
        try:
            from assessments.models import AssessmentSubmission
            submission = AssessmentSubmission.objects.filter(
                enrollment=enrollment,
                result='PASSED'
            ).order_by('-score').first()
            if submission:
                grade_score = submission.score
        except Exception:
            pass

        try:
            cert = Certificate.objects.create(
                certificate_number=cert_number,
                title=cert_title,
                employee=employee,
                course=course,
                training_program=training_program,
                enrollment=enrollment,
                issued_by=user,
                grade_score=grade_score,
                metadata={
                    'generated_by': user.email,
                    'enrollment_status_at_issue': enrollment.status,
                    'completed_at': enrollment.completed_at.isoformat() if enrollment.completed_at else None,
                }
            )
        except IntegrityError:
            return Response(
                {'detail': 'A certificate for this employee and course/program already exists.'},
                status=status.HTTP_409_CONFLICT
            )

        serializer = CertificateSerializer(cert)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # ------------------------------------------------------------------
    # verify — Public endpoint, no authentication required
    # ------------------------------------------------------------------
    @action(detail=False, methods=['get'], url_path='verify', permission_classes=[permissions.AllowAny])
    def verify(self, request):
        code = request.query_params.get('code', '').strip().upper()
        if not code:
            return Response(
                {'detail': 'Verification code is required (use ?code=XXXX).'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            cert = Certificate.objects.select_related(
                'employee__user', 'employee__department', 'course', 'training_program'
            ).get(verification_code=code)
        except Certificate.DoesNotExist:
            return Response(
                {'detail': 'No certificate found with the given verification code.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = PublicCertificateSerializer(cert)
        return Response({
            'valid': cert.status == Certificate.Status.ACTIVE,
            'certificate': serializer.data,
        })

    # ------------------------------------------------------------------
    # revoke — Admin only
    # ------------------------------------------------------------------
    @action(detail=True, methods=['post'], url_path='revoke')
    def revoke(self, request, pk=None):
        user = request.user
        if user.role != 'ADMIN':
            return Response({'detail': 'Only administrators can revoke certificates.'}, status=status.HTTP_403_FORBIDDEN)
        cert = self.get_object()
        if cert.status == Certificate.Status.REVOKED:
            return Response({'detail': 'Certificate is already revoked.'}, status=status.HTTP_400_BAD_REQUEST)
        cert.status = Certificate.Status.REVOKED
        cert.save(update_fields=['status', 'updated_at'])
        serializer = CertificateSerializer(cert)
        return Response(serializer.data)
