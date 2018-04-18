var mysql = require("mysql");
var inquirer = require("inquirer");
var colors = require("colors");
var Table = require("cli-table2");

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "test",
  database: "bamazon"
});

connection.connect(function (err) {
  if (err) throw err;
  supervisorOptions();
});

function supervisorOptions() {
  console.log("");
  inquirer.prompt([
    {
      type: "list",
      message: "Choose from the following Supervisor options:",
      choices: ["View Product Sales by Department", "Create New Department"],
      name: "SuperOptions"
    }
  ])
    .then(function (response) {
      switch (response.SuperOptions) {
        case "View Product Sales by Department":
          viewSalesByDept();
          break;

        case "Create New Department":
          createNewDept();
          break;
      }
    });
}

function viewSalesByDept() {
  var query = "SELECT departments.department_id, departments.department_name, departments.over_head_costs, COALESCE(SUM(products.product_sales), 0) AS product_sales, COALESCE(SUM(products.product_sales), 0) - departments.over_head_costs AS total_profit FROM departments LEFT JOIN products ON products.department_name = departments.department_name GROUP BY department_id";
  connection.query(query, function (err, res) {
    if (err) throw err;
    var table = new Table({
      head: [
        "Dept ID".bold,
        "Department Name".bold,
        "Overhead".bold,
        "Sales".bold,
        "Total Profit".bold
      ],
      style: { head: ["blue"] },
      colWidths: [10, 30, 12, 12, 15],
      colAligns: ["center", null, "right", "right", "right"],
      wordWrap: true
    });

    for (let i = 0; i < res.length; i++) {
      const element = res[i];
      var profit;
      if (element.total_profit < 0) {
        profit = `$${parseFloat(element.total_profit).toFixed(2)}`.red;
      }
      else if (element.total_profit > 0 ) {
        profit = `$${parseFloat(element.total_profit).toFixed(2)}`.green;
      }
        table.push([
          element.department_id,
          element.department_name,
          `$${parseFloat(element.over_head_costs).toFixed(2)}`,
          `$${parseFloat(element.product_sales).toFixed(2)}`,
          profit
        ]);
    }

    console.log(table.toString());
    newSprAction();

  });
}

function createNewDept() {
  console.log("");
  inquirer.prompt([
    {
      type: "input",
      message: "What will be the name of the new department?",
      name: "NewDept"
    }
  ])
    .then(function (response) {
      var newDept = response.NewDept;
      var query = "SELECT DISTINCT department_name FROM departments WHERE department_name = ?";
      connection.query(query, [newDept], function (err, res) {
        if (err) throw err;
        if (res.length > 0) {
          console.log("\n-----------------------------------------------".yellow);
          console.log("That department already exists in the database.".red);
          console.log("-----------------------------------------------".yellow);
          newSprAction();
        }
        else {
          newDeptOverhead(newDept);
        }
      });
    });
}

function newDeptOverhead(str) {
  console.log("");
  inquirer.prompt([
    {
      type: "input",
      message: "What are the overhead costs for the new department?",
      name: "Overhead",
      validate: function (input) {
        if (isNaN(input)) return "You must enter a valid number."
        return true;
      }
    }
  ])
    .then(function (response) {
        insertNewDept(response.Overhead, str);
    });
}

function insertNewDept(str1, str2) {
  var insert = "INSERT INTO departments (department_name, over_head_costs) VALUES (?, ?)";
  connection.query(insert, [
    str2,
    str1
  ], function (err, res) {
    if (err) throw err;
    console.log("\n-----------------------".yellow);
    console.log("New department created.".cyan);
    console.log("-----------------------".yellow);
    newSprAction();
  });
}

function newSprAction() {
  console.log("");
  inquirer.prompt([
    {
      type: "confirm",
      message: "Would you like to perform another Supervisor action?",
      name: "SuperNext"
    }
  ])
    .then(function (response) {
      if (response.SuperNext === true) supervisorOptions();
      else connection.end();
    });
}