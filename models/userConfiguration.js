import SequelizePackage from "sequelize";
const { Sequelize, DataTypes } = SequelizePackage;
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
  }
);

const UserConfiguration = sequelize.define(
  "UserConfiguration",
  {
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    selected_color: {
      type: DataTypes.STRING(7),
    },
    direction: {
      type: DataTypes.STRING(50),
    },
    speed: {
      type: DataTypes.INTEGER,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
  },
  {
    tableName: "users_configurations",
    timestamps: false,
  }
);

export default UserConfiguration;

await sequelize.sync({ alter: true });
