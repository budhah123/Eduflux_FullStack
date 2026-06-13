# 📚 Eduflux — AI-Driven Academic Resource Management System

> **"Your Academic Resources, Reimagined."**

Eduflux is a modern full-stack web application built for students and faculty at **Techspire College, Nepal**. It allows users to upload, share, search, and interact with academic documents using an AI-powered conversational interface. External users can access the platform via subscription.

---

## 🌟 Features

### 👨‍🎓 For Students & Faculty
- 📄 Upload and share academic documents (Notes, Assignments, Past Papers, Presentations)
- 🔍 Browse and search documents by category, subject, semester
- 🤖 AI-powered document chat — ask questions, get summaries from any PDF
- 🔖 Bookmark favorite documents
- 📥 Download documents with tracking
- 🔔 Real-time notifications

### 💳 For External Users
- 💰 Subscription plans via **Khalti** and **eSewa** (NPR 299/month)
- 🌐 Full access to all academic resources

### 🛡️ For Admins
- 👥 User management (view, suspend, promote, delete)
- 📋 Document moderation (approve, flag, remove)
- 📊 Analytics dashboard (registrations, uploads, revenue)
- 💼 Subscription and payment management

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React (Vite) + TypeScript |
| **Backend** | NestJS + TypeScript |
| **Database** | MongoDB + TypeORM |
| **File Storage** | Cloudinary |
| **Authentication** | JWT + Passport.js |
| **API Docs** | Swagger (OpenAPI) |
| **Containerization** | Docker + Docker Compose |
| **Styling** | Tailwind CSS |
| **State Management** | Zustand |
| **HTTP Client** | Axios |

---

## 📁 Project Structure

```
eduflux/
├── docker-compose.yml
├── .env
│
├── backend/                        # NestJS API
│   ├── Dockerfile
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── common/
│   │   │   ├── attribute.ts
│   │   │   ├── guards/
│   │   │   └── decorators/
│   │   ├── config/
│   │   │   ├── database.config.ts
│   │   │   ├── jwt.config.ts
│   │   │   └── upload.config.ts
│   │   └── modules/
│   │       ├── auth/
│   │       ├── users/
│   │       ├── documents/
│   │       ├── upload/
│   │       ├── ai-chat/
│   │       ├── subscriptions/
│   │       ├── notifications/
│   │       └── admin/
│   └── package.json
│
└── frontend/                       # React + Vite
    ├── Dockerfile
    ├── src/
    │   ├── pages/
    │   │   ├── Landing.tsx
    │   │   ├── auth/
    │   │   ├── dashboard/
    │   │   └── admin/
    │   ├── components/
    │   ├── services/
    │   │   ├── api.ts
    │   │   ├── authService.ts
    │   │   └── documentService.ts
    │   ├── store/
    │   ├── hooks/
    │   └── types/
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:
- [Node.js](https://nodejs.org/) v20+
- [Docker](https://www.docker.com/) + Docker Compose
- [MongoDB](https://www.mongodb.com/) (or use Docker)
- [Cloudinary](https://cloudinary.com/) account (free)

---

### 🔑 Environment Variables

Create `.env` in the **root** folder:

```env
# MongoDB
MONGODB_URI=mongodb://mongo:27017/eduflux

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=eduflux/docs
```

Create `.env` in the **frontend** folder:

```env
VITE_API_URL=http://localhost:3000
```

---

### 🐳 Run with Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/eduflux.git
cd eduflux

# Start all services
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/api |
| MongoDB | mongodb://localhost:27017 |

---

### 💻 Run Without Docker

**Terminal 1 — Backend:**
```bash
cd backend
npm install
npm run start:dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 📡 API Endpoints

### Auth
```
POST   /auth/register        → Register new user
POST   /auth/login           → Login + get JWT token
POST   /auth/forgot-password → Send reset email
```

