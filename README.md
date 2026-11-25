# Capacita — Digital Capacity Building & Learning Management Portal

Capacita is a full-stack Learning Management and Capacity Building Portal built with **React (Vite + Tailwind CSS)** and **Django REST Framework + Neon PostgreSQL**. It enables organizations to manage departments, employees, trainers, reusable courses, cohort-based training programs, enrollments, assessments, and verified completion certificates in one unified platform.

---

## Key Features by Role

Capacita is strictly structured around three user roles—**Admin**, **Trainer**, and **Employee**—with server-side role-based access control (RBAC) enforced across all APIs.

### 1. Administrator (`ADMIN`)
- **Admin Dashboard:** Real-time database metrics for total employees, departments, courses, training programs, active enrollments, completed programs, and recent platform activities.
- **Trainer Applications:** Dedicated review queue organized by **Pending**, **Approved**, and **Rejected** applications. Admins can inspect applicant credentials (qualifications, experience, skills, introduction, department, and prior submission history), approve applicants, or reject them with a required rejection reason.
- **Department Management:** Create, edit, and view employees belonging to each department; deletion is blocked if employees are still assigned.
- **Employee Management:** Create employee accounts, search by name or email, filter by department, activate/deactivate accounts, and inspect individual learning and certification history.
- **Trainers & Administrators Management:** Manage approved, active trainers and create/manage additional Administrator accounts. Includes built-in protection preventing deletion, deactivation, or demotion of the last active Administrator.
- **Course Management:** Create and edit reusable courses with categories, levels, duration (hours), publish/unpublish toggles, and learning modules supporting text, external links, video, and uploaded documents. Courses in active use cannot be deleted.
- **Training Program Management:** Create cohort programs by selecting one or more published courses, assigning an approved trainer, setting start/end dates (with automatic `Upcoming` / `Ongoing` / `Completed` status syncing), configuring capacity limits, and bulk-enrolling individual employees or entire departments.
- **Enrollment Management:** Monitor and filter all course and training program enrollments.

### 2. Trainer (`TRAINER`)
- **Trainer Self-Registration & Approval Lifecycle:**
  - Prospective trainers apply via the **"Join as a Trainer"** form on the login page.
  - **Pending:** Applicants can log in to view their pending application status, but are blocked from Trainer Dashboard and training APIs until approved.
  - **Rejected:** Applicants see the Admin's rejection reason and have two options: **Submit Application Again** (pre-filled form preserving previous submission history) or **Delete My Account**.
  - **Approved:** Grants full access to the Trainer workspace and makes the trainer selectable in Admin training program assignments.
- **Trainer Dashboard:** Overview of assigned training programs (upcoming, ongoing, completed), assigned learners, and completion progress.
- **My Training Programs & My Learners:** Scoped strictly to training programs assigned to the trainer and the learners enrolled in them.
- **Assessments:** Create and manage assessments, questions, passing thresholds, and review learner submissions for assigned programs and courses.

### 3. Employee (`EMPLOYEE`)
- **Direct Self-Registration:** Public registration creates `EMPLOYEE` accounts only (with an auto-created `Employee` profile).
- **Employee Dashboard:** Overview of enrolled courses, active training cohorts, overall module completion progress, pending assessments, and earned certificates.
- **My Learning:** Access enrolled individual courses and cohort training programs, launch program courses, read text/link/video guides, download attached course documents, and mark modules complete with live progress tracking.
- **My Assessments:** Take active assessments for enrolled courses/programs with server-side grading and submission history.
- **My Certificates:** View and print verified completion certificates with unique certificate numbers and verification codes.
- **My Profile:** View employee details, department assignment, and update permitted contact fields.

---

## Security & Authorization

- **JWT Authentication:** Powered by `djangorestframework-simplejwt` (`access` and `refresh` tokens).
- **Strict Public Registration:** `POST /api/accounts/register/` strips any client-supplied `role` field and strictly creates `EMPLOYEE` accounts.
- **Server-Side Role Protection:** Users cannot modify their own `role` via `/api/accounts/me/` or `/api/employees/me/` (`403 Forbidden`).
- **Trainer Approval Enforcement:** `IsTrainer` and all trainer-facing endpoints (`TrainingPermission`, `AssessmentPermission`, `SubmissionPermission`, `EnrollmentPermission`, `TrainerDashboardView`) verify that the trainer account is active and has an `APPROVED` application status.
- **Last Active Admin Protection:** The backend prevents deactivating, deleting, or demoting the last active `ADMIN` user.

---

## Tech Stack

### Backend (`server/`)
- **Python 3.9+** / **Django 4.2.30**
- **Django REST Framework 3.16.1**
- **SimpleJWT 5.5.1** (`djangorestframework_simplejwt`)
- **Neon PostgreSQL** via `psycopg 3.2.13` & `dj-database-url 3.0.1`
- **django-cors-headers 4.9.0** & **python-dotenv 1.2.1**

