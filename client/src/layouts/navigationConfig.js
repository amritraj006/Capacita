import {
  LayoutDashboard,
  Building2,
  Users,
  UserCog,
  BookOpen,
  GraduationCap,
  UserCheck,
  Award,
  CheckSquare,
  Compass,
  HelpCircle,
  User,
  ClipboardCheck,
} from 'lucide-react'

export const ROLE_NAVIGATION = {
  ADMIN: {
    roleName: 'Administrator',
    roleBadge: 'Admin',
    navSections: [
      {
        title: 'Administration',
        items: [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
          { id: 'trainer-applications', label: 'Trainer Applications', icon: ClipboardCheck, badge: null },
          { id: 'departments', label: 'Departments', icon: Building2, badge: null },
          { id: 'employees', label: 'Employees', icon: Users, badge: null },
          { id: 'trainers', label: 'Trainers & Admins', icon: UserCog, badge: null },
        ],
      },
      {
        title: 'Learning & Training',
        items: [
          { id: 'courses', label: 'Courses', icon: BookOpen, badge: null },
          { id: 'training', label: 'Training Programs', icon: GraduationCap, badge: null },
          { id: 'enrollments', label: 'Enrollments', icon: UserCheck, badge: null },
        ],
      },
    ],
  },
  TRAINER: {
    roleName: 'Trainer',
    roleBadge: 'Trainer',
    navSections: [
      {
        title: 'Trainer Panel',
        items: [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
          { id: 'my-programs', label: 'My Training Programs', icon: GraduationCap, badge: null },
          { id: 'my-learners', label: 'My Learners', icon: Users, badge: null },
          { id: 'assessments', label: 'Assessments', icon: CheckSquare, badge: null },
        ],
      },
    ],
  },
  EMPLOYEE: {
    roleName: 'Employee',
    roleBadge: 'Learner',
    navSections: [
      {
        title: 'Learner Panel',
        items: [
          { id: 'dashboard', label: 'Dashboard', icon: Compass, badge: null },
          { id: 'my-learning', label: 'My Learning', icon: BookOpen, badge: null },
          { id: 'my-assessments', label: 'My Assessments', icon: HelpCircle, badge: null },
          { id: 'my-certificates', label: 'My Certificates', icon: Award, badge: null },
          { id: 'my-profile', label: 'My Profile', icon: User, badge: null },
        ],
      },
    ],
  },
}
