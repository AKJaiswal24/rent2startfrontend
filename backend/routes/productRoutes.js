const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// ADD PRODUCT
router.post("/add", async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      deposit,
      pricing,
      images,
      userId,
    } = req.body;

    // 🔥 VALIDATION
    if (!name || !category || !userId) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    if (!images || images.length < 3) {
      return res.status(400).json({
        message: "At least 3 images required",
      });
    }

    const product = new Product({
      name,
      description,
      category,
      deposit,
      pricing,
      images,
      userId,
    });

    await product.save();

    res.json({ message: "Product added", product });

  } catch (err) {
    res.status(500).json({ message: "Error adding product" });
  }
});

// GET ALL
router.get("/", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// GET ONE
router.get("/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  res.json(product);
});

// DELETE ONE
router.delete("/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

// UPDATE ONE
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, ...updateData } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.userId.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });
    res.json({ message: "Product updated", product: updatedProduct });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating product" });
  }
});

// GET ALL BY LENDER ID
router.get("/lender/:userId", async (req, res) => {
  try {
    const products = await Product.find({
      userId: req.params.userId,
    });

    res.json(products);

  } catch (err) {
    res.status(500).json({ message: "Error fetching products" });
  }
});

router.get("/lender/:userId", async (req, res) => {
  try {
    const products = await Product.find({
      userId: req.params.userId,
    });

    res.json(products);

  } catch (err) {
    res.status(500).json({ message: "Error fetching products" });
  }
});

module.exports = router;
