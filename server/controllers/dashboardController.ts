import { Request, Response } from 'express';
import { attendanceRepository } from '../repositories/AttendanceRepository';
import { departmentRepository } from '../repositories/DepartmentRepository';
import { employeeRepository } from '../repositories/EmployeeRepository';
import type { QueryFilters } from '../types';

function parseFilters(req: Request): QueryFilters {
  const { department, location, status, employmentType, search, dateFrom, dateTo } = req.query;

  let depts: string[] | undefined;
  if (typeof department === 'string' && department.trim().length > 0) {
    depts = department.split(',').map(d => d.trim()).filter(Boolean);
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

export class DashboardController {
  public getKpis(req: Request, res: Response): void {
    try {
      const filters = parseFilters(req);
      const kpis = attendanceRepository.getKpiMetrics(filters);
      res.json({
        success: true,
        data: kpis,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Error fetching KPIs:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  public getAttendanceTrend(req: Request, res: Response): void {
    try {
      const filters = parseFilters(req);
      const days = parseInt(req.query.days as string, 10) || 14;
      const trend = attendanceRepository.getAttendanceTrend(days, filters);
      res.json({
        success: true,
        data: trend,
        days,
      });
    } catch (err: any) {
      console.error('Error fetching attendance trend:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  public getDepartmentDistribution(req: Request, res: Response): void {
    try {
      const filters = parseFilters(req);
      const data = departmentRepository.getAllWithMetrics({
        location: filters.location,
        status: filters.status,
      });

      // Filter by department if passed
      let filteredData = data;
      if (filters.department && filters.department.length > 0) {
        filteredData = data.filter(d => filters.department!.includes(d.department));
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
      const filters = parseFilters(req);
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
