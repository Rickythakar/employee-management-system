INSERT INTO department (id, name)
VALUES (001, "sales"),
       (002, "billing")

INSERT INTO role (id, title, salary, department_id)
VALUES (001, "supervisor", 50000, 001),
       (002, "associate", 40000, 001)

INSERT INTO employee (id, first_name, last_name, role_id, manager_id)
VALUES (001, "sales"),
       (002, "billing")

