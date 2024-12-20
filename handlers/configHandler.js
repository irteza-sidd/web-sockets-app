import UserConfiguration from "../models/userConfiguration.js";

export const updateUserConfigInDB = async (customer_id, config) => {
  try {
    const [record, created] = await UserConfiguration.upsert(
      { customer_id, ...config, updated_at: new Date() },
      { returning: true }
    );

    console.log(
      created
        ? `New configuration created for user ${customer_id}: ${JSON.stringify(
            config
          )}`
        : `Configuration updated for user ${customer_id}: ${JSON.stringify(
            config
          )}`
    );

    return record;
  } catch (error) {
    console.error("Error updating or creating configuration:", error);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};
