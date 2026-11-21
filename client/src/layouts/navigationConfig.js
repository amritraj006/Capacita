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
          { id: 'departments', label: 'Departments', icon: Building2, badge: '6' },
          { id: 'employees', label: 'Employee Directory', icon: Users, badge: null },
        ],
      },
      {
        title: 'Learning & Capacity',
        items: [
          { id: 'courses', label: 'Course Catalog', icon: BookOpen, badge: null },
          { id: 'training', label: 'Training Programs', icon: GraduationCap, badge: '3 Active' },
          { id: 'enrollments', label: 'Enrollments', icon: UserCheck, badge: null },
          { id: 'competencies', label: 'Competency Framework', icon: Award, badge: null },
        ],
      },
      {
        title: 'Governance & Analytics',
        items: [
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
          { id: 'my-batches', label: 'Assigned Batches', icon: CalendarCheck, badge: '2 Upcoming' },
          { id: 'materials', label: 'Learning Materials', icon: FileText, badge: null },
        ],
      },
      {
        title: 'Learner Evaluation',
        items: [
          { id: 'cohort-learners', label: 'Enrolled Trainees', icon: Users, badge: null },
          { id: 'assessments-grading', label: 'Assessments & Grading', icon: CheckSquare, badge: '12 Pending' },
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
          { id: 'my-courses', label: 'Enrolled Courses', icon: BookOpen, badge: '4 In Progress' },
          { id: 'training-calendar', label: 'Scheduled Sessions', icon: Calendar, badge: 'Tomorrow' },
        ],
      },
      {
        title: 'Growth & Outcomes',
        items: [
          { id: 'my-assessments', label: 'My Assessments', icon: HelpCircle, badge: null },
          { id: 'my-competencies', label: 'Skills & Competencies', icon: TrendingUp, badge: 'Level 3' },
          { id: 'my-certificates', label: 'Earned Certificates', icon: Award, badge: '2 Verified' },
        ],
      },
    ],
  },
}
