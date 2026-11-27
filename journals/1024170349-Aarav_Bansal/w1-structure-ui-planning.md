# Week 1: Project Structure, UI Design Planning, and Initial Coding

## Objective

To define the software architecture and repository structure for NagrikConnect, collaboratively plan the user interface across citizen and administrative workflows, and begin initial frontend prototyping and coding.

## Relevant Context

Following the project proposal (*NagrikConnect: A Smart Civic Information and Grievance Platform*), the team needed to translate the 3-tier system vision into concrete screen layouts, shared navigation patterns, and an initial codebase. While Tarun focused on coordinating the Citizen Portal UI concepts in Stitch and Figma, my focus in Week 1 spanned overall project structure, interface planning across both portals, and starting the initial HTML/CSS and React/TypeScript implementation.

## Work Done

- Finalised the core project proposal documentation (`Project Proposal/main.tex` and `main.pdf`), defining the Citizen Portal, Admin/Department Portal, complaint lifecycle (`Submitted` -> `Assigned` -> `In Progress` -> `Resolved`), and evaluation metrics.
- Collaborated with the team using **Stitch** and **Figma** to plan screen layouts, visual hierarchy, navigation structure, and shared styling across citizen and departmental views.
- Structured the repository into modular directories (`code/prototype/nagrikconnect-html/` for static HTML prototypes and `code/frontend/` for the React + TypeScript + Vite application).
- Started initial UI coding by creating HTML/CSS prototypes (`login.html`, `citizen-portal.html`, `department-portal.html`, `field-workers.html`, `department-analytics.html`) and bootstrapping the React/TypeScript project setup.
- Coordinated component naming, colour tokens, and layout conventions with group members so citizen and administrative screens shared a cohesive design language.

## Key Observation

Planning the system structure alongside early UI prototyping surfaced key data requirements early—such as separating citizen-facing complaint submission fields from department-facing SLA deadlines, priority levels, and crew assignment states.

## Solution and Improvements

- Established a clean separation between static design prototypes (`code/prototype/nagrikconnect-html/`) and modular React components (`code/frontend/src/pages/`).
- Documented shared status labels and category mappings early so all team members coded against consistent domain terminology.

## Outcome

The project structure, initial UI designs, and foundational HTML/React codebases were established, setting up the team to convert individual portal designs into full React pages in Week 2.

## Plan for Next Week

Translate the approved Admin and Department Portal designs into reusable React + TypeScript components and align their styling with the Citizen Portal screens.
