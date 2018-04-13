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

//  connect to db and display inventory
connection.connect(function (err) {
  if (err) throw err;
  managerOptions();
});

function managerOptions() {
  console.log("");
  inquirer.prompt([
    {
      type: "list",
      message: "Choose from the following Manager options:",
      choices: ["View Products for Sale", "View Low Inventory", "Add to Inventory", "Add New Product"],
      name: "MgrInv"
    }
  ])
    .then(function (response) {
      switch (response.MgrInv) {
        case "View Products for Sale":
          viewAllProducts();
          break;

        case "View Low Inventory":
          viewLowInventory();
          break;

        case "Add to Inventory":
          addInventory();
          break;

        case "Add New Product":
          checkNewDept();
          break;
      }
    });
}

function checkNewDept() {
  var query = "SELECT department_name FROM departments";
  connection.query(query, function (err, res) {
    if (err) throw err;
    var departments = ["Not listed"];
    for (let i = 0; i < res.length; i++) {
      const element = res[i];
      departments.unshift(element.department_name);
    }
    console.log("");
    inquirer.prompt([
      {
        type: "list",
        message: "What department will the new item belong to?",
        choices: departments,
        name: "NewDept"
      }
    ])
      .then(function (response) {
        if (response.NewDept === "Not listed") {
          console.log("\n--------------------------------------------".yellow);
          console.log("Have your supervisor add the new department\nname to the database before you add this item.".red);
          console.log("--------------------------------------------".yellow);

          newMgrAction();
        }
        else {
          addNewProduct(response.NewDept);
        }
      });
  });
}

function addNewProduct(dept) {
  console.log("");
  inquirer.prompt([
    {
      type: "input",
      message: "What is the name of the new item?",
      name: "NewItem"
    },
    {
      type: "input",
      message: "What is the price of the new item?",
      name: "NewPrice"
    },
    {
      type: "input",
      message: "How many would you like to add to inventory?",
      name: "NewQty"
    }
  ])
    .then(function (response) {
      var insert = "INSERT INTO products (product_name, department_name, price, stock_quantity) VALUES (?, ?, ?, ?)";
      connection.query(insert, [
        response.NewItem,
        dept,
        response.NewPrice,
        response.NewQty
      ], function (err, res) {
        if (err) throw err;
        console.log("\n--------------------".yellow);
        console.log("New product created.".cyan);
        console.log("--------------------".yellow);
        newMgrAction();
      });
    });
}

function addInventory() {
  console.log("");
  inquirer.prompt([
    {
      type: "input",
      message: "What is the Item ID?",
      name: "AddItem"
    },
    {
      type: "input",
      message: "How many would you like to add?",
      name: "AddQty"
    }
  ])
    .then(function (response) {
      var query = "SELECT stock_quantity FROM products WHERE item_id = ?";
      connection.query(query, response.AddItem, function (err, res) {
        if (err) throw err;

        if (res.length === 0) {
          console.log("\n----------------------------".yellow);
          console.log("That is not a valid item ID.".red);
          console.log("----------------------------".yellow);
          newMgrAction();
        }
        else {
          var currentQty = parseInt(res[0].stock_quantity);
          var addedQty = parseInt(response.AddQty);
          var update = "UPDATE products SET stock_quantity = ? WHERE item_id = ?";
          var newQty = currentQty + addedQty;

          connection.query(update, [newQty, response.AddItem], function (err, res) {
            if (err) throw err;
            console.log("\n------------------".yellow);
            console.log("Inventory updated.".cyan);
            console.log("------------------".yellow);
            newMgrAction();
          });
        }

      });
    });
}

function viewAllProducts() {
  connection.query("SELECT * FROM products", function (error, results) {
    if (error) throw error;

    var table = new Table({
      head: ["Item ID".bold, "Item Name".bold, "Price".bold, "Qty".bold],
      style: { head: ["green"] },
      colWidths: [10, 50, 12, 10],
      colAligns: ["center", null, "right", "center"],
      wordWrap: true
    });

    for (let i = 0; i < results.length; i++) {
      const element = results[i];
      table.push([
        element.item_id,
        element.product_name,
        `$${parseFloat(element.price).toFixed(2)}`,
        element.stock_quantity
      ]);
    }

    console.log(table.toString());
    newMgrAction();

  });
}

function viewLowInventory() {
  var query = "SELECT * FROM products WHERE stock_quantity < 5";
  connection.query(query, function (err, res) {
    if (err) throw err;
    if (res.length === 0) {
      console.log("\n--------------------------------------".yellow);
      console.log("All inventory is at acceptable levels.".cyan);
      console.log("--------------------------------------".yellow);
      newMgrAction();
    }
    else {
      var table = new Table({
        head: ["Item ID".bold, "Item Name".bold, "Price".bold, "Qty".bold],
        colWidths: [10, 50, 12, 10],
        colAligns: ["center", null, "right", "center"],
        wordWrap: true
      });

      for (let i = 0; i < res.length; i++) {
        const element = res[i];
        table.push([
          element.item_id,
          element.product_name,
          `$${parseFloat(element.price).toFixed(2)}`,
          `${element.stock_quantity}`.red
        ]);
      }

      console.log(table.toString());
      newMgrAction();

    }
  });
}

//  ask if they'd like to perform another action
function newMgrAction() {
  console.log("");
  inquirer.prompt([
    {
      type: "confirm",
      message: "Would you like to perform another action?",
      name: "MgrNext"
    }
  ])
    .then(function (response) {
      if (response.MgrNext === true) managerOptions();
      else connection.end();
    });
}