const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    category: String,
    deposit: Number,

    // 🔥 MULTIPLE IMAGES
    images: [String],

    // 🔥 PRICING
    pricing: [
      {
        duration: String,
        price: Number,
      },
    ],

    userId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);