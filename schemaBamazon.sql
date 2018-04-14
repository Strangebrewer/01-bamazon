DROP DATABASE IF EXISTS bamazon;
CREATE database bamazon;

USE bamazon;

--  ===============================================================
--  products table

CREATE TABLE products (
  item_id INT NOT NULL AUTO_INCREMENT,
  product_name VARCHAR(200) NOT NULL,
  department_name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INT NOT NULL default 0,
  product_sales DECIMAL(10,2) NOT NULL default 0,
  PRIMARY KEY(item_id)
);

INSERT INTO products (product_name, department_name, price, stock_quantity)
VALUES ("Harness", "Climbing", 54.95, 4),
 ("9.6mm Dry Rope", "Climbing", 229.95, 12),
 ("ATC Belaying Device", "Climbing", 29.95, 15),
 ("Mad Hatter", "Wonderland", 505.05, 1),
 ("Cheshire Cat", "Wonderland", 66.66, 2),
 ("Drink Me - Potion", "Wonderland", 1.09, 99),
 ("Prometheus Rising", "Books", 22.00, 50),
 ("Self-Reliance", "Books", 18.00, 19),
 ("The Republic", "Books", 21.00, 49),
 ("Whatchu talkin bout, Willis?", "Quotes", 88.12, 39),
 ("A foolish consistency", "Quotes", 36.00, 37),
 ("I never said that", "Quotes", 9.00, 58);

--  ==============================================================

--  departments table

CREATE TABLE departments (
  department_id INT NOT NULL AUTO_INCREMENT,
  department_name VARCHAR(100) NOT NULL,
  over_head_costs DECIMAL(10,2) NOT NULL default 0,
  PRIMARY KEY (department_id)
);

INSERT INTO departments (department_name, over_head_costs)
VALUES ("Climbing", 400),
 ("Wonderland", 500),
 ("Books", 300),
 ("Quotes", 30)