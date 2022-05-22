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
