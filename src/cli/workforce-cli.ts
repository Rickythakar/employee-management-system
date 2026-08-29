import type { WorkforceService } from '../application/workforce-service.js';
import type { EmployeeView, RoleView } from '../domain/models.js';
import { ValidationError } from '../domain/errors.js';
import { formatCurrency, parseCurrencyToCents } from './formatters.js';
import type { OutputAdapter } from './output-adapter.js';
import type { Choice, PromptAdapter } from './prompt-adapter.js';

type MenuAction =
  | 'view-summary'
  | 'view-departments'
  | 'view-roles'
  | 'view-employees'
  | 'view-budgets'
  | 'add-department'
  | 'add-role'
  | 'add-employee'
  | 'update-role'
  | 'update-manager'
  | 'remove-employee'
  | 'remove-role'
  | 'remove-department'
  | 'exit';

const menuChoices: Choice<MenuAction>[] = [
  { name: 'Organization summary', value: 'view-summary' },
  { name: 'View departments', value: 'view-departments' },
  { name: 'View roles', value: 'view-roles' },
  { name: 'View employees', value: 'view-employees' },
  { name: 'View department budgets', value: 'view-budgets' },
  { name: 'Add a department', value: 'add-department' },
  { name: 'Add a role', value: 'add-role' },
  { name: 'Add an employee', value: 'add-employee' },
  { name: 'Change an employee role', value: 'update-role' },
  { name: 'Change an employee manager', value: 'update-manager' },
  { name: 'Remove an employee', value: 'remove-employee' },
  { name: 'Remove a role', value: 'remove-role' },
  { name: 'Remove a department', value: 'remove-department' },
  { name: 'Exit', value: 'exit' },
];

export class WorkforceCli {
  constructor(
    private readonly service: WorkforceService,
    private readonly prompt: PromptAdapter,
    private readonly output: OutputAdapter,
  ) {}

  async run(): Promise<void> {
    this.output.log('Workforce Operations Console');

    while (true) {
      const action = await this.prompt.select('What would you like to do?', menuChoices);
      if (action === 'exit') {
        this.output.log('Goodbye.');
        return;
      }

      try {
        await this.execute(action);
      } catch (error) {
        this.output.error(error instanceof Error ? error.message : 'An unexpected error occurred.');
      }
    }
  }

  private async execute(action: Exclude<MenuAction, 'exit'>): Promise<void> {
    switch (action) {
      case 'view-summary':
        await this.viewSummary();
        return;
      case 'view-departments':
        await this.viewDepartments();
        return;
      case 'view-roles':
        await this.viewRoles();
        return;
      case 'view-employees':
        await this.viewEmployees();
        return;
      case 'view-budgets':
        await this.viewBudgets();
        return;
      case 'add-department':
        await this.addDepartment();
        return;
      case 'add-role':
        await this.addRole();
        return;
      case 'add-employee':
        await this.addEmployee();
        return;
      case 'update-role':
        await this.updateRole();
        return;
      case 'update-manager':
        await this.updateManager();
        return;
      case 'remove-employee':
        await this.removeEmployee();
        return;
      case 'remove-role':
        await this.removeRole();
        return;
      case 'remove-department':
        await this.removeDepartment();
    }
  }

  private async viewSummary(): Promise<void> {
    const summary = await this.service.getSummary();
    this.output.table([
      {
        Departments: summary.departmentCount,
        Roles: summary.roleCount,
        Employees: summary.employeeCount,
        'Annual payroll': formatCurrency(summary.totalSalaryCents),
      },
    ]);
  }

  private async viewDepartments(): Promise<void> {
    const departments = await this.service.listDepartments();
    this.output.table(
      departments.map((department) => ({ ID: department.id, Name: department.name })),
    );
  }

  private async viewRoles(): Promise<void> {
    const roles = await this.service.listRoles();
    this.output.table(roles.map(roleRow));
  }

  private async viewEmployees(): Promise<void> {
    const employees = await this.service.listEmployees();
    this.output.table(employees.map(employeeRow));
  }

  private async viewBudgets(): Promise<void> {
    const budgets = await this.service.getDepartmentBudgets();
    this.output.table(
      budgets.map((budget) => ({
        Department: budget.departmentName,
        Employees: budget.employeeCount,
        'Annual payroll': formatCurrency(budget.totalSalaryCents),
      })),
    );
  }

  private async addDepartment(): Promise<void> {
    const name = await this.prompt.input('Department name:');
    const department = await this.service.addDepartment(name);
    this.output.log(`Added department: ${department.name}.`);
  }

