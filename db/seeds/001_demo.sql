INSERT INTO departments (id, name)
VALUES
  (1, 'Engineering'),
  (2, 'Customer Success'),
  (3, 'Operations')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO roles (id, title, salary_cents, department_id)
VALUES
  (1, 'VP of Engineering', 18500000, 1),
  (2, 'Senior Software Engineer', 14500000, 1),
  (3, 'Customer Success Manager', 10500000, 2),
  (4, 'Operations Analyst', 8500000, 3)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  salary_cents = VALUES(salary_cents),
  department_id = VALUES(department_id);

INSERT INTO employees (id, first_name, last_name, role_id, manager_id)
VALUES (1, 'Grace', 'Hopper', 1, NULL)
ON DUPLICATE KEY UPDATE
  first_name = VALUES(first_name),
  last_name = VALUES(last_name),
  role_id = VALUES(role_id),
  manager_id = VALUES(manager_id);

INSERT INTO employees (id, first_name, last_name, role_id, manager_id)
VALUES
  (2, 'Ada', 'Lovelace', 2, 1),
  (3, 'Katherine', 'Johnson', 3, 1),
  (4, 'Margaret', 'Hamilton', 4, 1)
ON DUPLICATE KEY UPDATE
  first_name = VALUES(first_name),
  last_name = VALUES(last_name),
  role_id = VALUES(role_id),
  manager_id = VALUES(manager_id);
