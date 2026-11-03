import { Request, Response } from 'express';
import { employeeRepository } from '../repositories/EmployeeRepository';
import type { QueryFilters, PaginationParams } from '../types';

export class EmployeeController {
  public getEmployees(req: Request, res: Response): void {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
      const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'name';
      const sortOrder = req.query.sortOrder === 'desc' ? 'desc' : 'asc';

      const { department, location, status, employmentType, search } = req.query;

      let depts: string[] | undefined;
      if (typeof department === 'string' && department.trim().length > 0) {
        depts = department.split(',').map(d => d.trim()).filter(Boolean);
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
      });
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }
}

export const employeeController = new EmployeeController();
