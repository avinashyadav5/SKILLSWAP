const { Sequelize } = require("sequelize");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") }); // ✅ Force dotenv to load correct .env path

console.log("Loaded DATABASE_URL:", process.env.DATABASE_URL); // debug line

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing or undefined!");
  process.exit(1);
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: false,
});

sequelize.authenticate()
  .then(() => console.log("✅ Database connected successfully"))
  .catch((err) => console.error("❌ Database connection error:", err));

module.exports = sequelize;