  private async addRole(): Promise<void> {
    const title = await this.prompt.input('Role title:');
    const salaryCents = parseCurrencyToCents(await this.prompt.input('Annual salary (USD):'));
    const departmentId = await this.chooseDepartment('Department:');
    const role = await this.service.addRole({ title, salaryCents, departmentId });
    this.output.log(`Added role: ${role.title}.`);
  }

  private async addEmployee(): Promise<void> {
    const firstName = await this.prompt.input('First name:');
    const lastName = await this.prompt.input('Last name:');
    const roleId = await this.chooseRole('Role:');
    const employees = await this.service.listEmployees();
    const managerId = await this.prompt.select<number | null>('Manager:', [
      { name: 'No manager', value: null },
      ...employees.map(employeeChoice),
    ]);
    const employee = await this.service.addEmployee({ firstName, lastName, roleId, managerId });
    this.output.log(`Added employee: ${employee.firstName} ${employee.lastName}.`);
  }

  private async updateRole(): Promise<void> {
    const employeeId = await this.chooseEmployee('Employee:');
    const roleId = await this.chooseRole('New role:');
    await this.service.changeRole(employeeId, roleId);
    this.output.log('Employee role updated.');
  }

  private async updateManager(): Promise<void> {
    const employees = requireRecords(await this.service.listEmployees(), 'employees');
    const employeeId = await this.prompt.select('Employee:', employees.map(employeeChoice));
    const managerId = await this.prompt.select<number | null>('New manager:', [
      { name: 'No manager', value: null },
      ...employees.filter((employee) => employee.id !== employeeId).map(employeeChoice),
    ]);
    await this.service.changeManager(employeeId, managerId);
    this.output.log('Employee manager updated.');
  }

  private async removeEmployee(): Promise<void> {
    const employeeId = await this.chooseEmployee('Employee to remove:');
    if (!(await this.prompt.confirm('Permanently remove this employee?'))) {
      this.output.log('Deletion cancelled.');
      return;
    }
    await this.service.removeEmployee(employeeId);
    this.output.log('Employee removed.');
  }

  private async removeRole(): Promise<void> {
    const roleId = await this.chooseRole('Role to remove:');
    if (!(await this.prompt.confirm('Permanently remove this role?'))) {
      this.output.log('Deletion cancelled.');
      return;
    }
    await this.service.removeRole(roleId);
    this.output.log('Role removed.');
  }

  private async removeDepartment(): Promise<void> {
    const departmentId = await this.chooseDepartment('Department to remove:');
    if (!(await this.prompt.confirm('Permanently remove this department?'))) {
      this.output.log('Deletion cancelled.');
      return;
    }
    await this.service.removeDepartment(departmentId);
    this.output.log('Department removed.');
  }

  private async chooseDepartment(message: string): Promise<number> {
    const departments = requireRecords(await this.service.listDepartments(), 'departments');
    return this.prompt.select(
      message,
      departments.map((department) => ({ name: department.name, value: department.id })),
    );
  }

  private async chooseRole(message: string): Promise<number> {
    const roles = requireRecords(await this.service.listRoles(), 'roles');
    return this.prompt.select(message, roles.map(roleChoice));
  }

  private async chooseEmployee(message: string): Promise<number> {
    const employees = requireRecords(await this.service.listEmployees(), 'employees');
    return this.prompt.select(message, employees.map(employeeChoice));
  }
}

function requireRecords<T>(records: T[], label: string): T[] {
  if (records.length === 0) throw new ValidationError(`No ${label} are available.`);
  return records;
}

function roleChoice(role: RoleView): Choice<number> {
  return { name: `${role.title} — ${role.departmentName}`, value: role.id };
}

function employeeChoice(employee: EmployeeView): Choice<number> {
  return {
    name: `${employee.firstName} ${employee.lastName} — ${employee.roleTitle}`,
    value: employee.id,
  };
}

function roleRow(role: RoleView): Record<string, unknown> {
  return {
    ID: role.id,
    Role: role.title,
    Department: role.departmentName,
    Salary: formatCurrency(role.salaryCents),
  };
}

function employeeRow(employee: EmployeeView): Record<string, unknown> {
  return {
    ID: employee.id,
    Employee: `${employee.firstName} ${employee.lastName}`,
    Role: employee.roleTitle,
    Department: employee.departmentName,
    Manager: employee.managerName ?? '—',
    Salary: formatCurrency(employee.salaryCents),
  };
}