### Frontend (`client/`)
- **React 19.3.1** & **Vite 8.3.6**
- **Tailwind CSS 4.3.5** (`@tailwindcss/vite`)
- **Lucide React 1.77.0**

---

## Project Structure

```text
Capacita/
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── api/                # Fetch wrappers (auth, users, trainerApplications, courses, etc.)
│   │   ├── context/            # AuthContext (JWT session, role & trainerStatus)
│   │   ├── design-system/      # Reusable UI components (Button, Input, Modal, Table, Badge, Toast)
│   │   ├── layouts/            # AppShell & role-based navigationConfig.js
│   │   └── pages/
│   │       ├── admin/          # Admin dashboard, applications, departments, employees, trainers, courses, programs
│   │       ├── auth/           # LoginPage (Sign In, Employee Register, Join as a Trainer)
│   │       ├── employee/       # Employee dashboard, MyLearningPage, assessments, certificates, profile
│   │       ├── shared/         # UnauthorizedPage
│   │       └── trainer/        # Trainer dashboard, programs, learners, pending & rejected status pages
│   └── package.json
├── server/                     # Django + DRF backend
│   ├── accounts/               # Custom User model, TrainerApplication, JWT auth, RBAC permissions
│   ├── assessments/            # Assessments, questions, submissions, grading
│   ├── certificates/           # Certificate generation & verification
│   ├── config/                 # Django settings, root URLs, WSGI/ASGI
│   ├── courses/                # Courses & CourseModules (with document file uploads)
│   ├── dashboard/              # Role-specific dashboard aggregation views
│   ├── departments/            # Department CRUD & employee associations
│   ├── employees/              # Employee profiles & directory
│   ├── enrollments/            # Course & program enrollments, bulk enrollment, progress tracking
│   ├── progress/               # ModuleProgress tracking
│   ├── training/               # TrainingProgram management & date-based status sync
│   ├── .env.example            # Environment variable template
│   └── requirements.txt
├── DEPLOYMENT.md               # Production deployment guide
└── README.md
```

---

## Local Development Setup

### Prerequisites
- Python 3.9+
- Node.js 18+ and npm
- A PostgreSQL database (e.g., [Neon](https://neon.tech/))

### 1. Backend Setup

1. Navigate to the `server` directory and create/activate a virtual environment:
   ```bash
   cd server
   python3 -m venv venv
   source venv/bin/activate
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment variables by copying `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Update `server/.env` with your values:
   ```env
   SECRET_KEY=your-django-secret-key
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1

   DATABASE_URL=postgresql://[user]:[password]@[neon-host]/[dbname]?sslmode=require

   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

   JWT_ACCESS_MINUTES=60
   JWT_REFRESH_DAYS=7
   ```

4. Apply database migrations:
   ```bash
   ./venv/bin/python manage.py migrate
   ```

5. (Optional) Create an initial Administrator account via CLI if none exists:
   ```bash
   ./venv/bin/python manage.py createsuperuser
   ```

6. Start the Django development server:
   ```bash
   ./venv/bin/python manage.py runserver 8000
   ```
   The API will be available at `http://127.0.0.1:8000/api/`.

### 2. Frontend Setup

1. Open a new terminal, navigate to `client/`, and install dependencies:
   ```bash
   cd client
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

3. Build for production:
   ```bash
   npm run build
   ```

---

## API Routes Overview

All API endpoints are prefixed with `/api/`:

| Prefix | Purpose |
|---|---|
| `/api/accounts/` | Login, JWT refresh, Employee registration, Trainer application (`trainer-apply/`, `trainer-application/me/`, `reapply/`, `delete-account/`), Admin application review (`trainer-applications/`), User & Admin management (`users/`) |
| `/api/departments/` | Department CRUD and department employee listings |
| `/api/employees/` | Employee management, status toggling, and `/me/` self-profile |
| `/api/courses/` | Course catalog, publish toggles, and course modules (including file uploads) |
| `/api/training/` | Training programs, participant views, and bulk enrollment |
| `/api/enrollments/` | Enrollment records, `my_learning/`, module completion toggling, and trainer monitoring |
| `/api/progress/` | Module progress records |
| `/api/assessments/` | Assessments, questions, and submission grading |
| `/api/certificates/` | Earned certificates and verification |
| `/api/dashboard/` | Role-scoped Admin, Trainer, and Employee dashboards |
| `/api/notifications/` | Platform notifications |

---

## Production Deployment

See [DEPLOYMENT.md](file:///Users/amritraj/Desktop/Capacita/DEPLOYMENT.md) for production environment configuration, static/media file handling, and Neon PostgreSQL deployment steps.
