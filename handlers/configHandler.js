import db from "../config/database.js";

export const updateConfigInDB = async (tableName, conditions, updates) => {
  try {
    const updateFields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");

    const conditionFields = Object.keys(conditions)
      .map((key) => `${key} = ?`)
      .join(" AND ");

    const query = `
      UPDATE ${tableName}
      SET ${updateFields}, updated_at = NOW()
      WHERE ${conditionFields}
    `;

    const values = [...Object.values(updates), ...Object.values(conditions)];

    const [result] = await db.query(query, values);

    if (result.affectedRows > 0) {
      console.log(`Updated ${result.changedRows} row(s) in ${tableName}`);
      return { success: true, affectedRows: result.changedRows };
    } else {
      console.log(`No rows were updated in ${tableName}`);
      return { success: false, message: "No changes were made" };
    }
  } catch (error) {
    console.error("Error executing raw query:", error);
    throw new Error(`Failed to update ${tableName}: ${error.message}`);
  }
};
