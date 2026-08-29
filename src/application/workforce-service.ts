import {
  ConflictError,
  DependencyError,
  NotFoundError,
  ValidationError,
} from '../domain/errors.js';
import type {
  Department,
  DepartmentBudget,
  Employee,
  EmployeeView,
  NewEmployee,
  NewRole,
  Role,
  RoleView,
  WorkforceSummary,
} from '../domain/models.js';
import type { WorkforceRepository } from './workforce-repository.js';

const MAX_NAME_LENGTH = 80;
const MAX_ROLE_LENGTH = 100;
const MAX_SALARY_CENTS = 100_000_000_00;

export class WorkforceService {
  constructor(private readonly repository: WorkforceRepository) {}

  listDepartments(): Promise<Department[]> {
    return this.repository.listDepartments();
  }

  listRoles(): Promise<RoleView[]> {
    return this.repository.listRoles();
  }

  listEmployees(): Promise<EmployeeView[]> {
    return this.repository.listEmployees();
  }

  getDepartmentBudgets(): Promise<DepartmentBudget[]> {
    return this.repository.getDepartmentBudgets();
  }

  getSummary(): Promise<WorkforceSummary> {
    return this.repository.getSummary();
  }

  async addDepartment(rawName: string): Promise<Department> {
    const name = normalizeText(rawName, 'Department name', MAX_NAME_LENGTH);
    if (await this.repository.findDepartmentByName(name)) {
      throw new ConflictError(`Department "${name}" already exists.`);
    }
    return this.repository.createDepartment(name);
  }

  async addRole(input: NewRole): Promise<Role> {
    const title = normalizeText(input.title, 'Role title', MAX_ROLE_LENGTH);
    const salaryCents = requireSalary(input.salaryCents);
    const departmentId = requireId(input.departmentId, 'Department');

    await this.requireDepartment(departmentId);
    if (await this.repository.findRoleByTitle(title)) {
      throw new ConflictError(`Role "${title}" already exists.`);
    }

    return this.repository.createRole({ title, salaryCents, departmentId });
  }

  async addEmployee(input: NewEmployee): Promise<Employee> {
    const firstName = normalizeText(input.firstName, 'First name', MAX_NAME_LENGTH);
    const lastName = normalizeText(input.lastName, 'Last name', MAX_NAME_LENGTH);
    const roleId = requireId(input.roleId, 'Role');

    await this.requireRole(roleId);
    if (input.managerId !== null) {
      await this.requireEmployee(requireId(input.managerId, 'Manager'));
    }

    return this.repository.createEmployee({
      firstName,
      lastName,
      roleId,
      managerId: input.managerId,
    });
  }

  async changeRole(employeeIdInput: number, roleIdInput: number): Promise<Employee> {
    const employeeId = requireId(employeeIdInput, 'Employee');
    const roleId = requireId(roleIdInput, 'Role');
    await Promise.all([this.requireEmployee(employeeId), this.requireRole(roleId)]);
    return this.repository.updateEmployeeRole(employeeId, roleId);
  }

  async changeManager(employeeIdInput: number, managerIdInput: number | null): Promise<Employee> {
    const employeeId = requireId(employeeIdInput, 'Employee');
    await this.requireEmployee(employeeId);

    if (managerIdInput === null) {
      return this.repository.updateEmployeeManager(employeeId, null);
    }

    const managerId = requireId(managerIdInput, 'Manager');
    if (managerId === employeeId) {
      throw new ValidationError('An employee cannot manage themself.');
    }
    await this.requireEmployee(managerId);
    if (await this.repository.wouldCreateManagementCycle(employeeId, managerId)) {
      throw new ConflictError('That reporting line would create a management cycle.');
    }

    return this.repository.updateEmployeeManager(employeeId, managerId);
  }

  async removeDepartment(idInput: number): Promise<void> {
    const id = requireId(idInput, 'Department');
    await this.requireDepartment(id);
    const roleCount = await this.repository.countRolesByDepartment(id);
    if (roleCount > 0) {
      throw new DependencyError(
        `Department has ${roleCount} role${roleCount === 1 ? '' : 's'}; move or remove them first.`,
      );
    }
    await this.repository.deleteDepartment(id);
  }

  async removeRole(idInput: number): Promise<void> {
    const id = requireId(idInput, 'Role');
    await this.requireRole(id);
    const employeeCount = await this.repository.countEmployeesByRole(id);
    if (employeeCount > 0) {
      throw new DependencyError(
        `Role is assigned to ${employeeCount} employee${employeeCount === 1 ? '' : 's'}; reassign them first.`,
      );
    }
    await this.repository.deleteRole(id);
  }

  async removeEmployee(idInput: number): Promise<void> {
    const id = requireId(idInput, 'Employee');
    await this.requireEmployee(id);
    const reportCount = await this.repository.countReportsByManager(id);
    if (reportCount > 0) {
      throw new DependencyError(
        `Employee manages ${reportCount} direct report${reportCount === 1 ? '' : 's'}; reassign them first.`,
      );
    }
    await this.repository.deleteEmployee(id);
  }

  private async requireDepartment(id: number): Promise<Department> {
    const department = await this.repository.findDepartmentById(id);
    if (!department) throw new NotFoundError(`Department ${id} was not found.`);
    return department;
  }

  private async requireRole(id: number): Promise<Role> {
    const role = await this.repository.findRoleById(id);
    if (!role) throw new NotFoundError(`Role ${id} was not found.`);
    return role;
  }

  private async requireEmployee(id: number): Promise<Employee> {
    const employee = await this.repository.findEmployeeById(id);
    if (!employee) throw new NotFoundError(`Employee ${id} was not found.`);
    return employee;
  }
}

function normalizeText(value: string, label: string, maximumLength: number): string {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (normalized.length === 0) throw new ValidationError(`${label} is required.`);
  if (normalized.length > maximumLength) {
    throw new ValidationError(`${label} must be ${maximumLength} characters or fewer.`);
  }
  return normalized;
}

function requireId(value: number, label: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new ValidationError(`${label} ID must be a positive integer.`);
  }
  return value;
}

function requireSalary(value: number): number {
  if (!Number.isSafeInteger(value) || value <= 0 || value > MAX_SALARY_CENTS) {
    throw new ValidationError('Salary must be a positive amount no greater than $100,000,000.');
  }
  return value;
}
