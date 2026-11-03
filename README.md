# 🚀 Stackly — Enterprise Workforce Analytics Platform (Task 2)

[![React](https://img.shields.io/badge/React-19.3.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Material UI](https://img.shields.io/badge/Material--UI-v9-007FFF?logo=mui&logoColor=white)](https://mui.com/)
[![Express.js](https://img.shields.io/badge/Express-5.3-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL--Mode-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

An enterprise-grade, responsive Workforce Analytics Platform engineered for **Stackly**. Built with a decoupled frontend architecture, a Node.js/Express REST API adhering to the **Repository Pattern**, and a persistent **SQLite** database operating with Write-Ahead Logging (WAL) for concurrent reads and writes.

---

## 📑 Table of Contents
1. [Architecture Overview](#-architecture-overview)
2. [Key Features & Task 2 Deliverables](#-key-features--task-2-deliverables)
3. [SQLite Database Design & Schema](#-sqlite-database-design--schema)
4. [Backend Architecture & Repository Pattern](#-backend-architecture--repository-pattern)
5. [REST API Documentation](#-rest-api-documentation)
6. [Frontend Modular Architecture](#-frontend-modular-architecture)
7. [Installation & Execution Guide](#-installation--execution-guide)
8. [UI/UX & Accessibility Highlights](#-uiux--accessibility-highlights)
9. [Verification & Test Results](#-verification--test-results)

---

## 🏛 Architecture Overview

The system strictly follows SOLID principles and enforces a clear separation between the presentation layer, client-side business logic, API communication services, backend controllers, repositories, and the relational database.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (React 19 + MUI)                   │
│                                                                        │
│   ┌────────────────────┐   ┌───────────────────┐   ┌───────────────┐   │
│   │   Sidebar & Nav    │   │  5 Live KPI Cards │   │ Filter Bar    │   │
│   └────────────────────┘   └───────────────────┘   └───────────────┘   │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │           Interactive Charts & Analytics Grid                  │   │
│   │   • Attendance Trend  • Dept Headcount  • Workforce Donut      │   │
│   └────────────────────────────────────────────────────────────────┘   │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │       Employee Directory (Search + Sort + MUI Pagination)      │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                   │                                    │
│                     ┌─────────────▼─────────────┐                      │
│                     │   useDashboardData Hook   │                      │
│                     └─────────────┬─────────────┘                      │
│                                   │                                    │
│                     ┌─────────────▼─────────────┐                      │
│                     │  API Client Service Layer │                      │
│                     └─────────────┬─────────────┘                      │
└───────────────────────────────────┼────────────────────────────────────┘
                                    │ HTTP / REST (/api)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   BACKEND API LAYER (Node.js + Express)                │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │    Express API Routes (/api/kpi, /api/employees, /api/charts)   │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │                                    │
│   ┌───────────────────────────────▼────────────────────────────────┐   │
│   │    Controllers (DashboardController, EmployeeController, etc.) │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │                                    │
│   ┌───────────────────────────────▼────────────────────────────────┐   │
│   │    Repository Layer (Repository Pattern)                       │   │
│   │    • EmployeeRepository     • AttendanceRepository             │   │
│   │    • DepartmentRepository   • ActivityRepository               │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
└───────────────────────────────────┼────────────────────────────────────┘
                                    │ Prepared SQL Statements
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       PERSISTENCE LAYER (SQLite 3)                     │
│                                                                        │
│   • departments      • employees        • attendance                   │
│   • activity_logs    • WAL Journal Mode • B-Tree Indexes               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features & Task 2 Deliverables

### 1. UI/UX Development
- **Responsive Layout**: Designed for seamless viewport transitions across Mobile (`xs`), Tablet (`sm`/`md`), and Desktop (`lg`/`xl`).
- **Sidebar & TopNav**: Stackly brand identity, Yuvaraj user profile (`yuvaraj@stackly.io`), quick theme toggling (Dark/Light), notifications badge, and clean collapsible navigation.
- **Scrollbar Suppression**: Native browser scrollbars suppressed cleanly across all viewports while retaining full smooth scrolling.

### 2. Dashboard Analytics & 5 Live KPI Pods
- **Total Employees**: Dynamic count across global workforce hubs.
- **Present Today**: Aggregated on-site and remote employees with positive trend velocity.
- **Absent**: Unscheduled absences with baseline comparisons.
- **On Leave**: Active medical, maternity, and PTO allowances.
- **Attendance Rate**: Real-time percentage attendance velocity versus corporate benchmark (88.0%).

### 3. Multi-Dimension Charts
- **Attendance Trend**: Multi-period area/line chart tracking Present, Absent, On Leave, and Remote staff over time.
- **Department Distribution**: Bi-metric comparison of Total Staff vs. Present Staff per department.
- **Workforce Donut**: Interactive breakdown by Employment Type (Full-time, Part-time, Contractor, Intern) with center HUD readout and click-to-filter capability.

### 4. Interactive Employee Directory & Activity
- **Live Search**: Debounced real-time text search across employee names, roles, departments, and locations.
- **Column Sorting**: Interactive `TableSortLabel` for Name, Department, Role, Location, Status, and Activity Time.
- **MUI TablePagination**: Selectable page size (`5`, `10`, `25`, `50`), page switches, and total count badge.
- **Empty & Error States**: Contextual empty state with reset filter CTA when search yields zero records.

---

## 🗄 SQLite Database Design & Schema

The relational schema is configured in `server/db/schema.sql` with foreign key enforcement and Write-Ahead Logging (WAL):

```sql
-- 1. Departments Table
CREATE TABLE departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  manager TEXT,
  color TEXT NOT NULL,
  budget INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Employees Table
CREATE TABLE employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_code TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  role TEXT NOT NULL,
  employment_type TEXT CHECK(employment_type IN ('Full-time', 'Part-time', 'Contractor', 'Intern')) NOT NULL DEFAULT 'Full-time',
  location TEXT NOT NULL,
  status TEXT CHECK(status IN ('active', 'on-leave', 'remote', 'inactive')) NOT NULL DEFAULT 'active',
  avatar_initials TEXT NOT NULL,
  joined_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Attendance Records Table
CREATE TABLE attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT CHECK(status IN ('present', 'absent', 'on-leave', 'remote')) NOT NULL,
  check_in_time TEXT,
  check_out_time TEXT,
  work_mode TEXT CHECK(work_mode IN ('Office', 'Remote', 'Hybrid', 'Leave')) DEFAULT 'Office',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, date)
);

-- 4. Activity Logs Table
CREATE TABLE activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  action TEXT CHECK(action IN ('check-in', 'check-out', 'leave-requested', 'leave-approved', 'new-hire', 'resigned')) NOT NULL,
  timestamp DATETIME NOT NULL,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- High-performance query indexes
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_location ON employees(location);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_type ON employees(employment_type);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_employee ON attendance(employee_id);
CREATE INDEX idx_activity_timestamp ON activity_logs(timestamp);
```

---

## 🧱 Backend Architecture & Repository Pattern

The backend follows the **Repository Pattern** to decouple persistence details from business logic:

1. **`server/db/database.ts`**: SQLite connection singleton with WAL mode and foreign key constraints.
2. **`server/repositories/EmployeeRepository.ts`**: Handles employee queries, paginated searches, sorting, and employment type breakdowns.
3. **`server/repositories/AttendanceRepository.ts`**: Aggregates live KPI statistics and multi-day attendance trends.
4. **`server/repositories/DepartmentRepository.ts`**: Fetches department headcount and attendance metrics.
5. **`server/controllers/`**: Isolates HTTP request validation, parameter parsing, and JSON response formatting.
6. **`server/routes/api.ts`**: Maps REST endpoints to controllers.

---

## 📡 REST API Documentation

Base URL: `http://localhost:5000/api` (or proxied via Vite at `http://localhost:5173/api`)

| Method | Endpoint | Query Parameters | Description |
|---|---|---|---|
| `GET` | `/api/health` | None | Returns server health, database status, and uptime |
| `GET` | `/api/kpi` | `department`, `location`, `status`, `employmentType` | Returns the 5 core KPI metrics with percentage trends |
| `GET` | `/api/charts/attendance-trend` | `days` (default 14), `department`, `location` | Multi-day attendance distribution for trend charts |
| `GET` | `/api/charts/department-distribution` | `location`, `status`, `department` | Headcount and attendance per department |
| `GET` | `/api/charts/workforce-segments` | `department`, `location`, `status` | Breakdown by employment type for donut charts |
| `GET` | `/api/employees` | `page`, `limit`, `search`, `sortBy`, `sortOrder`, `department`, `location`, `status`, `employmentType` | Paginated employee records with search and sort |
| `GET` | `/api/filters/options` | None | Dynamic options for departments, locations, and statuses |
| `POST` | `/api/seed` | None | Re-seeds database with rich workforce dataset |

---

## 💻 Frontend Modular Architecture

```
src/
├── components/
│   ├── charts/
│   │   ├── AttendanceTrendChart.tsx         # Responsive area/line chart
│   │   ├── DepartmentDistributionChart.tsx  # Department headcount comparison bar chart
│   │   └── WorkforceDonutChart.tsx          # Interactive employment type segment donut
│   ├── common/
│   │   ├── EmptyState.tsx                   # Filter/search reset CTA
│   │   ├── ErrorState.tsx                   # Network failure fallback with retry
│   │   └── LoadingState.tsx                 # Shimmer skeleton layout
│   ├── filters/
│   │   └── FilterBar.tsx                    # Multi-select chips, locations, dates
│   ├── kpi/
│   │   └── KpiCard.tsx                      # 5 high-impact interactive KPI pods
│   ├── layout/
│   │   ├── Layout.tsx                       # Responsive wrapper
│   │   ├── Sidebar.tsx                      # Stackly navigation & mobile drawer
│   │   └── TopNav.tsx                       # User profile, search & theme switch
│   └── tables/
│       └── RecentActivityTable.tsx          # Directory with search, sorting & pagination
├── hooks/
│   ├── useDashboardData.ts                  # Centralized business logic & API synchronization
│   └── useThemeMode.ts                      # Theme persistence (Dark / Light)
├── services/
│   └── api.ts                               # Type-safe client for backend REST API
├── pages/
│   └── Dashboard.tsx                        # Main dashboard view
├── theme/
│   └── theme.ts                             # Custom Material UI palettes & typography
└── types/
    └── index.ts                             # Global TypeScript interfaces
```

---

## 🚀 Installation & Execution Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher (v22+ tested)
- **npm**: v9.0.0 or higher

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Database (Optional — runs automatically on first start)
```bash
npm run db:seed
```

### 3. Run Development Environment
You can run the full-stack system concurrently with a single command:
```bash
npm run dev:all
```
Or run the backend and frontend separately:
```bash
# Terminal 1: Backend Express + SQLite (Port 5000)
npm run server

# Terminal 2: Vite React Frontend (Port 5173)
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

---

## 🎨 UI/UX & Accessibility Highlights

- **Branding**: Dedicated to **Stackly** with high-contrast corporate typography and an Indigo-Emerald color harmony.
- **User Profile**: Active session authenticated as **Yuvaraj** (`yuvaraj@stackly.io`).
- **Interactive Feedback**:
  - Segment click on Workforce Donut dynamically filters the activity table.
  - KPI card clicks filter by active/on-leave employees.
  - CSV Export downloads filtered datasets instantly.
- **Accessibility**: Semantic HTML5 tags, ARIA labels on inputs and dialogs, keyboard navigation support, and zero scrollbar clutter.

---

## ✅ Verification & Test Results

- **Vite Production Build**: Passed cleanly with `0` TypeScript errors (`tsc -b && vite build`).
- **SQLite Operations**: 100% functional with WAL mode and foreign key integrity.
- **REST API Endpoints**: All endpoints (`/api/kpi`, `/api/charts/*`, `/api/employees`, `/api/filters/options`) verified with dynamic query filters, pagination, and sorting.
