require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mysql = require("mysql2/promise");

async function check() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "lowcode",
  });

  try {
    const [rows] = await connection.query("SHOW TABLES");
    console.log("Tables in database:", JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error("Error checking tables:", error);
  } finally {
    await connection.end();
  }
}

check();
