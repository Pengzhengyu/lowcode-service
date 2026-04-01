require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mysql = require("mysql2/promise");

async function check() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
  });

  try {
    const [rows] = await connection.query("SELECT VERSION() as version");
    console.log("MySQL Version:", rows[0].version);
  } catch (error) {
    console.error("Error checking version:", error);
  } finally {
    await connection.end();
  }
}

check();