### Documents
```
GET    /documents                  → Browse all documents (public)
GET    /documents/:id              → Get single document (public)
POST   /documents/upload           → Upload document (auth)
GET    /documents/user/my-uploads  → My uploads (auth)
GET    /documents/:id/download     → Download URL (auth)
PATCH  /documents/:id              → Update document (auth + owner)
DELETE /documents/:id              → Delete document (auth + owner)
PATCH  /documents/:id/status       → Moderate document (admin)
GET    /documents/admin/all        → All documents (admin)
```

### Users
```
GET    /users/profile        → Get my profile (auth)
PATCH  /users/profile        → Update profile (auth)
GET    /users/:id            → Get user (admin)
GET    /users                → All users (admin)
PATCH  /users/:id/status     → Suspend/activate user (admin)
```

### Subscriptions
```
POST   /subscriptions        → Create subscription (auth)
GET    /subscriptions/me     → My subscription (auth)
GET    /subscriptions        → All subscriptions (admin)
```

---

## 🖥️ Pages

| Page | Route | Access |
|---|---|---|
| Landing | `/` | Public |
| Login | `/login` | Public |
| Register | `/register` | Public |
| Dashboard | `/dashboard` | Auth |
| Browse Documents | `/browse` | Auth |
| Document Detail | `/documents/:id` | Auth |
| AI Chat | `/chat` | Auth |
| My Uploads | `/my-uploads` | Auth |
| Bookmarks | `/bookmarks` | Auth |
| Subscriptions | `/subscriptions` | Auth |
| Settings | `/settings` | Auth |
| Admin Dashboard | `/admin` | Admin |
| User Management | `/admin/users` | Admin |
| Document Management | `/admin/documents` | Admin |
| Reports | `/admin/reports` | Admin |

---

## 📤 File Upload

Files are stored on **Cloudinary** (free 25GB). Only the file path and URL are saved in MongoDB.

**Supported formats:** PDF, DOCX
**Max file size:** 10MB

```
User uploads file (React)
    ↓
POST /documents/upload (NestJS)
    ↓
Multer reads file buffer
    ↓
Upload to Cloudinary → returns fileKey + fileUrl
    ↓
Save metadata to MongoDB (title, fileKey, fileUrl, category...)
    ↓
Return document to frontend
```

---

## 🎨 Design System

| Token | Value |
|---|---|
| Primary | `#4F46E5` (Indigo) |
| Secondary | `#7C3AED` (Violet) |
| Accent | `#10B981` (Emerald) |
| Background | `#F9FAFB` |
| Text | `#1E293B` |
| Font | Inter |

---

## 🧪 Testing API (Swagger)

Visit `http://localhost:3000/api` after running the backend.

1. Click **Authorize** → enter `Bearer <your_jwt_token>`
2. Test any endpoint directly from the browser

---

## 👥 User Roles

| Role | Access |
|---|---|
| `student` | Free access with `@cps.edu.np` email |
| `faculty` | Free access with institutional email |
| `external` | Paid subscription required |
| `admin` | Full system access |

---

## 📦 Docker Services

```yaml
services:
  backend:   NestJS API        → port 3000
  frontend:  React + Vite      → port 5173
  mongo:     MongoDB 7         → port 27017
```

---

## 🤝 Contributing

```bash
# Fork the repo
# Create your feature branch
git checkout -b feature/your-feature

# Commit your changes
git commit -m "feat: add your feature"

# Push to branch
git push origin feature/your-feature

# Open a Pull Request
```

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👨‍💻 Author

**Hemraj Budha**
Techspire College, Nepal
📧 hemraj.budhasep23@cps.edu.np

---

## 🙏 Acknowledgements

- [NestJS](https://nestjs.com/)
- [React](https://react.dev/)
- [MongoDB](https://www.mongodb.com/)
- [Cloudinary](https://cloudinary.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Docker](https://www.docker.com/)

---

<div align="center">
  Built with ❤️ for Techspire College, Nepal
</div>
