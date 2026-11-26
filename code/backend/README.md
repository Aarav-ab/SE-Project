# NagrikConnect Backend API

> Smart Civic Information & Grievance Redressal System API  
> Developed for **UCS503: Software Engineering Project**, Thapar Institute of Engineering and Technology (TIET), Patiala.

---

## 🏛️ Architecture Overview

The backend is built as a modular 3-tier RESTful service:

- **Runtime & Language**: Node.js (v22+) with TypeScript
- **Web Framework**: Express.js
- **Database & ORM**: Prisma ORM with SQLite for zero-setup local execution (seamless 1-line switch to PostgreSQL for production)
- **Authentication**: JWT (JSON Web Tokens) with Role-Based Access Control (`citizen`, `admin`, `department_staff`, `field_worker`)
- **Password Security**: `bcryptjs` salted hashing
- **Media Uploads**: `multer` handling image (`.jpg`, `.png`, `.webp`) and video (`.mp4`) evidence up to 25 MB
- **Automated Routing Engine**: Rule-based intake logic mapping grievances to municipal departments, calculating SLA deadlines, and suggesting categories.

```
code/backend/
├── prisma/
│   ├── schema.prisma       # Database schema models
│   └── seed.ts             # Realistic sample seed script
├── src/
│   ├── config/
│   │   └── prisma.ts       # PrismaClient singleton
│   ├── controllers/
│   │   ├── authController.ts       # Registration, login, profile
│   │   ├── complaintController.ts  # Grievance lifecycle & uploads
│   │   ├── workerController.ts     # Field crew dispatch
│   │   ├── analyticsController.ts  # SLA & ward performance stats
│   │   └── civicController.ts      # Wards, departments, AI suggestion
│   ├── middlewares/
│   │   ├── auth.ts         # JWT verification & RBAC guards
│   │   └── upload.ts       # Multer media evidence filter
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── complaintRoutes.ts
│   │   ├── workerRoutes.ts
│   │   ├── analyticsRoutes.ts
│   │   └── civicRoutes.ts
│   ├── services/
│   │   └── routingService.ts  # Intelligent routing & SLA calculations
│   └── index.ts            # Express server initialization
├── uploads/                # Stored media evidence (served statically)
├── .env                    # Environment variables
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v22)
- **npm** v9+

### 2. Installation
```bash
cd code/backend
npm install
```

### 3. Database Initialization & Seeding
```bash
# Push Prisma schema to SQLite dev.db
npx prisma db push

# Pre-populate database with demo users, workers, departments, and complaints
npm run prisma:seed
```

### 4. Running the Server
```bash
# Development mode (with live reload via tsx)
npm run dev

# Production build and run
npm run build
npm start
```
The server will run at **`http://localhost:5000`**.

---

## 📡 API Reference

### Health Check
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status & timestamp |

### Authentication
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new citizen account | No |
| `POST` | `/api/auth/login` | Sign in (supports credentials or demo role) | No |
| `GET` | `/api/auth/me` | Current authenticated user profile | Yes (`Bearer <token>`) |

**Demo Credentials seeded in DB:**
- **Citizen**: `citizen123@gmail.com` / `Citizen@123`
- **Department Admin**: `admin123@gmail.com` / `admin@123`

### Civic Complaints & Grievances
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/complaints` | Submit grievance (accepts `multipart/form-data` with `files`) |
| `GET` | `/api/complaints` | Query complaints (filter by `status`, `category`, `search`) |
| `GET` | `/api/complaints/:id` | Get complaint details, history timeline, and attachments |
| `PATCH` | `/api/complaints/:id/status` | Update lifecycle stage (`Pending Dispatch`, `In Progress`, `Resolved`) |
| `PATCH` | `/api/complaints/:id/assign` | Assign field technician / crew |
| `POST` | `/api/complaints/:id/feedback` | Citizen rating (1–5) and satisfaction comment |

### Field Workers & Dispatch
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/workers` | List all field workers, active assignments, and metrics |
| `PATCH` | `/api/workers/:id/status` | Update technician status |

### Department Analytics & SLA
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics` | Total counts, in-progress, resolved, SLA adherence %, category stats |

### Civic & Smart Routing
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/civic/wards` | Configured municipal wards |
| `GET` | `/api/civic/departments` | Municipal departments (PWD, Electrical, SWM, Water) |
| `GET` | `/api/civic/announcements` | Public service announcements and advisories |
| `POST` | `/api/civic/suggest` | AI-assisted category, department & SLA recommendation |

---

## 🔄 Switching to PostgreSQL

The project defaults to SQLite for zero-setup local development. When ready for PostgreSQL (e.g., Supabase, Neon, or local PostgreSQL):

1. In `prisma/schema.prisma`, update the datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. In `.env`, set your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/nagrikconnect?schema=public"
   ```
3. Run:
   ```bash
   npx prisma db push
   npm run prisma:seed
   ```
