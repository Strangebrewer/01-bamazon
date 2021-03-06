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
    console.log("");
    inquirer.prompt([
      {
        type: "list",
        message: "What department will the new item belong to?",
        choices: function () {
          let departmentsArray = ["Not listed"];
          for (let i = 0; i < res.length; i++) {
            departmentsArray.unshift(res[i].department_name);
          }
          return departmentsArray;
        },
        name: "NewDept"
      }
    ])
      .then(function (response) {
        if (response.NewDept === "Not listed") {
          console.log("\n--------------------------------------------".yellow);
          console.log("Have your supervisor add the new department\n  name to the database before you add this item.".red);
          console.log("--------------------------------------------".yellow);
          newMgrAction();
        }
        else {
          addProductName(response.NewDept);
        }
      });
  });
}

function addProductName(str) {
  console.log("");
  inquirer.prompt([
    {
      type: "input",
      message: "What is the name of the new item?",
      name: "NewItem"
    }
  ])
    .then(function (response) {
      var itemName = response.NewItem;
      var query = "SELECT product_name FROM products WHERE product_name =?";
      connection.query(query, itemName, function (err, res) {
        if (err) throw err;
        if (res.length > 0) {
          console.log("\n-----------------------------------------".yellow);
          console.log("That item already exists in the database.".red);
          console.log("-----------------------------------------".yellow);
          newMgrAction();
        }
        else {
          addProductData(itemName, str);
        }
      });
    });
}

function addProductData(str1, str2) {
  console.log("");
  inquirer.prompt([
    {
      type: "input",
      message: "What is the price of the new item?",
      name: "NewPrice",
      validate: function (input) {
        if (isNaN(input)) return "You must enter a valid number";
        return true;
      },
    },
    {
      type: "input",
      message: "How many would you like to add to inventory?",
      name: "NewQty",
      validate: function (input) {
        if (isNaN(input)) return "You must enter a valid number";
        return true;
      }
    }
  ])
    .then(function (response) {
      insertNewItem(response.NewQty, response.NewPrice, str1, str2);
    });
}

function insertNewItem(str1, str2, str3, str4) {
  var insert = "INSERT INTO products (product_name, department_name, price, stock_quantity) VALUES (?, ?, ?, ?)";
  connection.query(insert, [
    str3,
    str4,
    str2,
    str1
  ], function (err, res) {
    if (err) throw err;
    console.log("\n--------------------".yellow);
    console.log("New product created.".cyan);
    console.log("--------------------".yellow);
    newMgrAction();
  });
}

function addInventory() {
  console.log("");
  inquirer.prompt([
    {
      type: "input",
      message: "What is the Item ID?",
      name: "AddItem",
      validate: function (input) {
        var done = this.async();
        var query = "SELECT stock_quantity FROM products WHERE item_id = ?";
        connection.query(query, input, function (err, res) {
          if (err) throw err;
          if (res.length === 0) {
            done("That is not a valid item ID.");
            return;
          }
          done(null, true);
        });
      }
    },
    {
      type: "input",
      message: "How many would you like to add?",
      name: "AddQty",
      validate: function (input) {
        if (isNaN(input) || input < 0) return "You must enter a valid number."
        return true;
      }
    }
  ])
    .then(function (response) {
      var query = "SELECT stock_quantity FROM products WHERE item_id = ?"
      connection.query(query, response.AddItem, function (err, res) {
        if (err) throw err;
        var currentQty = parseInt(res[0].stock_quantity);
        var newQty = currentQty + response.AddQty;
        var update = "UPDATE products SET stock_quantity = ? WHERE item_id = ?";
        connection.query(update, [newQty, response.AddItem], function (err, res) {
          if (err) throw err;
          console.log("\n------------------".yellow);
          console.log("Inventory updated.".cyan);
          console.log("------------------".yellow);
          newMgrAction();
        });
      })
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