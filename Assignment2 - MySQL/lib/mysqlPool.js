const mysql = require("mysql2/promise");

const mysqlHost = process.env.MYSQL_HOST || 'localhost';
const mysqlPort = process.env.MYSQL_PORT || '3306';
const mysqlDB = process.env.MYSQL_DB;
const mysqlUser = process.env.MYSQL_USER;
const mysqlPassword = process.env.MYSQL_PASSWORD;

/* Create a pool of connections. Why?
 * Allows simultaneous queries, gives some resilience to dropped connections,
 * avoid overhead of repeatedly creating and closing new conections
*/
const maxMySQLConnections = 10;
const mysqlPool = mysql.createPool({
    connectionLimit: maxMySQLConnections,
    host: mysqlHost,
    port: mysqlPort,
    database: mysqlDB,
    user: mysqlUser,
    password: mysqlPassword
});

// Export pool to allow use in other files
module.exports = mysqlPool;