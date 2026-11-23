from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.utils import timezone
from django.db.models import Count, Avg, Q

from accounts.models import User
from employees.models import Employee
from departments.models import Department
from courses.models import Course, CourseModule
from training.models import TrainingProgram
from enrollments.models import Enrollment
from progress.models import ModuleProgress
from assessments.models import Assessment, AssessmentSubmission
from certificates.models import Certificate


class AdminDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({'detail': 'Administrator access required.'}, status=status.HTTP_403_FORBIDDEN)

        total_employees = Employee.objects.count()
        total_departments = Department.objects.count()
        total_courses = Course.objects.count()
        total_training_programs = TrainingProgram.objects.count()

        # Training participation
        training_enrollments = Enrollment.objects.filter(training_program__isnull=False)
        total_training_enrollments = training_enrollments.count()
        active_trainees = training_enrollments.values('employee').distinct().count()
        completed_trainings = training_enrollments.filter(status=Enrollment.Status.COMPLETED).count()

        # Course completion information
        course_enrollments = Enrollment.objects.filter(course__isnull=False)
        total_course_enrollments = course_enrollments.count()
        completed_courses = course_enrollments.filter(status=Enrollment.Status.COMPLETED).count()
        in_progress_courses = course_enrollments.filter(status=Enrollment.Status.IN_PROGRESS).count()
        course_completion_rate = round((completed_courses / total_course_enrollments * 100), 1) if total_course_enrollments > 0 else 0

        # Employee learning overview
        enrolled_status_count = Enrollment.objects.filter(status=Enrollment.Status.ENROLLED).count()
        in_progress_status_count = Enrollment.objects.filter(status=Enrollment.Status.IN_PROGRESS).count()
        completed_status_count = Enrollment.objects.filter(status=Enrollment.Status.COMPLETED).count()
        dropped_status_count = Enrollment.objects.filter(status=Enrollment.Status.DROPPED).count()
        active_learners = Enrollment.objects.values('employee').distinct().count()
        total_modules_completed = ModuleProgress.objects.filter(is_completed=True).count()

        # Recent activities feed
        activities = []
        recent_enrollments = Enrollment.objects.select_related('employee__user', 'course', 'training_program').order_by('-enrolled_at')[:5]
        for enr in recent_enrollments:
            target = enr.course.title if enr.course else (enr.training_program.title if enr.training_program else 'Curriculum')
            activities.append({
                'id': f"enr-{enr.id}",
                'type': 'ENROLLMENT',
                'title': f"New Enrollment: {enr.employee.user.first_name} {enr.employee.user.last_name}",
                'description': f"Enrolled in {target} ({enr.get_status_display()})",
                'timestamp': enr.enrolled_at.isoformat() if enr.enrolled_at else None,
            })

        recent_submissions = AssessmentSubmission.objects.select_related('employee__user', 'assessment').order_by('-submitted_at')[:5]
        for sub in recent_submissions:
            outcome = 'PASSED' if sub.is_passed else ('EVALUATED' if sub.status == 'EVALUATED' else 'SUBMITTED')
            score_disp = sub.percentage if sub.percentage is not None else (sub.score if sub.score is not None else 0)
            activities.append({
                'id': f"sub-{sub.id}",
                'type': 'ASSESSMENT',
                'title': f"Assessment Submitted: {sub.assessment.title}",
                'description': f"{sub.employee.user.first_name} {sub.employee.user.last_name} scored {score_disp}% ({outcome})",
                'timestamp': sub.submitted_at.isoformat() if sub.submitted_at else None,
            })

        recent_certs = Certificate.objects.select_related('employee__user', 'course', 'training_program').order_by('-issued_at')[:5]
        for cert in recent_certs:
            activities.append({
                'id': f"cert-{cert.id}",
                'type': 'CERTIFICATE',
                'title': f"Certificate Issued: {cert.certificate_number}",
                'description': f"Awarded to {cert.employee.user.first_name} {cert.employee.user.last_name} ({cert.title})",
                'timestamp': cert.issued_at.isoformat() if cert.issued_at else None,
            })

        # Sort activities descending by timestamp
        activities.sort(key=lambda x: x['timestamp'] or '', reverse=True)
        activities = activities[:10]

        return Response({
            'total_employees': total_employees,
            'total_departments': total_departments,
            'total_courses': total_courses,
            'total_training_programs': total_training_programs,
            'training_participation': {
                'total_enrollments': total_training_enrollments,
                'active_trainees': active_trainees,
                'completed_trainings': completed_trainings,
            },
            'course_completion': {
                'total_enrollments': total_course_enrollments,
                'completed': completed_courses,
                'in_progress': in_progress_courses,
                'completion_rate': course_completion_rate,
            },
            'employee_learning_overview': {
                'enrolled': enrolled_status_count,
                'in_progress': in_progress_status_count,
                'completed': completed_status_count,
                'dropped': dropped_status_count,
                'active_learners': active_learners,
                'total_modules_completed': total_modules_completed,
            },
            'recent_activities': activities,
        })


class TrainerDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['TRAINER', 'ADMIN']:
            return Response({'detail': 'Trainer access required.'}, status=status.HTTP_403_FORBIDDEN)

        user = request.user
        # Programs led by trainer
        programs_qs = TrainingProgram.objects.filter(lead_trainer=user)
        if not programs_qs.exists() and user.role == 'ADMIN':
            programs_qs = TrainingProgram.objects.all()

        assigned_programs_data = []
        all_program_ids = list(programs_qs.values_list('id', flat=True))

        for prog in programs_qs:
            enr_count = Enrollment.objects.filter(training_program=prog).count()
            comp_count = Enrollment.objects.filter(training_program=prog, status=Enrollment.Status.COMPLETED).count()
            assigned_programs_data.append({
                'id': prog.id,
                'code': prog.code,
                'title': prog.title,
                'status': prog.status,
                'start_date': prog.start_date,
                'end_date': prog.end_date,
                'location_or_link': prog.location_or_link,
                'enrolled_count': enr_count,
                'completed_count': comp_count,
            })

        # Assigned employees across trainer programs
        trainer_enrollments = Enrollment.objects.filter(training_program_id__in=all_program_ids).select_related('employee__user', 'employee__department')
        assigned_emp_ids = set(trainer_enrollments.values_list('employee_id', flat=True))
        assigned_employees_count = len(assigned_emp_ids)

        assigned_employees_list = []
        for emp in Employee.objects.filter(id__in=assigned_emp_ids).select_related('user', 'department')[:10]:
            assigned_employees_list.append({
                'id': emp.id,
                'employee_id': emp.employee_id,
                'name': f"{emp.user.first_name} {emp.user.last_name}",
                'email': emp.user.email,
                'department': emp.department.name if emp.department else 'Unassigned',
                'designation': emp.designation or '',
            })

        # Upcoming training activities
        today = timezone.now().date()
        upcoming = []
        for prog in programs_qs.filter(status__in=[TrainingProgram.Status.SCHEDULED, TrainingProgram.Status.IN_PROGRESS]):
            upcoming.append({
                'id': prog.id,
                'title': prog.title,
                'code': prog.code,
                'status': prog.status,
                'start_date': prog.start_date,
                'end_date': prog.end_date,
                'location': prog.location_or_link or 'Virtual Classroom',
            })

        # Learner progress in trainer's domain
        total_modules_completed = ModuleProgress.objects.filter(
            enrollment__training_program_id__in=all_program_ids,
            is_completed=True
        ).count()
        total_enrollments_count = len(trainer_enrollments)
        completed_enrollments_count = trainer_enrollments.filter(status=Enrollment.Status.COMPLETED).count()
        cohort_completion_rate = round((completed_enrollments_count / total_enrollments_count * 100), 1) if total_enrollments_count > 0 else 0

        # Assessment metrics
        assessments_qs = Assessment.objects.filter(
            Q(training_program_id__in=all_program_ids) | Q(created_by=user)
        )
        if not assessments_qs.exists() and user.role == 'ADMIN':
            assessments_qs = Assessment.objects.all()

        assessment_ids = list(assessments_qs.values_list('id', flat=True))
        submissions_qs = AssessmentSubmission.objects.filter(assessment_id__in=assessment_ids)
        total_submissions = submissions_qs.count()
        pending_evaluations = submissions_qs.filter(Q(evaluated_at__isnull=True) | Q(status=AssessmentSubmission.Status.SUBMITTED)).count()
        passed_submissions = submissions_qs.filter(is_passed=True).count()
        avg_score_res = submissions_qs.aggregate(avg=Avg('percentage'))['avg']
        if avg_score_res is None:
            avg_score_res = submissions_qs.aggregate(avg=Avg('score'))['avg']
        avg_score = round(float(avg_score_res), 1) if avg_score_res is not None else 0

        return Response({
            'assigned_programs_count': len(assigned_programs_data),
            'assigned_programs': assigned_programs_data,
            'assigned_employees_count': assigned_employees_count,
            'assigned_employees': assigned_employees_list,
            'upcoming_activities': upcoming,
            'learner_progress': {
                'total_enrolled': total_enrollments_count,
                'completed': completed_enrollments_count,
                'completion_rate': cohort_completion_rate,
                'modules_completed': total_modules_completed,
            },
            'assessment_info': {
                'total_assessments': assessments_qs.count(),
                'total_submissions': total_submissions,
                'pending_evaluations': pending_evaluations,
                'passed_submissions': passed_submissions,
                'average_score': avg_score,
            }
        })


class EmployeeDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if not hasattr(user, 'employee_profile'):
            return Response({'detail': 'Employee profile required.'}, status=status.HTTP_404_NOT_FOUND)

        employee = user.employee_profile

        # Course enrollments
        course_enrs = Enrollment.objects.filter(employee=employee, course__isnull=False).select_related('course')
        assigned_courses = []
        completed_courses = []

        for enr in course_enrs:
            c = enr.course
            total_m = c.modules.count()
            comp_m = enr.module_progress.filter(is_completed=True).count()
            pct = round((comp_m / total_m * 100), 1) if total_m > 0 else 0
            item = {
                'enrollment_id': enr.id,
                'course_id': c.id,
                'code': c.code,
                'title': c.title,
                'category': c.category,
                'status': enr.status,
                'progress_percentage': pct,
                'completed_modules': comp_m,
                'total_modules': total_m,
                'enrolled_at': enr.enrolled_at,
                'completed_at': enr.completed_at,
            }
            assigned_courses.append(item)
            if enr.status == Enrollment.Status.COMPLETED:
                completed_courses.append(item)

        # Active training programs
        trn_enrs = Enrollment.objects.filter(employee=employee, training_program__isnull=False).select_related('training_program')
        active_trainings = []
        for enr in trn_enrs:
            tp = enr.training_program
            active_trainings.append({
                'enrollment_id': enr.id,
                'training_id': tp.id,
                'code': tp.code,
                'title': tp.title,
                'status': tp.status,
                'enrollment_status': enr.status,
                'start_date': tp.start_date,
                'end_date': tp.end_date,
                'location': tp.location_or_link or 'Virtual Classroom',
            })

        # Overall progress
        total_courses_count = len(assigned_courses)
        completed_count = len(completed_courses)
        total_mods = sum(c['total_modules'] for c in assigned_courses)
        comp_mods = sum(c['completed_modules'] for c in assigned_courses)
        overall_progress = round((comp_mods / total_mods * 100), 1) if total_mods > 0 else 0

        # Pending assessments (assessments for enrolled courses/programs not yet passed)
        enrolled_course_ids = [c['course_id'] for c in assigned_courses]
        enrolled_trn_ids = [t['training_id'] for t in active_trainings]

        relevant_assessments = Assessment.objects.filter(
            Q(course_id__in=enrolled_course_ids) | Q(training_program_id__in=enrolled_trn_ids)
        ).select_related('course', 'training_program')

        passed_asm_ids = set(
            AssessmentSubmission.objects.filter(
                employee=employee,
                is_passed=True
            ).values_list('assessment_id', flat=True)
        )

        pending_assessments = []
        for asm in relevant_assessments:
            if asm.id not in passed_asm_ids:
                pending_assessments.append({
                    'id': asm.id,
                    'code': asm.code,
                    'title': asm.title,
                    'passing_percentage': asm.passing_percentage,
                    'time_limit_minutes': asm.time_limit_minutes,
                    'course_or_program': asm.course.title if asm.course else (asm.training_program.title if asm.training_program else 'General'),
                })

        # Earned certificates
        certs = Certificate.objects.filter(employee=employee, status=Certificate.Status.ACTIVE).select_related('course', 'training_program')
        earned_certificates = []
        for cert in certs:
            earned_certificates.append({
                'id': cert.id,
                'certificate_number': cert.certificate_number,
                'verification_code': cert.verification_code,
                'title': cert.title,
                'target': cert.course.title if cert.course else (cert.training_program.title if cert.training_program else 'Curriculum'),
                'issued_at': cert.issued_at,
                'grade_score': cert.grade_score,
            })

        return Response({
            'assigned_courses': assigned_courses,
            'active_training_programs': active_trainings,
            'learning_progress': {
                'total_courses': total_courses_count,
                'completed_courses': completed_count,
                'overall_progress': overall_progress,
                'total_modules': total_mods,
                'completed_modules': comp_mods,
            },
            'pending_assessments': pending_assessments,
            'completed_courses': completed_courses,
            'earned_certificates': earned_certificates,
        })


class ReportsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['ADMIN', 'TRAINER']:
            return Response({'detail': 'Administrator or Trainer access required for reports.'}, status=status.HTTP_403_FORBIDDEN)

        # 1. Department-wise Training Participation
        dept_report = []
        for dept in Department.objects.all():
            emp_ids = dept.employees.values_list('id', flat=True)
            emp_count = len(emp_ids)
            enrs = Enrollment.objects.filter(employee_id__in=emp_ids)
            total_enr = enrs.count()
            comp_enr = enrs.filter(status=Enrollment.Status.COMPLETED).count()
            rate = round((comp_enr / total_enr * 100), 1) if total_enr > 0 else 0
            dept_report.append({
                'department_id': dept.id,
                'department_name': dept.name,
                'employee_count': emp_count,
                'total_enrollments': total_enr,
                'completed_enrollments': comp_enr,
                'completion_rate': rate,
            })

        # 2. Employee Learning Progress
        emp_report = []
        for emp in Employee.objects.select_related('user', 'department').all():
            enrs = Enrollment.objects.filter(employee=emp)
            tot = enrs.count()
            comp = enrs.filter(status=Enrollment.Status.COMPLETED).count()
            in_prog = enrs.filter(status=Enrollment.Status.IN_PROGRESS).count()
            mods_done = ModuleProgress.objects.filter(enrollment__employee=emp, is_completed=True).count()
            certs_count = Certificate.objects.filter(employee=emp, status=Certificate.Status.ACTIVE).count()
            emp_report.append({
                'id': emp.id,
                'employee_id': emp.employee_id,
                'name': f"{emp.user.first_name} {emp.user.last_name}",
                'department': emp.department.name if emp.department else 'Unassigned',
                'designation': emp.designation or '',
                'total_enrollments': tot,
                'completed': comp,
                'in_progress': in_prog,
                'modules_completed': mods_done,
                'certificates_count': certs_count,
            })

        # 3. Course Completion Report
        course_report = []
        for c in Course.objects.all():
            enrs = Enrollment.objects.filter(course=c)
            tot = enrs.count()
            comp = enrs.filter(status=Enrollment.Status.COMPLETED).count()
            in_prog = enrs.filter(status=Enrollment.Status.IN_PROGRESS).count()
            rate = round((comp / tot * 100), 1) if tot > 0 else 0
            course_report.append({
                'course_id': c.id,
                'code': c.code,
                'title': c.title,
                'category': c.category,
                'level': c.level,
                'total_enrolled': tot,
                'in_progress': in_prog,
                'completed': comp,
                'completion_rate': rate,
            })

        # 4. Training Activity Report
        training_report = []
        for tp in TrainingProgram.objects.select_related('lead_trainer').all():
            enrs = Enrollment.objects.filter(training_program=tp)
            tot = enrs.count()
            comp = enrs.filter(status=Enrollment.Status.COMPLETED).count()
            trainer_name = f"{tp.lead_trainer.first_name} {tp.lead_trainer.last_name}" if tp.lead_trainer else 'Unassigned'
            training_report.append({
                'training_id': tp.id,
                'code': tp.code,
                'title': tp.title,
                'status': tp.status,
                'lead_trainer': trainer_name,
                'start_date': tp.start_date,
                'end_date': tp.end_date,
                'max_participants': tp.max_participants,
                'enrolled_participants': tot,
                'completed_participants': comp,
            })

        # 5. Assessment Performance Report
        assessment_report = []
        for asm in Assessment.objects.select_related('course', 'training_program').all():
            subs = AssessmentSubmission.objects.filter(assessment=asm)
            tot_subs = subs.count()
            passed = subs.filter(is_passed=True).count()
            failed = subs.filter(is_passed=False, status=AssessmentSubmission.Status.EVALUATED).count()
            pass_rate = round((passed / tot_subs * 100), 1) if tot_subs > 0 else 0
            avg_score_res = subs.aggregate(avg=Avg('percentage'))['avg']
            if avg_score_res is None:
                avg_score_res = subs.aggregate(avg=Avg('score'))['avg']
            avg_score = round(float(avg_score_res), 1) if avg_score_res is not None else 0
            target = asm.course.title if asm.course else (asm.training_program.title if asm.training_program else 'General')
            assessment_report.append({
                'assessment_id': asm.id,
                'code': asm.code,
                'title': asm.title,
                'target': target,
                'passing_percentage': asm.passing_percentage,
                'total_submissions': tot_subs,
                'passed_count': passed,
                'failed_count': failed,
                'pass_rate': pass_rate,
                'average_score': avg_score,
            })

        return Response({
            'department_participation': dept_report,
            'employee_progress': emp_report,
            'course_completion': course_report,
            'training_activities': training_report,
            'assessment_performance': assessment_report,
        })
