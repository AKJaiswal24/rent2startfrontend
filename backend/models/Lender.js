const mongoose = require("mongoose");

const lenderSchema = new mongoose.Schema(
  {
    userId: String,
    businessName: String,
    phone: String,
    address: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lender", lenderSchema);