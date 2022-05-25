DROP DATABASE IF EXISTS employeeManager_db;
CREATE DATABASE employeeManager_db;

-- Makes it so all of the following code will affect employeeManager_db --
USE employeeManager_db;

-- Creates the table "department" within employeeManager_db --
CREATE TABLE department (
    id int primary key auto_increment,
    name VARCHAR(30) not null
)

CREATE TABLE role(
    id INT PRIMARY KEY auto_increment,
-- to hold role title
    title VARCHAR(30),
-- to hold role salary
    salary DECIMAL,
-- to hold reference to department role belongs to
    department_id INT
)
CREATE TABLE employee (
    id INT PRIMARY KEY auto_increment,
    -- to hold employee first name
    first_name VARCHAR(30), 
--  to hold employee last name
    last_name VARCHAR(30),
--  to hold reference to employee role
    role_id INT,
--  to hold reference to another employee that is the manager of the current employee (`null` if the employee has no manager)
    manager_id INT
)
