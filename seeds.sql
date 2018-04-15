-- to get department_id and department_name from the departments table:
SELECT department_id, department_name FROM bamazon.departments;

-- to get total product_sales for each department from the products table:
SELECT department_name, SUM(product_sales) FROM bamazon.products GROUP BY department_name;

-- to get sales by department for supervisor:
SELECT bamazon.departments.department_id, bamazon.departments.department_name, bamazon.departments.over_head_costs,
 SUM(bamazon.products.product_sales) AS product_sales,
 SUM(bamazon.products.product_sales) - bamazon.departments.over_head_costs AS total_profit
 FROM bamazon.departments JOIN bamazon.products ON
 bamazon.products.department_name=bamazon.departments.department_name GROUP BY department_id;

--  remove 'bamazon.' to make this work since it's already connecting to that database...

--  checking for duplicates
SELECT DISTINCT department_name FROM departments WHERE department_name = ?;