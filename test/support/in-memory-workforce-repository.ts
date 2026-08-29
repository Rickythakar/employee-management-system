import type { WorkforceRepository } from '../../src/application/workforce-repository.js';
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
} from '../../src/domain/models.js';

export class InMemoryWorkforceRepository implements WorkforceRepository {
  departments: Department[] = [];
  roles: Role[] = [];
  employees: Employee[] = [];

  async listDepartments(): Promise<Department[]> {
    return [...this.departments];
  }

  async findDepartmentById(id: number): Promise<Department | null> {
    return this.departments.find((department) => department.id === id) ?? null;
  }

  async findDepartmentByName(name: string): Promise<Department | null> {
    const candidate = name.toLocaleLowerCase();
    return (
      this.departments.find((department) => department.name.toLocaleLowerCase() === candidate) ??
      null
    );
  }

  async createDepartment(name: string): Promise<Department> {
    const department = { id: this.nextId(this.departments), name };
    this.departments.push(department);
    return department;
  }

  async deleteDepartment(id: number): Promise<void> {
    this.departments = this.departments.filter((department) => department.id !== id);
  }

  async countRolesByDepartment(departmentId: number): Promise<number> {
    return this.roles.filter((role) => role.departmentId === departmentId).length;
  }

  async listRoles(): Promise<RoleView[]> {
    return this.roles.map((role) => ({
      ...role,
      departmentName:
        this.departments.find((department) => department.id === role.departmentId)?.name ??
        'Unknown',
    }));
  }

  async findRoleById(id: number): Promise<Role | null> {
    return this.roles.find((role) => role.id === id) ?? null;
  }

  async findRoleByTitle(title: string): Promise<Role | null> {
    const candidate = title.toLocaleLowerCase();
    return this.roles.find((role) => role.title.toLocaleLowerCase() === candidate) ?? null;
  }

  async createRole(input: NewRole): Promise<Role> {
    const role = { id: this.nextId(this.roles), ...input };
    this.roles.push(role);
    return role;
  }

  async deleteRole(id: number): Promise<void> {
    this.roles = this.roles.filter((role) => role.id !== id);
  }

  async countEmployeesByRole(roleId: number): Promise<number> {
    return this.employees.filter((employee) => employee.roleId === roleId).length;
  }

  async listEmployees(): Promise<EmployeeView[]> {
    return this.employees.map((employee) => {
      const role = this.roles.find((candidate) => candidate.id === employee.roleId);
      const department = this.departments.find((candidate) => candidate.id === role?.departmentId);
      const manager = this.employees.find((candidate) => candidate.id === employee.managerId);
      return {
        ...employee,
        roleTitle: role?.title ?? 'Unknown',
        departmentName: department?.name ?? 'Unknown',
        salaryCents: role?.salaryCents ?? 0,
        managerName: manager ? `${manager.firstName} ${manager.lastName}` : null,
      };
    });
  }

  async findEmployeeById(id: number): Promise<Employee | null> {
    return this.employees.find((employee) => employee.id === id) ?? null;
  }

  async createEmployee(input: NewEmployee): Promise<Employee> {
    const employee = { id: this.nextId(this.employees), ...input };
    this.employees.push(employee);
    return employee;
  }

  async updateEmployeeRole(employeeId: number, roleId: number): Promise<Employee> {
    const employee = this.requiredEmployee(employeeId);
    employee.roleId = roleId;
    return employee;
  }

  async updateEmployeeManager(employeeId: number, managerId: number | null): Promise<Employee> {
    const employee = this.requiredEmployee(employeeId);
    employee.managerId = managerId;
    return employee;
  }

  async deleteEmployee(id: number): Promise<void> {
    this.employees = this.employees.filter((employee) => employee.id !== id);
  }

  async countReportsByManager(managerId: number): Promise<number> {
    return this.employees.filter((employee) => employee.managerId === managerId).length;
  }

  async wouldCreateManagementCycle(employeeId: number, managerId: number): Promise<boolean> {
    let currentId: number | null = managerId;
    const visited = new Set<number>();

    while (currentId !== null && !visited.has(currentId)) {
      if (currentId === employeeId) return true;
      visited.add(currentId);
      currentId = (await this.findEmployeeById(currentId))?.managerId ?? null;
    }

    return false;
  }

  async getDepartmentBudgets(): Promise<DepartmentBudget[]> {
    return this.departments.map((department) => {
      const departmentRoles = this.roles.filter((role) => role.departmentId === department.id);
      const roleIds = new Set(departmentRoles.map((role) => role.id));
      const employees = this.employees.filter((employee) => roleIds.has(employee.roleId));
      return {
        departmentId: department.id,
        departmentName: department.name,
        employeeCount: employees.length,
        totalSalaryCents: employees.reduce(
          (total, employee) =>
            total + (departmentRoles.find((role) => role.id === employee.roleId)?.salaryCents ?? 0),
          0,
        ),
      };
    });
  }

  async getSummary(): Promise<WorkforceSummary> {
    return {
      departmentCount: this.departments.length,
      roleCount: this.roles.length,
      employeeCount: this.employees.length,
      totalSalaryCents: this.employees.reduce(
        (total, employee) =>
          total + (this.roles.find((role) => role.id === employee.roleId)?.salaryCents ?? 0),
        0,
      ),
    };
  }

  private nextId(records: Array<{ id: number }>): number {
    return Math.max(0, ...records.map((record) => record.id)) + 1;
  }

  private requiredEmployee(id: number): Employee {
    const employee = this.employees.find((candidate) => candidate.id === id);
    if (!employee) throw new Error(`Employee ${id} not found`);
    return employee;
  }
}
