-- to get department_id and department_name from the departments table:
SELECT department_id, department_name FROM bamazon.departments;

-- to get total product_sales for each department from the products table:
SELECT department_name, SUM(product_sales) FROM bamazon.products GROUP BY department_name;

-- to get sales by department for supervisor:
SELECT departments.department_id, departments.department_name, departments.over_head_costs, SUM(products.product_sales) AS product_sales, SUM(products.product_sales) - departments.over_head_costs AS total_profit FROM departments JOIN products ON products.department_name=departments.department_name /* OR departments.department_name is NOT NULL */ GROUP BY department_id;

--  remove 'bamazon.' to make this work since it's already connecting to that database...

--  checking for duplicates
SELECT DISTINCT department_name FROM departments WHERE department_name = ?;