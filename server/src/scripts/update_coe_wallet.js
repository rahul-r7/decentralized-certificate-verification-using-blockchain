const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/certificate_verification_db";

mongoose.connect(MONGODB_URI).then(async () => {
  await mongoose.connection.collection("users").updateOne(
    { email: "registrar@nit.ac.in" },
    { $set: { walletAddress: "0x5bf84ee8e9d4ef8087616461a775dd27a2bd934a" } }
  );
  const u = await mongoose.connection.collection("users").findOne({ email: "registrar@nit.ac.in" });
  console.log("Registrar wallet updated to:", u.walletAddress);
  await mongoose.disconnect();
});
