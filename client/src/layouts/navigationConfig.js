import {
  LayoutDashboard,
  Building2,
  Users,
  BookOpen,
  GraduationCap,
  UserCheck,
  Award,
  CheckSquare,
  BarChart3,
  Settings,
  CalendarCheck,
  FileText,
  Clock,
  Compass,
  Calendar,
  HelpCircle,
  TrendingUp,
} from 'lucide-react'

export const ROLE_NAVIGATION = {
  ADMIN: {
    roleName: 'Administrator',
    roleBadge: 'Super Admin',
    navSections: [
      {
        title: 'Core Management',
        items: [
          { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, badge: null },
          { id: 'departments', label: 'Departments', icon: Building2, badge: null },
          { id: 'employees', label: 'Employee Directory', icon: Users, badge: null },
        ],
      },
      {
        title: 'Learning & Capacity',
        items: [
          { id: 'courses', label: 'Course Catalog', icon: BookOpen, badge: null },
          { id: 'training', label: 'Training Programs', icon: GraduationCap, badge: null },
          { id: 'enrollments', label: 'Enrollments', icon: UserCheck, badge: null },
          { id: 'competencies', label: 'Competency Framework', icon: Award, badge: null },
          { id: 'assessments', label: 'Assessments & Tests', icon: CheckSquare, badge: null },
          { id: 'certificates', label: 'Certificates', icon: Award, badge: null },
        ],
      },
      {
        title: 'Governance & Analytics',
        items: [
          { id: 'progress', label: 'Progress Dashboard', icon: BarChart3, badge: null },
          { id: 'reports', label: 'System Reports', icon: BarChart3, badge: null },
          { id: 'settings', label: 'Platform Settings', icon: Settings, badge: null },
        ],
      },
    ],
  },
  TRAINER: {
    roleName: 'Trainer / Instructor',
    roleBadge: 'Faculty',
    navSections: [
      {
        title: 'Instruction Hub',
        items: [
          { id: 'trainer-dashboard', label: 'Trainer Dashboard', icon: LayoutDashboard, badge: null },
          { id: 'my-batches', label: 'Assigned Batches', icon: CalendarCheck, badge: null },
          { id: 'materials', label: 'Learning Materials', icon: FileText, badge: null },
        ],
      },
      {
        title: 'Learner Evaluation',
        items: [
          { id: 'cohort-learners', label: 'Enrolled Trainees', icon: Users, badge: null },
          { id: 'progress-monitoring', label: 'Progress Monitoring', icon: TrendingUp, badge: null },
          { id: 'assessments-grading', label: 'Assessments & Grading', icon: CheckSquare, badge: null },
          { id: 'reports', label: 'Performance Reports', icon: BarChart3, badge: null },
          { id: 'attendance-activity', label: 'Session Attendance', icon: Clock, badge: null },
        ],
      },
    ],
  },
  EMPLOYEE: {
    roleName: 'Employee / Learner',
    roleBadge: 'Learner',
    navSections: [
      {
        title: 'My Learning Space',
        items: [
          { id: 'learner-dashboard', label: 'My Learning Portal', icon: Compass, badge: null },
          { id: 'my-courses', label: 'Enrolled Courses', icon: BookOpen, badge: null },
          { id: 'training-calendar', label: 'Scheduled Sessions', icon: Calendar, badge: null },
        ],
      },
      {
        title: 'Growth & Outcomes',
        items: [
          { id: 'my-assessments', label: 'My Assessments', icon: HelpCircle, badge: null },
          { id: 'my-competencies', label: 'Skills & Competencies', icon: TrendingUp, badge: null },
          { id: 'my-certificates', label: 'Earned Certificates', icon: Award, badge: null },
        ],
      },
    ],
  },
}
