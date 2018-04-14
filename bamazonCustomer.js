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

//  read the db and display the contents
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
      if (response.BuyBoolean === true) buyItem();
      else connection.end();
    })
}

//  Ask which item to buy and how many
function buyItem() {
  console.log("");
  inquirer.prompt([
    {
      type: "input",
      message: "What is the ID of the item you would like to purchase?",
      name: "SaleID"
    },
    {
      type: "input",
      message: "How many would you like to purchase?",
      name: "SaleQty"
    }
  ])
    .then(function (response) {
      getInventoryFromDb(response);
    });
}

//  Get inventory qty from the db
function getInventoryFromDb(response) {
  var query = "SELECT * FROM products WHERE ?";
  connection.query(query, { item_id: response.SaleID }, function (err, res) {
    if (err) throw err;
    if (res.length === 0) {
      console.log("\n----------------------------".yellow);
      console.log("That is not a valid item ID.".red);
      console.log("----------------------------".yellow);
      buyItem();
    }
    else {
      var stockQty = res[0].stock_quantity;

      if (stockQty > response.SaleQty) {
        purchaseUpdateInventory(response, stockQty);
        getPurchasePrice(response);
      }
      else {
        console.log("\n--------------------------------------------".yellow);
        console.log("Inventory too low to complete your purchase.".red);
        console.log("--------------------------------------------".yellow);
        buyAgain();
      }
    }
  });
}

//  subtract purchase qty from inventory qty and update inventory qty
function purchaseUpdateInventory(response, stockQty) {
  var update = "UPDATE products SET stock_quantity = ? WHERE item_id = ?";
  var newQty = stockQty - response.SaleQty;
  connection.query(update, [newQty, response.SaleID], function (err, res) {
    if (err) throw err;
  });
}

//  get item price from db and display total purchase price
function getPurchasePrice(response) {
  var queryCost = "SELECT * FROM products WHERE item_id = ?";
  connection.query(queryCost, response.SaleID, function (err, res) {
    if (err) throw err;
    var cost = parseFloat(res[0].price * response.SaleQty).toFixed(2);
    var salesTotal = parseFloat(res[0].product_sales + cost);
    console.log("\n----------------------".yellow);
    console.log(`Your cost is: $${cost}`.cyan);
    console.log("----------------------".yellow);
    purchaseUpdateSales(response, salesTotal);
    buyAgain();
  });
}

//  Update total sales in products table
function purchaseUpdateSales(response, salesTotal) {
  var updateSale = "UPDATE products SET product_sales = ? WHERE item_id = ?";
  connection.query(updateSale, [salesTotal, response.SaleID], function (err, res) {
    if (err) throw err;
  });
}

//  ask if they'd like to make another purchase
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
      if (response.NextPurchase === true) buyItem();
      else connection.end();
    })
}