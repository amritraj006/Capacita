# Capacita Production Deployment Guide

## Architecture Overview
- **Backend**: Django 4.2 + Django REST Framework + SimpleJWT
- **Database**: Managed Neon Cloud PostgreSQL (SSL Required, connection pooling enabled)
- **Frontend**: React 18 + Vite + Tailwind CSS + Lucide React
- **Web Server / WSGI**: Gunicorn / WhiteNoise / Nginx (or cloud PaaS like Railway, Render, AWS ECS)

---

## 1. Environment Configuration

### Backend (`server/.env`)
Copy `server/.env.example` to `server/.env` and update the parameters:

```bash
SECRET_KEY=your-production-secret-key-min-50-chars
DEBUG=False
ALLOWED_HOSTS=api.capacita.org,capacita.org
DATABASE_URL=postgresql://user:password@ep-neon-pooler.aws.neon.tech/neondb?sslmode=require
CORS_ALLOWED_ORIGINS=https://capacita.org,https://app.capacita.org
```

### Frontend (`client/.env.production`)
Create `client/.env.production`:

```bash
VITE_API_BASE_URL=https://api.capacita.org/api
```

---

## 2. Backend Deployment Checklist

1. **Install Production Dependencies**:
   ```bash
   cd server
   pip install -r requirements.txt
   pip install gunicorn whitenoise
   ```

2. **Execute Database Migrations**:
   Ensure all migrations are applied against Neon PostgreSQL:
   ```bash
   python manage.py migrate
   ```

3. **Collect Static Assets**:
   ```bash
   python manage.py collectstatic --noinput
   ```

4. **Run Security Validation**:
   ```bash
   python manage.py check --deploy
   ```

5. **Start Production WSGI Server**:
   ```bash
   gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120
   ```

---

## 3. Frontend Deployment Checklist

1. **Install Dependencies**:
   ```bash
   cd client
   npm ci
   ```

2. **Compile Production Bundle**:
   ```bash
   npm run build
   ```
   *Outputs optimized static assets to `client/dist/`.*

3. **Serve Static Bundle**:
   Deploy the `client/dist` directory to any CDN / Static Host (e.g. Cloudflare Pages, Vercel, Netlify, or Nginx).

---

## 4. Security Hardening Measures
- **SSL / HTTPS Enforced**: Enabled when `DEBUG=False` via `SECURE_PROXY_SSL_HEADER`, `SESSION_COOKIE_SECURE`, and `CSRF_COOKIE_SECURE`.
- **Database Transport Security**: Neon PostgreSQL connection strings enforce `sslmode=require`.
- **RBAC**: Strict role permissions (`IsAdmin`, `IsTrainer`, `IsEmployee`) checked server-side on every API view.
- **Certificate Authenticity**: Verified via 12-character cryptographic verification tokens and immutable certificate records.
- **CORS Whitelist**: Controlled strictly via `CORS_ALLOWED_ORIGINS`.
