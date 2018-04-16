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
  readProducts();
});

function readProducts() {
  connection.query("SELECT * FROM products", function (error, results) {
    if (error) throw error;

    var table = new Table({
      head: ["Item ID".bold, "Item Name".bold, "Price".bold],
      style: { head: ["green"] },
      colWidths: [10, 50, 12],
      colAligns: ["center", null, "right"],
      wordWrap: true
    });

    for (let i = 0; i < results.length; i++) {
      const element = results[i];
      table.push([
        element.item_id,
        element.product_name,
        `$${parseFloat(element.price).toFixed(2)}`
      ]);
    }

    console.log(table.toString());
    queryPurchase();
  });
}

function queryPurchase() {
  console.log("");
  inquirer.prompt([
    {
      type: "confirm",
      message: "Would you like to make a purchase?",
      name: "BuyBoolean"
    }
  ])
    .then(function (response) {
      if (response.BuyBoolean === true) makePurchase();
      else connection.end();
    })
}

function makePurchase() {
  console.log("");
  inquirer.prompt([
    {
      type: "input",
      message: "What is the ID of the item you would like to purchase?",
      name: "SaleID",
      validate: function (input) {
        var done = this.async();
        var query = "SELECT * FROM products WHERE ?";
        connection.query(query, { item_id: input }, function (err, res) {
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
      message: "How many would you like to purchase?",
      name: "SaleQty",
      validate: function (input) {
        if (isNaN(input) || input < 0) return "You must enter a valid number."
        return true;
      }
    }
  ])
    .then(function (response) {
      checkInventory(response.SaleID, response.SaleQty)
    });
}

function checkInventory(saleId, saleQty) {
  var query = "SELECT * FROM products WHERE ?";
  connection.query(query, { item_id: saleId }, function (err, res) {
    if (err) throw err;
    var inventory = res[0].stock_quantity;
    if (inventory >= saleQty) {
      updateInventory(saleId, saleQty, inventory);
      getPrice(saleId, saleQty);
    }
    else {
      console.log("\n--------------------------------------------".yellow);
      console.log("Inventory too low to complete your purchase.".red);
      console.log("--------------------------------------------".yellow);
      buyAgain();
    }
  });
}

function updateInventory(saleId, saleQty, inventory) {
  var update = "UPDATE products SET stock_quantity = ? WHERE item_id = ?";
  var newQty = inventory - saleQty;
  connection.query(update, [newQty, saleId], function (err, res) {
    if (err) throw err;
  });
}

function getPrice(saleId, saleQty) {
  var queryCost = "SELECT * FROM products WHERE item_id = ?";
  connection.query(queryCost, saleId, function (err, res) {
    if (err) throw err;
    var cost = parseFloat(res[0].price * saleQty).toFixed(2);
    var salesTotal = parseFloat(res[0].product_sales + cost);
    console.log("\n----------------------".yellow);
    console.log(`Your cost is: $${cost}`.cyan);
    console.log("----------------------".yellow);
    updateSalesDb(saleId, salesTotal);
    buyAgain();
  });
}

function updateSalesDb(saleId, salesTotal) {
  var updateSale = "UPDATE products SET product_sales = ? WHERE item_id = ?";
  connection.query(updateSale, [salesTotal, saleId], function (err, res) {
    if (err) throw err;
  });
}

function buyAgain() {
  console.log("");
  inquirer.prompt([
    {
      type: "confirm",
      message: "Would you like to make another selection?",
      name: "NextPurchase"
    }
  ])
    .then(function (response) {
      if (response.NextPurchase === true) makePurchase();
      else connection.end();
    })
}