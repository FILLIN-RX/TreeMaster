const mysql = require("mysql2");

const pool = mysql.createPool({
  host: "localhost",
  user: "factgenuser",
  password: "mdpsecret",
  database: "TreeMaster", // Assurez-vous que le nom de la base de données est correct
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise();
