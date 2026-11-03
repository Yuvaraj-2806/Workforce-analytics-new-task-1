-- Workforce Analytics Platform - SQLite Schema
-- Compliant with Task 2 Requirements

CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  manager TEXT,
  color TEXT NOT NULL,
  budget INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employees (
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

CREATE TABLE IF NOT EXISTS attendance (
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

CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  action TEXT CHECK(action IN ('check-in', 'check-out', 'leave-requested', 'leave-approved', 'new-hire', 'resigned')) NOT NULL,
  timestamp DATETIME NOT NULL,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Query optimization indexes
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_location ON employees(location);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_type ON employees(employment_type);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_logs(timestamp);
