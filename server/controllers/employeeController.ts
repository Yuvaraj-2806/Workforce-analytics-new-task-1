import { Request, Response } from 'express';
import { employeeRepository } from '../repositories/EmployeeRepository.js';
import { db } from '../db/database.js';
import type { QueryFilters, PaginationParams } from '../types/index.js';
import type { AuthRequest } from '../middleware/auth.js';

export class EmployeeController {
  public getEmployees(req: Request, res: Response): void {
    try {
      const authReq = req as AuthRequest;
      const user = authReq.user;

      const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '10', 10)));
      const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'name';
      const sortOrder = req.query.sortOrder === 'desc' ? 'desc' : 'asc';

      const { department, location, status, employmentType, search } = req.query;

      let depts: string[] | undefined;
      if (typeof department === 'string' && department.trim().length > 0) {
        depts = department.split(',').map((d) => d.trim()).filter(Boolean);
      } else if (Array.isArray(department)) {
        depts = department.map(String).filter(Boolean);
      }

      const filters: QueryFilters = {
        department: depts && depts.length > 0 ? depts : undefined,
        location: typeof location === 'string' && location.trim().length > 0 ? location.trim() : undefined,
        status: typeof status === 'string' && status.trim().length > 0 ? status.trim() : undefined,
        employmentType: typeof employmentType === 'string' && employmentType.trim().length > 0 ? employmentType.trim() : undefined,
        search: typeof search === 'string' && search.trim().length > 0 ? search.trim() : undefined,
      };

      // ── RBAC Data Restriction ─────────────────────────────────
      // Managers & Team Leads are restricted to their assigned department
      if (user && (user.role === 'manager' || user.role === 'team_lead')) {
        if (user.departmentName) {
          filters.department = [user.departmentName];
        }
      }

      const pagination: PaginationParams = {
        page,
        limit,
        sortBy,
        sortOrder,
      };

      const result = employeeRepository.findPaginated(filters, pagination);

      res.json({
        success: true,
        data: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
        scope:
          user?.role === 'manager' || user?.role === 'team_lead'
            ? { type: 'department', name: user.departmentName }
            : { type: 'company_wide' },
      });
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  public getEmployeeById(req: Request, res: Response): void {
    try {
      const id = parseInt(req.params.id, 10);
      const employee = db.prepare(`
        SELECT e.*, d.name AS department_name, d.color AS department_color
        FROM employees e
        JOIN departments d ON e.department_id = d.id
        WHERE e.id = ?
      `).get(id);

      if (!employee) {
        res.status(404).json({ success: false, error: 'Employee not found.' });
        return;
      }

      res.json({ success: true, data: employee });
    } catch (err: any) {
      console.error('Error fetching employee by ID:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  public getMyProfile(req: Request, res: Response): void {
    try {
      const authReq = req as AuthRequest;
      const user = authReq.user;

      if (!user) {
        res.status(401).json({ success: false, error: 'Not authenticated.' });
        return;
      }

      if (!user.employeeId) {
        // Fallback info if user is not linked to a specific employee record
        res.json({
          success: true,
          data: {
            id: null,
            userId: user.id,
            email: user.email,
            role: user.role,
            departmentName: user.departmentName || 'Global Administration',
            isSystemAdmin: user.role === 'admin',
          },
        });
        return;
      }

      const employee = db.prepare(`
        SELECT e.*, d.name AS department_name, d.color AS department_color
        FROM employees e
        JOIN departments d ON e.department_id = d.id
        WHERE e.id = ?
      `).get(user.employeeId);

      if (!employee) {
        res.status(404).json({ success: false, error: 'Linked employee profile not found.' });
        return;
      }

      // Also get recent attendance summary for this employee
      const attendanceSummary = db.prepare(`
        SELECT
          COUNT(*) as total_days,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
          SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
          SUM(CASE WHEN status = 'on-leave' THEN 1 ELSE 0 END) as leave_days,
          SUM(CASE WHEN status = 'remote' THEN 1 ELSE 0 END) as remote_days
        FROM attendance
        WHERE employee_id = ?
      `).get(user.employeeId);

      res.json({
        success: true,
        data: {
          ...employee,
          attendanceSummary,
        },
      });
    } catch (err: any) {
      console.error('Error in getMyProfile:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  public getMyAttendance(req: Request, res: Response): void {
    try {
      const authReq = req as AuthRequest;
      const user = authReq.user;

      if (!user || !user.employeeId) {
        res.status(400).json({ success: false, error: 'No employee record associated with this account.' });
        return;
      }

      const days = parseInt((req.query.days as string) || '30', 10);

      const records = db.prepare(`
        SELECT id, date, status, check_in_time, check_out_time, work_mode, notes
        FROM attendance
        WHERE employee_id = ?
        ORDER BY date DESC
        LIMIT ?
      `).all(user.employeeId, days);

      res.json({ success: true, data: records });
    } catch (err: any) {
      console.error('Error in getMyAttendance:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }
}

export const employeeController = new EmployeeController();
