# Week 5: Frontend Finalisation and Backend Architecture Planning

## Objective

To support final refinements on the integrated frontend prototype and design the full-stack backend architecture, database schema, and API contracts required to transition NagrikConnect from a mock-data prototype to a persistent system.

## Relevant Context

In Week 5, Tarun focused on finalising the Citizen Portal UI and navigation consistency. In parallel, based on the gaps identified during the MST evaluation (persistent database storage, secure authentication, real file uploads, and server-side routing), I focused on auditing the frontend's data requirements and designing the Node.js/Express/Prisma backend architecture.

## Work Done

- Reviewed the integrated Citizen and Admin Portal flows alongside Tarun's final Citizen Portal refinements to catalog every mock data structure (`localStorage`, hardcoded demo complaints, workers, and metrics) that needed backend persistence.
- Designed the relational database schema for **Prisma ORM** covering `User`, `Department`, `FieldWorker`, `Complaint`, `Attachment`, `TimelineEvent`, `Feedback`, and `Announcement` models.
- Planned the modular 3-tier backend layout under `code/backend/src/`:
  - `config/` for Prisma client singleton setup
  - `middlewares/` for JWT authentication, Role-Based Access Control (RBAC), and `multer` media upload validation
  - `services/` for rule-based department routing, priority inference, and SLA target-date computation
  - `controllers/` and `routes/` separated by domain (`auth`, `complaints`, `workers`, `analytics`, `civic`)
- Defined the REST API endpoints and response shapes needed by the React frontend so `ComplaintContext.tsx` could migrate cleanly from local state to live HTTP calls.
- Planned initial seed data covering municipal departments (`PWD`, `Electrical`, `SWM`, `Water`), field crews, citizen/admin demo accounts, and realistic sample complaints.

## Key Observation

Designing the API contract directly from the existing frontend components avoided unnecessary refactoring later, while ensuring server-side validation, SLA computation, and authorization rules remained decoupled from UI state.

## Improvements and Remaining Work

While the frontend UI flow was ready, complaint records, file attachments, worker assignments, and authentication still ran only in browser memory/local storage. Implementing the full backend service and connecting the Citizen Portal first became the priority for Week 6.

## Outcome

The frontend prototype was finalised for backend handoff, and a complete database schema, REST API specification, and modular backend architecture were ready for implementation.

## Plan for Next Week

Implement the Node.js + Express + TypeScript + Prisma backend server and connect the Citizen Portal end-to-end with persistent complaint submission, media uploads, and timeline tracking.
