const inquirer = require('inquirer')
const mysql = require('mysql2')
const consoleTable = require('console.table')

// Connect to database
const db = mysql.createConnection(
    {
        host: 'localhost',
        // MySQL username,
        user: 'root',
        // MySQL password
        password: 'rootroot',
        database: 'employeeManager_db'
    },
    console.log(`Connected to the employeeManager_db database.`)
);

function displayMenu() {
    return inquirer
        .prompt([
            {
                type: 'list',
                name: 'menuChoice',
                message: 'What would you like to do?',
                choices: [
                    'View all departments',
                    'View all Roles',
                    'View all employees',
                    'Add a department',
                    'Add a role',
                    'Add an employee',
                    'Update an employee role',
                    'Exit']
            }])
        .then((menuResponse) => {

            //View Departments
            if (menuResponse.menuChoice === 'View all departments') {
                console.log("viewing all departments")
                viewDepartments()
            }
            //View Roles
            if (menuResponse.menuChoice === 'View all Roles') {
                console.log("viewing all roles")
                viewRoles()
            }
            //View Employees
            if (menuResponse.menuChoice === 'View all employees') {
                console.log("viewing all employees")
                viewEmployees()
            }
            //Add Department
            if (menuResponse.menuChoice === 'Add a department') {
                addDepartment()
            }
            //Add Role
            if (menuResponse.menuChoice === 'Add a role') {
                addRole()
            }
            //Add Employee
            if (menuResponse.menuChoice === 'Add an employee') {
                addEmployee()
            }
            //Update an employee role
            if (menuResponse.menuChoice === 'Update an employee role') {
                updateEmployeeRole()
            }
            //Exit
            if (menuResponse.menuChoice === 'Exit') {
                exitDisplayMenu();
            }
        });
};

//Runs the initial inquirer function that will prompt the user with a list of choices
displayMenu();

// View Departments Function
// Basically console logging current departments
const viewDepartments = () =>
    db.query("select * from department", function (error, results) {
        if (error) throw error;
        console.table(results);
        displayMenu()
    })
// View Roles Function
// Basically console logging current roles
const viewRoles = () =>
    db.query("select * from role", function (error, results) {
        if (error) throw error;
        console.table(results);
        displayMenu()
    })
// View Employees Function
// Basically console logging current employees
const viewEmployees = () =>
    db.query("select * from employee", function (error, results) {
        if (error) throw error;
        console.table(results);
        displayMenu()
    })

// Add Department Function
// Uses inquirer to add a department
const addDepartment = () => {
    return inquirer
        .prompt([
            {
                type: 'input',
                name: 'departmentName',
                message: 'What is the name of the department?',
            },
        ])
        .then((menuResponse) => {
            menuResponse.departmentName
            const sql = `INSERT INTO department (name)
        VALUES (?)`;
            const params = [menuResponse.departmentName];
            db.query(sql, params, (err, result) => {
                if (err) {
                    console.log(err)
                    return;
                }
                console.log("Successfully added " + menuResponse.departmentName + " to departments")
                viewDepartments();
            });
        })
}

// Add Role Function
// Uses inquirer to add a role
const addRole = () => {
    return inquirer
        .prompt([
            {
                type: 'input',
                name: 'name',
                message: 'What is the name of the role?',
            },
            {
                type: 'input',
                name: 'salary',
                message: 'Please enter the salary amount:',
            },
            {
                type: 'input',
                name: 'department',
                message: 'What is the name of the department?',
            },
        ])
        .then((menuResponse) => {
            menuResponse.departmentName
            const sql = `INSERT INTO role (name)
        VALUES (?)`;
            const params = [menuResponse.departmentName];
            db.query(sql, params, (err, result) => {
                if (err) {
                    console.log(err)
                    return;
                }
                console.log("Successfully added " + menuResponse.name + " to roles")
                viewDepartments();
            });
        })
}
// Add Employee Function
// Uses inquirer to add an employee
const addEmployee = () => {
    return inquirer
        .prompt([
            {
                type: 'input',
                name: 'employeeFirstName',
                message: 'What is the first name of the employee',
            },
            {
                type: 'input',
                name: 'employeeLastName',
                message: 'What is the last name of the employee',
            },
            {
                type: 'input',
                name: 'employeeRole',
                message: 'What is the role of the employee',
            },
            {
                type: 'input',
                name: 'employeeManager',
                message: "What is the name of the employee's manager?",
            }
        ])
        .then((menuResponse) => {
            menuResponse.employeeName
            const sql = `
            INSERT INTO employee (first_name),
            INSERT INTO employee (last_name),
            INSERT INTO employee (role_id),
            INSERT INTO employee (manager_id),
        VALUES (?)`;
            const params = [menuResponse.employeeFirstName, menuResponse.employeeLastName, menuResponse.employeeRole, menuResponse.employeeManager];
            db.query(sql, params, (err, result) => {
                if (err) {
                    console.log(err)
                    return;
                }
                console.log("Successfully added " + menuResponse.employeeFirstName + menuResponse.employeeLastName + " to employees")
                viewEmployees();
            });
        })
}
// // Update Employee Role Function
// // Uses inquirer to update an employee role
const updateEmployeeRole = [
    //Select an employee
    //Function to select an employee
    {
        type: 'input',
        name: 'title',
        message: 'What is the new role of the employee? ',
    }
]
// Exit Function - Exits Application
const exitDisplayMenu = () => {
    console.log("Exiting App")
    process.exit()
}