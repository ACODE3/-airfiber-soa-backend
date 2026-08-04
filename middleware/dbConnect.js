const mongoose = require("mongoose");
const dns = require("dns");
mongoose.set("sanitizeFilter", true);

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const dbConnect = async () => {
  try {
    const connect = await mongoose.connect(
      process.env.MONGODB_URI,
      {
        serverSelectionTimeoutMS: 10000,
      }
    );

    console.log(
      `Database connected: ${connect.connection.host}, ${connect.connection.name}`
    );

    return connect;
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    throw err;
  }
};

module.exports = dbConnect;