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

export interface WorkforceRepository {
  listDepartments(): Promise<Department[]>;
  findDepartmentById(id: number): Promise<Department | null>;
  findDepartmentByName(name: string): Promise<Department | null>;
  createDepartment(name: string): Promise<Department>;
  deleteDepartment(id: number): Promise<void>;
  countRolesByDepartment(departmentId: number): Promise<number>;

  listRoles(): Promise<RoleView[]>;
  findRoleById(id: number): Promise<Role | null>;
  findRoleByTitle(title: string): Promise<Role | null>;
  createRole(input: NewRole): Promise<Role>;
  deleteRole(id: number): Promise<void>;
  countEmployeesByRole(roleId: number): Promise<number>;

  listEmployees(): Promise<EmployeeView[]>;
  findEmployeeById(id: number): Promise<Employee | null>;
  createEmployee(input: NewEmployee): Promise<Employee>;
  updateEmployeeRole(employeeId: number, roleId: number): Promise<Employee>;
  updateEmployeeManager(employeeId: number, managerId: number | null): Promise<Employee>;
  deleteEmployee(id: number): Promise<void>;
  countReportsByManager(managerId: number): Promise<number>;
  wouldCreateManagementCycle(employeeId: number, managerId: number): Promise<boolean>;

  getDepartmentBudgets(): Promise<DepartmentBudget[]>;
  getSummary(): Promise<WorkforceSummary>;
}
