const inquirer = require('inquirer')
const mysql = require('mysql2')
// const consoleTable = require('console.table')

// Connect to database-----------------------------------------------------------------------------
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
//-------------------------------------------------------------------------------------------------
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

// View Departments Function-----------------------------------------------------------------------
// Basically console logging current departments
const viewDepartments = () =>
    db.query("select * from department", function (error, results) {
        if (error) throw error;
        console.table(results);
        displayMenu()
    })
// View Roles Function-----------------------------------------------------------------------------
// Basically console logging current roles
const viewRoles = () =>
    db.query("select * from role", function (error, results) {
        if (error) throw error;
        console.table(results);
        displayMenu()
    })
// View Employees Function-------------------------------------------------------------------------
// Basically console logging current employees
const viewEmployees = () =>
    db.query("select first_name, last_name, role_id from employee", function (error, results) {
        if (error) throw error;
        console.table(results);
        displayMenu()
    })

// Add Department Function ------------------------------------------------------------------------
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

// Add Role Function-------------------------------------------------------------------------------
// Uses inquirer to add a role
const addRole = () => {
    db.query("select * from department", function (error, results) {
        console.log(results)
        const departments = results
        return inquirer
            .prompt([
                {
                    type: 'input',
                    name: 'title',
                    message: 'What is the name of the role?',
                },
                {
                    type: 'input',
                    name: 'salary',
                    message: 'Please enter the salary amount:',
                },
                {
                    type: 'list',
                    name: 'department',
                    message: 'What is the name of the department?',
                    choices: departments.map(department => department.name)
                }
            ])
            .then((menuResponse) => {
                const [filteredDepartment] = departments.filter(department => department.name === menuResponse.department)
                const departmentId = filteredDepartment.id
                // flesh our INSERT INTO statment
                const sql = `INSERT INTO role (title)
        VALUES (?)`;
                const params = [menuResponse.department];
                db.query(sql, params, (err, result) => {
                    if (err) {
                        console.log(err)
                        return;
                    }
                    console.log("Successfully added " + menuResponse.title + " to roles")
                    viewDepartments();
                });
            })
    })
}
// Add Employee Function---------------------------------------------------------------------------
// Uses inquirer to add an employee
const addEmployee = () => {
    // query the roles 
    db.query("select * from role", function (error, results){
        console.log(results)
        const roles = results
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
                    // choices of the list will be an array of current roles
                    type: 'list',
                    name: 'employeeRole',
                    message: 'What is the role of the employee',
                    choices: roles.map(role => role.title)
                },
                // {
                //     type: 'list',
                //     name: 'employeeManager',
                //     message: "What is the name of the employee's manager?",
                //     choices: employee.map(employee => employee.id)
                // }
            ])
            .then((menuResponse) => {
                const [filteredRole] = roles.filter(role => role.title === menuResponse.employeeRole)
                const employeeRoleId = filteredRole.id
                console.log(employeeRoleId);

                const sql = `INSERT INTO employee (first_name,last_name,role_id) VALUES (?,?,?)`;
                const params = [menuResponse.employeeFirstName, menuResponse.employeeLastName, employeeRoleId];
                db.query(sql, params, (err, result) => {
                    if (err) {
                        console.log(err)
                        return;
                    }
                    console.log("Successfully added " + menuResponse.employeeFirstName + menuResponse.employeeLastName + " to employees")
                    viewEmployees();
                });
            })
    })
    //create a variable for employee managers

}
// // Update Employee Role Function----------------------------------------------------------------
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
// Exit Function - Exits Application---------------------------------------------------------------
const exitDisplayMenu = () => {
    console.log("Exiting App")
    process.exit()
}