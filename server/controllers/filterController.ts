import { Request, Response } from 'express';
import { departmentRepository } from '../repositories/DepartmentRepository';
import { employeeRepository } from '../repositories/EmployeeRepository';

export class FilterController {
  public getOptions(_req: Request, res: Response): void {
    try {
      const departments = departmentRepository.findAll().map(d => d.name);
      const locations = ['All Locations', ...employeeRepository.getLocations()];
      const statuses = ['All', 'Active', 'On Leave', 'Remote', 'Inactive'];
      const employmentTypes = ['All Types', 'Full-time', 'Part-time', 'Contractor', 'Intern'];

      res.json({
        success: true,
        data: {
          departments,
          locations,
          statuses,
          employmentTypes,
        },
      });
    } catch (err: any) {
      console.error('Error fetching filter options:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }
}

export const filterController = new FilterController();
