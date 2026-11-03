import { db, initDatabase } from './database';

export function seedDatabase(): void {
  console.log('🌱 Initializing SQLite Schema...');
  initDatabase();

  console.log('🌱 Seeding Stackly Workforce Analytics Database...');

  // Wrap seeding in a single fast transaction
  const seedTransaction = db.transaction(() => {
    // Clear existing data
    db.prepare('DELETE FROM activity_logs').run();
    db.prepare('DELETE FROM attendance').run();
    db.prepare('DELETE FROM employees').run();
    db.prepare('DELETE FROM departments').run();

    // 1. Seed Departments
    const insertDept = db.prepare(`
      INSERT INTO departments (name, code, manager, color, budget)
      VALUES (?, ?, ?, ?, ?)
    `);

    const departments = [
      { name: 'Engineering', code: 'ENG', manager: 'Elena Vance', color: '#6366f1', budget: 1200000 },
      { name: 'Product & Design', code: 'PRD', manager: 'Marcus Vance', color: '#06b6d4', budget: 750000 },
      { name: 'Sales & Marketing', code: 'MKT', manager: 'Sarah Jenkins', color: '#10b981', budget: 950000 },
      { name: 'Operations', code: 'OPS', manager: 'David Kim', color: '#f59e0b', budget: 600000 },
      { name: 'Human Resources', code: 'HR', manager: 'Aisha Patel', color: '#ec4899', budget: 450000 },
      { name: 'Finance & Legal', code: 'FIN', manager: 'Robert Chen', color: '#8b5cf6', budget: 550000 },
    ];

    const deptMap: Record<string, number> = {};
    for (const d of departments) {
      const result = insertDept.run(d.name, d.code, d.manager, d.color, d.budget);
      deptMap[d.name] = Number(result.lastInsertRowid);
    }

    // 2. Seed Employees
    const insertEmployee = db.prepare(`
      INSERT INTO employees (employee_code, first_name, last_name, email, department_id, role, employment_type, location, status, avatar_initials, joined_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const rawEmployees = [
      { first: 'Yuvaraj', last: 'Shanmugam', role: 'Staff Platform Architect', dept: 'Engineering', type: 'Full-time', loc: 'San Francisco', status: 'active', date: '2022-03-15' },
      { first: 'Elena', last: 'Vance', role: 'VP of Engineering', dept: 'Engineering', type: 'Full-time', loc: 'San Francisco', status: 'active', date: '2021-01-10' },
      { first: 'Sophia', last: 'Alvarez', role: 'Senior React Engineer', dept: 'Engineering', type: 'Full-time', loc: 'New York', status: 'active', date: '2023-04-12' },
      { first: 'Liam', last: 'Nakamura', role: 'Cloud Infrastructure Lead', dept: 'Engineering', type: 'Full-time', loc: 'San Francisco', status: 'remote', date: '2022-08-01' },
      { first: 'Amara', last: 'Okafor', role: 'Backend Microservices Engineer', dept: 'Engineering', type: 'Full-time', loc: 'London', status: 'active', date: '2023-01-15' },
      { first: 'Klaus', last: 'Schneider', role: 'Security & DevSecOps Specialist', dept: 'Engineering', type: 'Contractor', loc: 'Berlin', status: 'active', date: '2024-02-10' },
      { first: 'Arun', last: 'Kulkarni', role: 'Frontend Engineer', dept: 'Engineering', type: 'Full-time', loc: 'Bengaluru', status: 'active', date: '2023-06-20' },
      { first: 'Chloe', last: 'Dupont', role: 'QA Automation Architect', dept: 'Engineering', type: 'Part-time', loc: 'London', status: 'remote', date: '2023-09-01' },
      { first: 'Chen', last: 'Wei', role: 'Distributed Systems Engineer', dept: 'Engineering', type: 'Full-time', loc: 'Singapore', status: 'active', date: '2022-11-14' },
      { first: 'David', last: 'Miller', role: 'Junior Software Engineer', dept: 'Engineering', type: 'Intern', loc: 'New York', status: 'active', date: '2024-06-01' },
      
      { first: 'Marcus', last: 'Vance', role: 'Head of Product', dept: 'Product & Design', type: 'Full-time', loc: 'San Francisco', status: 'active', date: '2021-05-18' },
      { first: 'Maya', last: 'Lin', role: 'Lead UI/UX Designer', dept: 'Product & Design', type: 'Full-time', loc: 'San Francisco', status: 'active', date: '2022-09-05' },
      { first: 'Julian', last: 'Bauer', role: 'Senior Product Manager', dept: 'Product & Design', type: 'Full-time', loc: 'Berlin', status: 'remote', date: '2023-03-22' },
      { first: 'Priya', last: 'Sharma', role: 'Product Analytics Lead', dept: 'Product & Design', type: 'Full-time', loc: 'Bengaluru', status: 'active', date: '2022-12-01' },
      { first: 'Lucas', last: 'Santos', role: 'Design System Specialist', dept: 'Product & Design', type: 'Contractor', loc: 'Remote', status: 'remote', date: '2023-10-15' },
      { first: 'Hannah', last: 'Schmidt', role: 'UX Research Associate', dept: 'Product & Design', type: 'Intern', loc: 'Berlin', status: 'on-leave', date: '2024-05-15' },

      { first: 'Sarah', last: 'Jenkins', role: 'Chief Commercial Officer', dept: 'Sales & Marketing', type: 'Full-time', loc: 'New York', status: 'active', date: '2021-03-01' },
      { first: 'Carlos', last: 'Mendez', role: 'Enterprise Account Executive', dept: 'Sales & Marketing', type: 'Full-time', loc: 'New York', status: 'active', date: '2022-07-11' },
      { first: 'Zoe', last: 'Washington', role: 'Growth Marketing Director', dept: 'Sales & Marketing', type: 'Full-time', loc: 'San Francisco', status: 'active', date: '2022-02-15' },
      { first: 'Oliver', last: 'Wright', role: 'Regional Sales Lead EMEA', dept: 'Sales & Marketing', type: 'Full-time', loc: 'London', status: 'remote', date: '2023-05-01' },
      { first: 'Fatima', last: 'Al-Mansoor', role: 'Content Strategy Manager', dept: 'Sales & Marketing', type: 'Part-time', loc: 'London', status: 'active', date: '2023-11-20' },
      { first: 'Rajesh', last: 'Varma', role: 'Solutions Engineer', dept: 'Sales & Marketing', type: 'Full-time', loc: 'Bengaluru', status: 'active', date: '2023-08-14' },
      { first: 'Emma', last: 'Wilson', role: 'Demand Generation Specialist', dept: 'Sales & Marketing', type: 'Contractor', loc: 'New York', status: 'on-leave', date: '2024-01-08' },

      { first: 'David', last: 'Kim', role: 'VP of Global Operations', dept: 'Operations', type: 'Full-time', loc: 'San Francisco', status: 'active', date: '2021-08-20' },
      { first: 'Nadia', last: 'Petrova', role: 'Workplace & Facilities Director', dept: 'Operations', type: 'Full-time', loc: 'London', status: 'active', date: '2022-04-18' },
      { first: 'Mateo', last: 'Rossi', role: 'IT Support & Systems Admin', dept: 'Operations', type: 'Full-time', loc: 'Berlin', status: 'active', date: '2023-02-01' },
      { first: 'Tara', last: 'Bose', role: 'Procurement Specialist', dept: 'Operations', type: 'Part-time', loc: 'Bengaluru', status: 'active', date: '2023-07-01' },
      { first: 'James', last: 'OBrien', role: 'Logistics Coordinator', dept: 'Operations', type: 'Contractor', loc: 'New York', status: 'inactive', date: '2024-01-10' },

      { first: 'Aisha', last: 'Patel', role: 'Chief People Officer', dept: 'Human Resources', type: 'Full-time', loc: 'San Francisco', status: 'active', date: '2021-04-10' },
      { first: 'Benjamin', last: 'Taylor', role: 'Senior Talent Acquisition Partner', dept: 'Human Resources', type: 'Full-time', loc: 'New York', status: 'active', date: '2022-10-01' },
      { first: 'Mei-Ling', last: 'Zhou', role: 'Employee Experience Manager', dept: 'Human Resources', type: 'Full-time', loc: 'Singapore', status: 'active', date: '2023-03-10' },
      { first: 'Antoine', last: 'Leroy', role: 'People Operations Coordinator', dept: 'Human Resources', type: 'Contractor', loc: 'London', status: 'on-leave', date: '2023-09-15' },

      { first: 'Robert', last: 'Chen', role: 'VP of Finance & Controller', dept: 'Finance & Legal', type: 'Full-time', loc: 'New York', status: 'active', date: '2021-06-01' },
      { first: 'Isabella', last: 'Moretti', role: 'Senior Corporate Counsel', dept: 'Finance & Legal', type: 'Full-time', loc: 'London', status: 'active', date: '2022-05-15' },
      { first: 'Siddharth', last: 'Rao', role: 'Financial Planning & Analysis Lead', dept: 'Finance & Legal', type: 'Full-time', loc: 'Bengaluru', status: 'active', date: '2023-04-01' },
      { first: 'Olivia', last: 'Davis', role: 'Payroll Specialist', dept: 'Finance & Legal', type: 'Part-time', loc: 'San Francisco', status: 'remote', date: '2023-10-01' },
      
      // Additional expansion employees for robust testing & pagination
      { first: 'Dmitri', last: 'Volkov', role: 'DevOps & Site Reliability Engineer', dept: 'Engineering', type: 'Full-time', loc: 'Berlin', status: 'active', date: '2023-05-10' },
      { first: 'Ananya', last: 'Deshmukh', role: 'Data Platform Engineer', dept: 'Engineering', type: 'Full-time', loc: 'Bengaluru', status: 'remote', date: '2023-07-15' },
      { first: 'Gabriel', last: 'Silva', role: 'Mobile iOS / Android Lead', dept: 'Engineering', type: 'Contractor', loc: 'Remote', status: 'remote', date: '2024-01-20' },
      { first: 'Emily', last: 'Clark', role: 'Frontend Software Intern', dept: 'Engineering', type: 'Intern', loc: 'San Francisco', status: 'active', date: '2024-06-15' },
      { first: 'Kenji', last: 'Takahashi', role: 'Systems Security Architect', dept: 'Engineering', type: 'Full-time', loc: 'Singapore', status: 'active', date: '2022-04-11' },
      { first: 'Sara', last: 'Lindqvist', role: 'Senior UX Researcher', dept: 'Product & Design', type: 'Full-time', loc: 'London', status: 'active', date: '2023-02-14' },
      { first: 'Leo', last: 'Kowalski', role: 'Technical Product Manager', dept: 'Product & Design', type: 'Full-time', loc: 'Berlin', status: 'active', date: '2023-08-01' },
      { first: 'Jessica', last: 'Lee', role: 'Design Systems Engineer', dept: 'Product & Design', type: 'Part-time', loc: 'San Francisco', status: 'remote', date: '2023-11-05' },
      { first: 'Thierry', last: 'Henry', role: 'Product Marketing Manager', dept: 'Sales & Marketing', type: 'Full-time', loc: 'London', status: 'active', date: '2023-03-01' },
      { first: 'Maria', last: 'Fernandez', role: 'Customer Success Executive', dept: 'Sales & Marketing', type: 'Full-time', loc: 'New York', status: 'active', date: '2022-09-18' },
      { first: 'Vikram', last: 'Malhotra', role: 'Inside Sales Specialist', dept: 'Sales & Marketing', type: 'Full-time', loc: 'Bengaluru', status: 'remote', date: '2024-02-01' },
      { first: 'Grace', last: 'Hopper', role: 'Brand & Event Coordinator', dept: 'Sales & Marketing', type: 'Part-time', loc: 'San Francisco', status: 'on-leave', date: '2023-12-10' },
      { first: 'Arthur', last: 'Pendelton', role: 'Supply Chain Operations Lead', dept: 'Operations', type: 'Full-time', loc: 'London', status: 'active', date: '2022-08-25' },
      { first: 'Fatou', last: 'Diop', role: 'Compliance & Audit Analyst', dept: 'Operations', type: 'Full-time', loc: 'New York', status: 'active', date: '2023-05-15' },
      { first: 'Kavita', last: 'Nair', role: 'HR Business Partner', dept: 'Human Resources', type: 'Full-time', loc: 'Bengaluru', status: 'active', date: '2022-11-01' },
      { first: 'Lars', last: 'Jensen', role: 'Talent Sourcer & Recruiter', dept: 'Human Resources', type: 'Contractor', loc: 'Berlin', status: 'remote', date: '2024-03-01' },
      { first: 'Rachel', last: 'Green', role: 'Senior Tax & Treasury Analyst', dept: 'Finance & Legal', type: 'Full-time', loc: 'New York', status: 'active', date: '2023-01-20' },
      { first: 'Kwan', last: 'Yip', role: 'Financial Systems Engineer', dept: 'Finance & Legal', type: 'Full-time', loc: 'Singapore', status: 'active', date: '2023-09-12' },
    ];

    const employeeIds: number[] = [];
    let empCodeCounter = 1001;

    for (const emp of rawEmployees) {
      const code = `STK-${empCodeCounter++}`;
      const email = `${emp.first.toLowerCase()}.${emp.last.toLowerCase().replace(/[^a-z]/g, '')}@stackly.io`;
      const initials = `${emp.first[0]}${emp.last[0]}`.toUpperCase();
      const deptId = deptMap[emp.dept];

      const res = insertEmployee.run(
        code,
        emp.first,
        emp.last,
        email,
        deptId,
        emp.role,
        emp.type,
        emp.loc,
        emp.status,
        initials,
        emp.date
      );
      employeeIds.push(Number(res.lastInsertRowid));
    }

    // 3. Seed 30 Days of Historical Attendance
    const insertAttendance = db.prepare(`
      INSERT INTO attendance (employee_id, date, status, check_in_time, check_out_time, work_mode, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const today = new Date();
    for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
      const d = new Date(today);
      d.setDate(d.getDate() - dayOffset);
      const dateStr = d.toISOString().split('T')[0];

      // Skip weekends for realistic office schedules
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      for (let i = 0; i < employeeIds.length; i++) {
        const empId = employeeIds[i];
        const raw = rawEmployees[i];

        let attStatus: 'present' | 'absent' | 'on-leave' | 'remote' = 'present';
        let workMode: 'Office' | 'Remote' | 'Hybrid' | 'Leave' = 'Office';

        if (raw.status === 'on-leave' && dayOffset <= 5) {
          attStatus = 'on-leave';
          workMode = 'Leave';
        } else if (raw.status === 'remote' || raw.loc === 'Remote') {
          attStatus = 'remote';
          workMode = 'Remote';
        } else {
          // Realistic variation based on hash
          const pseudoRand = (empId * 17 + dayOffset * 23) % 100;
          if (pseudoRand < 82) {
            attStatus = 'present';
            workMode = (pseudoRand % 3 === 0) ? 'Hybrid' : 'Office';
          } else if (pseudoRand < 92) {
            attStatus = 'remote';
            workMode = 'Remote';
          } else if (pseudoRand < 96) {
            attStatus = 'on-leave';
            workMode = 'Leave';
          } else {
            attStatus = 'absent';
            workMode = 'Office';
          }
        }

        const checkIn = (attStatus === 'present' || attStatus === 'remote') ? '09:04:12' : null;
        const checkOut = (attStatus === 'present' || attStatus === 'remote') ? '17:48:30' : null;

        insertAttendance.run(empId, dateStr, attStatus, checkIn, checkOut, workMode, `Status logged for ${dateStr}`);
      }
    }

    // 4. Seed Activity Logs
    const insertActivity = db.prepare(`
      INSERT INTO activity_logs (employee_id, action, timestamp, details)
      VALUES (?, ?, ?, ?)
    `);

    const actions = [
      { action: 'check-in', details: 'Clocked in via biometric badge scanner' },
      { action: 'check-out', details: 'Clocked out at end of shift' },
      { action: 'leave-requested', details: 'Submitted annual leave request (3 days)' },
      { action: 'leave-approved', details: 'Approved by department manager' },
      { action: 'new-hire', details: 'Completed digital onboarding workflow' },
      { action: 'check-in', details: 'Authenticated via SSO Workstation' },
    ];

    const baseTime = Date.now();
    for (let i = 0; i < employeeIds.length; i++) {
      const empId = employeeIds[i];
      const act = actions[i % actions.length];
      const minutesAgo = (i * 24) + 12;
      const timestamp = new Date(baseTime - minutesAgo * 60 * 1000).toISOString();

      insertActivity.run(empId, act.action, timestamp, act.details);
    }

    console.log(`✅ Seeded ${departments.length} departments, ${rawEmployees.length} employees, and 30 days of attendance records successfully.`);
  });

  seedTransaction();
}

// Auto-run when invoked via CLI
seedDatabase();
