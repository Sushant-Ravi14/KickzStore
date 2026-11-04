const mongoose = require("mongoose");
const config = require("./env");

async function connect() {
  if (config.NODE_ENV === "test") {
    return;
  }
  try {
    await mongoose.connect(config.MONGO_URI, { dbName: config.DBNAME });
    console.log(`Connected to database ${config.DBNAME} successfully!`);
  } catch (error) {
    console.error(`Database connection failed:`, error);
    process.exit(1);
  }
}

module.exports = connect;
