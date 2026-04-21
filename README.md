# Project Management System 项目管理系统

A secure, multi-user project management system for small teams (up to 10 users).

## Tech Stack 技术栈

- **Frontend**: React 18 + TypeScript + Vite + PWA
- **Backend**: Node.js + Express + Prisma ORM
- **Database**: PostgreSQL (Zeabur)
- **Auth**: JWT with secure HTTP-only cookies
- **File Upload**: Local filesystem (Zeabur persistent disk)
- **Email**: Nodemailer with SMTP

## Features 功能

- ✅ Multi-user with roles (Admin / User)
- ✅ Projects with 软件/硬件 branches
- ✅ Features & Tasks management
- ✅ Vendor management
- ✅ File uploads (PDF/JPG/DOC/XLS)
- ✅ Email notifications for overdue items
- ✅ Gantt chart on homepage
- ✅ PWA (works on mobile/tablet)
- ✅ All UI in Simplified Chinese

## Quick Setup 快速部署

### 1. Clone the repository
```bash
git clone https://github.com/Andy-LiFamily/project-management.git
cd project-management
```

### 2. Setup Backend
```bash
cd backend
cp ../.env.example .env
# Edit .env with your PostgreSQL and SMTP credentials
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### 3. Setup Frontend
```bash
cd frontend
cp ../.env.example .env
npm install
npm run dev
```

### 4. Build for Production
```bash
cd frontend && npm run build
# Serve the dist/ folder via backend or deploy to Zeabur static hosting
```

## Environment Variables 环境变量

```env
# Backend .env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
JWT_SECRET="your-super-secret-key-min-32-chars"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your@email.com"
SMTP_PASSWORD="your-password"
SMTP_FROM="noreply@example.com"
PORT=3001
UPLOAD_DIR="./uploads"
FRONTEND_URL="http://localhost:5173"

# Frontend .env
VITE_API_URL="http://localhost:3001"
```

## API Endpoints API接口

### Auth 认证
- `POST /api/auth/register` - Register (admin only, max 10 users)
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user
- `PUT /api/auth/password` - Change password

### Users 用户
- `GET /api/users` - List users (admin)
- `POST /api/users` - Create user (admin)
- `DELETE /api/users/:id` - Delete user (admin)

### Projects 项目
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project detail
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project (admin)

### Features 功能
- `GET /api/projects/:projectId/features` - List features
- `POST /api/projects/:projectId/features` - Create feature
- `GET /api/features/:id` - Get feature detail
- `PUT /api/features/:id` - Update feature
- `PUT /api/features/:id/complete` - Mark as complete (with summary)
- `DELETE /api/features/:id` - Delete feature (admin)

### Tasks 任务
- `GET /api/features/:featureId/tasks` - List tasks
- `POST /api/features/:featureId/tasks` - Create task
- `GET /api/tasks/:id` - Get task detail
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Vendors 供应商
- `GET /api/vendors` - List vendors
- `POST /api/vendors` - Create vendor
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Delete vendor

### Files 文件
- `POST /api/upload` - Upload file
- `GET /api/files/:entityType/:entityId` - List files
- `DELETE /api/files/:id` - Delete file

### Dashboard
- `GET /api/dashboard/stats` - Statistics
- `GET /api/dashboard/gantt` - Gantt chart data

## Deployment to Zeabur 部署到 Zeabur

### Via GitHub (Recommended)
1. Push this repo to GitHub: `git push origin main`
2. Connect to Zeabur at https://zeabur.com
3. Add a new PostgreSQL database
4. Deploy backend service (set `DATABASE_URL` from Zeabur)
5. Deploy frontend (static hosting or backend serves frontend build)

### Manual
```bash
# Backend
cd backend && npm run build
# Set env vars on Zeabur dashboard
npm start

# Frontend
cd frontend && npm run build
# Upload dist/ to Zeabur static hosting or serve via backend
```

## GitHub Push 推送到 GitHub

```bash
git init
git remote add origin https://github.com/Andy-LiFamily/project-management.git
git add .
git commit -m "Initial project management system"
git push -u origin main
```

## License
Internal use only.
