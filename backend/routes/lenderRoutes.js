const express = require("express");
const router = express.Router();

const Lender = require("../models/Lender");
const User = require("../models/User");


// ===============================
// ➕ REGISTER AS LENDER
// ===============================
router.post("/register", async (req, res) => {
  try {
    const { userId, businessName, phone, address } = req.body;

    // 🔥 VALIDATION
    if (!userId || !businessName || !phone) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    // 🔥 CHECK IF ALREADY EXISTS
    const existing = await Lender.findOne({ userId });

    if (existing) {
      return res.status(400).json({
        message: "User is already a lender",
      });
    }

    const lender = new Lender({
      userId,
      businessName,
      phone,
      address,
    });

    await lender.save();

    // Update user's isLender flag
    await User.findByIdAndUpdate(userId, { isLender: true });

    res.json({
      message: "Registered successfully",
      lender,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Server error",
    });
  }
});


// ===============================
// 🔍 CHECK IF USER IS LENDER
// ===============================
router.get("/check/:userId", async (req, res) => {
  try {
    const lender = await Lender.findOne({
      userId: req.params.userId,
    });

    res.json({
      isLender: !!lender,
    });

  } catch (err) {
    res.status(500).json({
      message: "Check failed",
    });
  }
});


// ===============================
// 📄 GET LENDER DETAILS
// ===============================
router.get("/:userId", async (req, res) => {
  try {
    const lender = await Lender.findOne({
      userId: req.params.userId,
    });

    if (!lender) {
      return res.status(404).json({
        message: "Lender not found",
      });
    }

    res.json(lender);

  } catch (err) {
    res.status(500).json({
      message: "Fetch error",
    });
  }
});


module.exports = router;