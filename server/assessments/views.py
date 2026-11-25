from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Max, Count, Q
from decimal import Decimal
from .models import Assessment, Question, AssessmentSubmission, SubmissionAnswer
from .serializers import (
    AssessmentSerializer,
    QuestionSerializer,
    AssessmentSubmissionSerializer,
    SubmissionAnswerSerializer
)
from .permissions import AssessmentPermission, SubmissionPermission
from enrollments.models import Enrollment


class AssessmentViewSet(viewsets.ModelViewSet):
    """API endpoint for managing assessments, question sets, and test administration."""
    queryset = Assessment.objects.select_related('course', 'training_program', 'created_by').prefetch_related('questions').all()
    serializer_class = AssessmentSerializer
    permission_classes = [AssessmentPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'title', 'description', 'course__title', 'training_program__title']
    ordering_fields = ['code', 'created_at', 'passing_percentage']
    ordering = ['code']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.is_authenticated and user.role == 'TRAINER':
            queryset = queryset.filter(
                Q(training_program__lead_trainer=user) | Q(created_by=user)
            ).distinct()
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def add_question(self, request, pk=None):
        """Add an objective or subjective question to an assessment."""
        assessment = self.get_object()
        data = request.data.copy()
        data['assessment'] = assessment.id

        if 'order' not in data:
            data['order'] = assessment.questions.count() + 1

        serializer = QuestionSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def delete_question(self, request, pk=None):
        """Remove a question from an assessment."""
        assessment = self.get_object()
        question_id = request.data.get('question_id')
        try:
            q = assessment.questions.get(id=question_id)
            q.delete()
            return Response({"detail": "Question deleted successfully."})
        except Question.DoesNotExist:
            return Response({"detail": "Question not found."}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def my_assigned(self, request):
        """Returns assessments corresponding to courses or programs where the logged-in employee is enrolled."""
        user = request.user
        if not hasattr(user, 'employee_profile'):
            return Response({"detail": "Employee profile not found."}, status=status.HTTP_404_NOT_FOUND)

        employee = user.employee_profile
        # Find enrolled courses and programs
        enrolled_course_ids = Enrollment.objects.filter(
            employee=employee, course__isnull=False
        ).values_list('course_id', flat=True)

        enrolled_program_ids = list(Enrollment.objects.filter(
            employee=employee, training_program__isnull=False
        ).exclude(status=Enrollment.Status.DROPPED).values_list('training_program_id', flat=True))

        # Also include courses belonging to enrolled training programs
        from training.models import TrainingProgram
        program_course_ids = list(TrainingProgram.objects.filter(
            id__in=enrolled_program_ids
        ).values_list('courses__id', flat=True))
        all_course_ids = set(list(enrolled_course_ids) + [cid for cid in program_course_ids if cid])

        # Active assessments matching enrollment or generally active
        assessments = Assessment.objects.filter(
            is_active=True
        ).filter(
            Q(course_id__in=all_course_ids) |
            Q(training_program_id__in=enrolled_program_ids) |
            (Q(course__isnull=True) & Q(training_program__isnull=True))
        ).distinct()

        serializer = self.get_serializer(assessments, many=True)
        data = serializer.data

        # Annotate employee's previous attempts and pass status
        for item in data:
            subs = AssessmentSubmission.objects.filter(
                assessment_id=item['id'], employee=employee
            )
            item['attempt_count'] = subs.count()
            item['has_passed'] = subs.filter(is_passed=True).exists()
            best_sub = subs.order_by('-score').first()
            item['best_score'] = best_sub.score if best_sub else None
            item['best_percentage'] = best_sub.percentage if best_sub else None

        return Response(data)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """
        Record and evaluate an employee's assessment submission.
        Body: { answers: { <question_id>: <selected_option_or_text> } }
        """
        assessment = self.get_object()
        user = request.user

        if not hasattr(user, 'employee_profile'):
            return Response({"detail": "Only registered employees can submit assessments."}, status=status.HTTP_403_FORBIDDEN)

        employee = user.employee_profile

        # Validate max attempts
        existing_attempts = AssessmentSubmission.objects.filter(
            assessment=assessment, employee=employee
        ).count()

        if existing_attempts >= assessment.max_attempts:
            return Response(
                {"detail": f"Maximum allowed attempts ({assessment.max_attempts}) reached for this assessment."},
                status=status.HTTP_400_BAD_REQUEST
            )

        answers_dict = request.data.get('answers', {})
        questions = assessment.questions.all()

        total_points = Decimal('0')
        earned_score = Decimal('0')

        # Create submission record
        submission = AssessmentSubmission.objects.create(
            assessment=assessment,
            employee=employee,
            attempt_number=existing_attempts + 1,
            status=AssessmentSubmission.Status.EVALUATED,
            submitted_at=timezone.now()
        )

        has_written_questions = False

        for q in questions:
            total_points += Decimal(str(q.points))
            given_ans = answers_dict.get(str(q.id))

            is_correct = False
            points_awarded = Decimal('0')

            if q.question_type in [Question.QuestionType.SINGLE_CHOICE, Question.QuestionType.TRUE_FALSE]:
                if given_ans is not None and str(given_ans).strip().lower() == str(q.correct_answer).strip().lower():
                    is_correct = True
                    points_awarded = Decimal(str(q.points))
            elif q.question_type == Question.QuestionType.MULTIPLE_CHOICE:
                correct_set = set(q.correct_answer if isinstance(q.correct_answer, list) else [q.correct_answer])
                given_set = set(given_ans if isinstance(given_ans, list) else [given_ans])
                if correct_set == given_set:
                    is_correct = True
                    points_awarded = Decimal(str(q.points))
            else:
                # SHORT_ANSWER requires trainer evaluation
                has_written_questions = True
                is_correct = None
                points_awarded = Decimal('0')

            earned_score += points_awarded

            SubmissionAnswer.objects.create(
                submission=submission,
                question=q,
                selected_answer=given_ans,
                is_correct=is_correct,
                points_awarded=points_awarded
            )

        pct = Decimal('0')
        if total_points > 0:
            pct = round((earned_score / total_points) * Decimal('100'), 2)

        is_passed = pct >= Decimal(str(assessment.passing_percentage))

        submission.score = earned_score
        submission.total_points = total_points
        submission.percentage = pct
        submission.is_passed = is_passed

        if has_written_questions:
            submission.status = AssessmentSubmission.Status.SUBMITTED
        else:
            submission.status = AssessmentSubmission.Status.EVALUATED
            submission.evaluated_at = timezone.now()

        submission.save()

        serializer = AssessmentSubmissionSerializer(submission)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AssessmentSubmissionViewSet(viewsets.ModelViewSet):
    """API endpoint for reviewing submission results and trainer manual grading."""
    queryset = AssessmentSubmission.objects.select_related(
        'assessment__course', 'assessment__training_program', 'employee__user', 'employee__department', 'evaluated_by'
    ).prefetch_related('answers__question').all()
    serializer_class = AssessmentSubmissionSerializer
    permission_classes = [SubmissionPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'employee__user__first_name', 'employee__user__last_name',
        'employee__employee_id', 'assessment__code', 'assessment__title'
    ]
    ordering_fields = ['submitted_at', 'score', 'percentage', 'status']
    ordering = ['-submitted_at']

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        if user.is_authenticated and user.role == 'EMPLOYEE':
            return queryset.filter(employee__user=user)

        if user.is_authenticated and user.role == 'TRAINER':
            queryset = queryset.filter(
                Q(assessment__training_program__lead_trainer=user) | Q(assessment__created_by=user)
            ).distinct()

        assessment_id = self.request.query_params.get('assessment')
        if assessment_id:
            queryset = queryset.filter(assessment_id=assessment_id)

        employee_id = self.request.query_params.get('employee')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)

        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        is_passed = self.request.query_params.get('is_passed')
        if is_passed is not None:
            queryset = queryset.filter(is_passed=is_passed.lower() == 'true')

        return queryset

    @action(detail=True, methods=['post'])
    def evaluate(self, request, pk=None):
        """
        Trainer manual grading or feedback override.
        Body: {
            trainer_feedback: 'Well done',
            question_grades: { <answer_id>: { points_awarded: 2, comment: 'Good' } }
        }
        """
        submission = self.get_object()
        trainer_feedback = request.data.get('trainer_feedback', '')
        question_grades = request.data.get('question_grades', {})

        if trainer_feedback:
            submission.trainer_feedback = trainer_feedback

        # Update specific question points if provided
        if question_grades:
            recalculated_score = Decimal('0')
            for answer in submission.answers.all():
                qg = question_grades.get(str(answer.id))
                if qg:
                    pts = Decimal(str(qg.get('points_awarded', answer.points_awarded)))
                    answer.points_awarded = pts
                    answer.evaluator_comment = qg.get('comment', answer.evaluator_comment)
                    answer.is_correct = pts > 0
                    answer.save()
                recalculated_score += Decimal(str(answer.points_awarded))

            submission.score = recalculated_score
            if submission.total_points > 0:
                submission.percentage = round(
                    (recalculated_score / submission.total_points) * Decimal('100'), 2
                )
            submission.is_passed = submission.percentage >= Decimal(str(submission.assessment.passing_percentage))

        submission.status = AssessmentSubmission.Status.EVALUATED
        submission.evaluated_by = request.user
        submission.evaluated_at = timezone.now()
        submission.save()

        submission.refresh_from_db()
        serializer = self.get_serializer(submission)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_submissions(self, request):
        """Employee endpoint for viewing all historical submission attempts and grades."""
        user = request.user
        if not hasattr(user, 'employee_profile'):
            return Response({"detail": "Employee profile not found."}, status=status.HTTP_404_NOT_FOUND)

        subs = AssessmentSubmission.objects.filter(
            employee=user.employee_profile
        ).select_related('assessment', 'evaluated_by')

        serializer = self.get_serializer(subs, many=True)
        return Response(serializer.data)
