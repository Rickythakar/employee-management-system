export interface Department {
  id: number;
  name: string;
}

export interface Role {
  id: number;
  title: string;
  salaryCents: number;
  departmentId: number;
}

export interface RoleView extends Role {
  departmentName: string;
}

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  roleId: number;
  managerId: number | null;
}

export interface EmployeeView extends Employee {
  roleTitle: string;
  departmentName: string;
  salaryCents: number;
  managerName: string | null;
}

export interface DepartmentBudget {
  departmentId: number;
  departmentName: string;
  employeeCount: number;
  totalSalaryCents: number;
}

export interface WorkforceSummary {
  departmentCount: number;
  roleCount: number;
  employeeCount: number;
  totalSalaryCents: number;
}

export interface NewRole {
  title: string;
  salaryCents: number;
  departmentId: number;
}

export interface NewEmployee {
  firstName: string;
  lastName: string;
  roleId: number;
  managerId: number | null;
}
