# NagrikConnect: Smart Civic Information & Grievance Platform

[![UCS503: Software Engineering Project](https://img.shields.io/badge/Course-UCS503%20Software%20Engineering-blue)](MST-Report/main.pdf)
[![Thapar Institute of Engineering and Technology](https://img.shields.io/badge/TIET-Patiala-red)](https://www.thapar.edu/)
[![Backend: Node.js & Express](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20TypeScript-green)](code/backend)
[![Frontend: React & TypeScript](https://img.shields.io/badge/Frontend-React%20%7C%20TypeScript%20%7C%20Vite-61dafb)](code/frontend)

NagrikConnect is a web-based smart city civic grievance and information management platform. It allows citizens to lodge civic complaints across municipal domains (roads, streetlighting, garbage, drainage), attach media evidence, automatically categorize issues, and track transparent status lifecycles from filing to resolution.

---

## 👥 Project Team & Mentorship

- **Academic Guide**: Paramveer Sidhu
- **Course**: UCS503 Software Engineering (Mid-Semester / Capstone Evaluation)
- **Team Members**:
  - Aarav Bansal (`1024170349`)
  - Pushkar Sheokand (`1024170381`)
  - Tarun Chaudhary (`1024170383`)

---

## 📂 Repository Structure

- **`code/backend/`**: Node.js, Express, TypeScript, and Prisma REST API server.
- **`code/frontend/`**: React 19, TypeScript, and Vite citizen & municipal department interface.
- **`MST-Report/`**: LaTeX source code and compiled PDF of the Mid-Semester Evaluation Report.
- **`Project Proposal/`**: LaTeX source code and proposal document.
- **`journals/`**: Weekly engineering progress logs.

---

## ⚡ Quick Start Guide

### 1. Start the Backend API Server

Open a terminal:
```bash
cd code/backend

# Install dependencies (first time only)
npm install

# Initialize and seed the SQLite database
npx prisma db push
npm run prisma:seed

# Start backend server (runs at http://localhost:5000)
npm run dev
```

### 2. Start the Frontend Application

Open a second terminal:
```bash
cd code/frontend

# Install dependencies (first time only)
npm install

# Start Vite development server (runs at http://localhost:5173)
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## 🧪 Demo User Accounts

The database comes pre-seeded with accounts and complaints for testing:

| Role | Email / Login | Password | Capabilities |
|---|---|---|---|
| **Citizen** | `citizen123@gmail.com` | `citizen@123` | File 3-step grievances, upload media, view grievance timeline |
| **Department Admin** | `admin123@gmail.com` | `admin@123` | Review grievances, assign field crews, track SLA performance & analytics |
