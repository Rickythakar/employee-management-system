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
                    'View all Roles',
                    'View all departments',
                    'View all employees', 
                    'Add a department',
                    'Add a role',
                    'Add an employee',
                    'Update an employee role',
                    'Exit']
            }])
        .then((menuResponse) => {
            const choices = displayMenu.choices;
            //View Roles
            if (choices === 'View all Roles'){
                viewRoles()
            }
            //View Departments
            if (choices === 'View all departments'){
                viewDepartments()
            }
            //View Employees
            if (choices === 'View all employees'){
                viewEmployees()
            }
            //Add Department
            if (choices === 'Add a department'){
                addDepartment()
            }
            //Add Employee
            if (choices === 'Add an employee'){
                addEmployee()
            }
            //Update an employee role
            if (choices === 'Update an employee role'){
                updateEmployeeRole()
            }
            //Exit
            if (choices === 'Exit')
            exitDisplayMenu()
        });
};
//Runs the initial inquirer function that will prompt the user with a list of choices
displayMenu();


// View Roles Function
// Basically console logging current roles
// const viewRoles = 



// View Departments Function
// Basically console logging current departments
// const viewDepartments =



// View Employees Function
// Basically console logging current employees
// const viewEmployees =



// Add Department Function
// const addDepartment =
// Use inquirer to add a department

// Add Employee Function
// Uses inquirer to add an employee
// const addEmployee = 



// Update Employee Role Function
// Uses inquirer to update an employee role
// const updateEmployeeRole = 



// Exit Function
// const exit = 