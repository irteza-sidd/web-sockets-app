// import mysql from "mysql2/promise";
// import dotenv from "dotenv";

// dotenv.config();

// const db = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });

// const testConnection = async () => {
//   try {
//     const [rows] = await db.query("SELECT 1");
//     console.log("Database connection successful!");
//   } catch (error) {
//     console.error("Database connection failed:", error);
//   }
// };

// testConnection();

// export default db;
