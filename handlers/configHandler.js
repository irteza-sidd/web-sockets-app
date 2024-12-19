import mysql from "mysql2/promise";

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "yourpassword",
  database: "yourdatabase",
};

export const updateUserConfigInDB = async (userId, config) => {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const fields = Object.keys(config)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(config), userId];

    const query = `
            UPDATE user_configuration
            SET ${fields}, updated_at = NOW()
            WHERE user_id = ?;
        `;
    await connection.execute(query, values);
    console.log(`Configuration updated in DB for user ${userId}:`, config);
  } catch (error) {
    throw new Error(`Database update failed: ${error.message}`);
  } finally {
    await connection.end();
  }
};
