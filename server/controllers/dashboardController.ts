import { Request, Response } from 'express';
import { attendanceRepository } from '../repositories/AttendanceRepository.js';
import { departmentRepository } from '../repositories/DepartmentRepository.js';
import { employeeRepository } from '../repositories/EmployeeRepository.js';
import type { QueryFilters } from '../types/index.js';
import type { AuthRequest } from '../middleware/auth.js';

function parseFilters(req: Request): QueryFilters {
  const { department, location, status, employmentType, search, dateFrom, dateTo } = req.query;

  let depts: string[] | undefined;
  if (typeof department === 'string' && department.trim().length > 0) {
    depts = department.split(',').map((d) => d.trim()).filter(Boolean);
  } else if (Array.isArray(department)) {
    depts = department.map(String).filter(Boolean);
  }

  return {
    department: depts && depts.length > 0 ? depts : undefined,
    location: typeof location === 'string' && location.trim().length > 0 ? location.trim() : undefined,
    status: typeof status === 'string' && status.trim().length > 0 ? status.trim() : undefined,
    employmentType: typeof employmentType === 'string' && employmentType.trim().length > 0 ? employmentType.trim() : undefined,
    search: typeof search === 'string' && search.trim().length > 0 ? search.trim() : undefined,
    dateFrom: typeof dateFrom === 'string' ? dateFrom : undefined,
    dateTo: typeof dateTo === 'string' ? dateTo : undefined,
  };
}

/**
 * Enforces data-level RBAC:
 * - Admin & HR: Unrestricted company-wide metrics
 * - Manager & Team Lead: Restricted strictly to their own assigned department
 */
function applyRbacDepartmentFilter(filters: QueryFilters, user?: AuthRequest['user']): QueryFilters {
  if (!user) return filters;

  if (user.role === 'manager' || user.role === 'team_lead') {
    if (user.departmentName) {
      return {
        ...filters,
        department: [user.departmentName],
      };
    }
  }

  return filters;
}

export class DashboardController {
  public getKpis(req: Request, res: Response): void {
    try {
      const authReq = req as AuthRequest;
      const rawFilters = parseFilters(req);
      const filters = applyRbacDepartmentFilter(rawFilters, authReq.user);

      const kpis = attendanceRepository.getKpiMetrics(filters);
      res.json({
        success: true,
        data: kpis,
        scope: authReq.user?.role === 'manager' || authReq.user?.role === 'team_lead'
          ? { type: 'department', name: authReq.user.departmentName }
          : { type: 'company_wide' },
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Error fetching KPIs:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  public getAttendanceTrend(req: Request, res: Response): void {
    try {
      const authReq = req as AuthRequest;
      const rawFilters = parseFilters(req);
      const filters = applyRbacDepartmentFilter(rawFilters, authReq.user);

      const days = parseInt(req.query.days as string, 10) || 14;
      const trend = attendanceRepository.getAttendanceTrend(days, filters);
      res.json({
        success: true,
        data: trend,
        days,
        scope: authReq.user?.role === 'manager' || authReq.user?.role === 'team_lead'
          ? { type: 'department', name: authReq.user.departmentName }
          : { type: 'company_wide' },
      });
    } catch (err: any) {
      console.error('Error fetching attendance trend:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  public getDepartmentDistribution(req: Request, res: Response): void {
    try {
      const authReq = req as AuthRequest;
      const rawFilters = parseFilters(req);
      const filters = applyRbacDepartmentFilter(rawFilters, authReq.user);

      const data = departmentRepository.getAllWithMetrics({
        location: filters.location,
        status: filters.status,
      });

      // Filter by department if passed or enforced by RBAC
      let filteredData = data;
      if (filters.department && filters.department.length > 0) {
        filteredData = data.filter((d) => filters.department!.includes(d.department));
      }

      res.json({
        success: true,
        data: filteredData,
      });
    } catch (err: any) {
      console.error('Error fetching department distribution:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  public getWorkforceSegments(req: Request, res: Response): void {
    try {
      const authReq = req as AuthRequest;
      const rawFilters = parseFilters(req);
      const filters = applyRbacDepartmentFilter(rawFilters, authReq.user);

      const segments = employeeRepository.getEmploymentTypeDistribution(filters);
      const total = segments.reduce((sum, s) => sum + s.value, 0);

      res.json({
        success: true,
        data: segments,
        total,
      });
    } catch (err: any) {
      console.error('Error fetching workforce segments:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }
}

export const dashboardController = new DashboardController();
