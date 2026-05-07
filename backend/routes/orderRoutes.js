const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

const IST_OFFSET_MS = 330 * 60 * 1000; // IST = UTC + 05:30 (no DST)
const YMD_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const pad2 = (value) => String(value).padStart(2, "0");
const formatYmd = (year, month, day) => `${year}-${pad2(month)}-${pad2(day)}`;

const getDaysInMonth = (year, month1Based) =>
  new Date(Date.UTC(year, month1Based, 0)).getUTCDate();

const parseYmd = (ymd) => {
  if (!YMD_REGEX.test(ymd)) return null;
  const [year, month, day] = ymd.split("-").map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12) return null;
  const dim = getDaysInMonth(year, month);
  if (day < 1 || day > dim) return null;
  return { year, month, day };
};

const addDaysYmd = (ymd, daysToAdd) => {
  const parsed = parseYmd(ymd);
  if (!parsed) return null;
  const dateUtc = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  dateUtc.setUTCDate(dateUtc.getUTCDate() + Number(daysToAdd || 0));
  return formatYmd(dateUtc.getUTCFullYear(), dateUtc.getUTCMonth() + 1, dateUtc.getUTCDate());
};

const addMonthsYmd = (ymd, monthsToAdd) => {
  const parsed = parseYmd(ymd);
  if (!parsed) return null;

  const add = Number(monthsToAdd || 0);
  if (!Number.isFinite(add)) return null;

  let targetYear = parsed.year;
  let targetMonth = parsed.month + add; // 1-based

  while (targetMonth > 12) {
    targetMonth -= 12;
    targetYear += 1;
  }
  while (targetMonth < 1) {
    targetMonth += 12;
    targetYear -= 1;
  }

  const dim = getDaysInMonth(targetYear, targetMonth);
  const targetDay = Math.min(parsed.day, dim);

  return formatYmd(targetYear, targetMonth, targetDay);
};

const getTodayIstYmd = () => {
  const istNow = new Date(Date.now() + IST_OFFSET_MS);
  return formatYmd(istNow.getUTCFullYear(), istNow.getUTCMonth() + 1, istNow.getUTCDate());
};

const getTomorrowIstYmd = () => addDaysYmd(getTodayIstYmd(), 1);

const isValidDeliveryDate = (ymd) => {
  const parsed = parseYmd(ymd);
  if (!parsed) return false;
  const tomorrow = getTomorrowIstYmd();
  if (!tomorrow) return false;
  return ymd >= tomorrow;
};

const parseDurationLabel = (durationLabel) => {
  if (!durationLabel || typeof durationLabel !== "string") return null;
  const normalized = durationLabel.trim();
  if (!normalized) return null;

  const monthMatch = normalized.match(/(\d+)\s*(month|months|mo)\b/i);
  if (monthMatch) {
    const months = Number(monthMatch[1]);
    if (!Number.isInteger(months) || months <= 0) return null;
    return { unit: "month", value: months };
  }

  const dayMatch = normalized.match(/(\d+)\s*(day|days|d)\b/i);
  if (dayMatch) {
    const days = Number(dayMatch[1]);
    if (!Number.isInteger(days) || days <= 0) return null;
    return { unit: "day", value: days };
  }

  return null;
};

const addDurationYmd = (ymd, duration) => {
  if (!duration || !duration.unit || !duration.value) return null;
  return duration.unit === "day" ? addDaysYmd(ymd, duration.value) : addMonthsYmd(ymd, duration.value);
};

// =======================
// CREATE ORDER
// =======================
router.post("/create", async (req, res) => {
  try {
    const { userId, items, deliveryDate } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    if (!deliveryDate || !isValidDeliveryDate(deliveryDate)) {
      return res.status(400).json({ message: "Invalid deliveryDate" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items" });
    }

    const normalizedItems = items
      .map((item) => ({
        productId: item?.productId,
        quantity: Number(item?.quantity || 0),
        durationLabel: item?.basePlan?.durationLabel || "",
        unitPrice: Number(item?.basePlan?.unitPrice ?? item?.price ?? 0),
      }))
      .filter((item) => item.productId && item.quantity > 0);

    if (normalizedItems.length === 0) {
      return res.status(400).json({ message: "No valid items" });
    }

    const productIds = [...new Set(normalizedItems.map((i) => i.productId))];
    const products = await Product.find({ _id: { $in: productIds } });
    const productById = new Map(products.map((p) => [String(p._id), p]));

    const orderItems = [];
    let rentTotal = 0;
    let depositTotal = 0;
    let returnDate = "";

    for (const item of normalizedItems) {
      const product = productById.get(String(item.productId));
      if (!product) {
        return res.status(400).json({ message: "Invalid product in items" });
      }

      const duration = parseDurationLabel(item.durationLabel);
      if (!duration) {
        return res.status(400).json({ message: `Invalid plan: ${item.durationLabel}` });
      }

      const unitPrice = Number(item.unitPrice);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return res.status(400).json({ message: "Invalid unit price" });
      }

      const matchedPlan = (product.pricing || []).find(
        (p) =>
          String(p.duration).trim().toLowerCase() ===
            String(item.durationLabel).trim().toLowerCase() && Number(p.price) === unitPrice
      );

      if (!matchedPlan) {
        return res.status(400).json({ message: "Plan mismatch for product" });
      }

      const itemReturnDate = addDurationYmd(deliveryDate, duration);
      if (!itemReturnDate) {
        return res.status(400).json({ message: "Unable to compute returnDate" });
      }

      if (!returnDate || itemReturnDate > returnDate) {
        returnDate = itemReturnDate;
      }

      const itemRent = unitPrice * item.quantity;
      rentTotal += itemRent;

      const unitDeposit = Number(product.deposit || 0);
      depositTotal += unitDeposit * item.quantity;

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        basePlan: {
          durationLabel: String(item.durationLabel),
          unitPrice,
          durationUnit: duration.unit,
          durationValue: duration.value,
        },
        returnDate: itemReturnDate,
        extensions: [],
      });
    }

    const transport = Number.isFinite(Number(req.body.transport)) ? Number(req.body.transport) : 200;
    const platformCharge = Number.isFinite(Number(req.body.platformCharge)) ? Number(req.body.platformCharge) : 20;

    const wantsInsurance =
      Boolean(req.body.insuranceSelected) || (Number.isFinite(Number(req.body.insurance)) && Number(req.body.insurance) > 0);
    const insurance = wantsInsurance ? Math.round(rentTotal * 0.1) : 0;

    const grandTotal = rentTotal + depositTotal + transport + platformCharge + insurance;

    const order = new Order({
      userId,
      items: orderItems,
      rentTotal,
      depositTotal,
      transport,
      platformCharge,
      insurance,
      grandTotal,
      deliveryDate,
      returnDate,
      status: "Ongoing",
    });

    await order.save();
    await order.populate("items.productId");

    // Best-effort: clear cart after order success
    await Cart.updateOne({ userId: String(userId) }, { $set: { items: [] } });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Order error" });
  }
});

// =======================
// GET USER ORDERS
// =======================
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const orders = await Order.find({ userId }).populate("items.productId").sort({ createdAt: -1 });

    const todayIst = getTodayIstYmd();
    const updates = [];

    for (const order of orders) {
      if (order.status !== "Delivered" && order.deliveryDate && todayIst > order.deliveryDate) {
        order.status = "Delivered";
        order.deliveredAt = new Date();
        updates.push(order.save());
      }
    }

    if (updates.length) await Promise.allSettled(updates);

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Fetch orders failed" });
  }
});

// =======================
// EXTEND RENTAL (PER ITEM)
// =======================
router.post("/extend", async (req, res) => {
  try {
    const { orderId, itemId, selectedPlan } = req.body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid orderId" });
    }

    if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "Invalid itemId" });
    }

    const durationLabel = selectedPlan?.duration;
    const unitPrice = Number(selectedPlan?.price);

    if (!durationLabel || !Number.isFinite(unitPrice)) {
      return res.status(400).json({ message: "Invalid selectedPlan" });
    }

    const duration = parseDurationLabel(durationLabel);
    if (!duration) {
      return res.status(400).json({ message: "Invalid duration" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const item = order.items.id(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    const product = await Product.findById(item.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const matchedPlan = (product.pricing || []).find(
      (p) =>
        String(p.duration).trim().toLowerCase() === String(durationLabel).trim().toLowerCase() &&
        Number(p.price) === unitPrice
    );
    if (!matchedPlan) {
      return res.status(400).json({ message: "Plan mismatch for product" });
    }

    const prevReturnDate = item.returnDate;
    const newReturnDate = addDurationYmd(prevReturnDate, duration);
    if (!newReturnDate) {
      return res.status(400).json({ message: "Unable to compute returnDate" });
    }

    item.returnDate = newReturnDate;
    item.extensions.push({
      durationLabel: String(durationLabel),
      unitPrice,
      durationUnit: duration.unit,
      durationValue: duration.value,
      extendedAt: new Date(),
    });

    const prevRentTotal = Number(order.rentTotal || 0);
    const extraRent = unitPrice * Number(item.quantity || 0);
    const nextRentTotal = prevRentTotal + extraRent;

    const hadInsurance = Number(order.insurance || 0) > 0;
    const prevInsurance = Number(order.insurance || 0);
    const nextInsurance = hadInsurance ? Math.round(nextRentTotal * 0.1) : 0;

    order.rentTotal = nextRentTotal;
    order.insurance = nextInsurance;

    const transport = Number(order.transport || 0);
    const platformCharge = Number(order.platformCharge || 0);
    const depositTotal = Number(order.depositTotal || 0);

    order.grandTotal = nextRentTotal + depositTotal + transport + platformCharge + nextInsurance;

    // Update order-level returnDate to max of items
    const maxReturn = (order.items || []).reduce((max, it) => (it.returnDate && it.returnDate > max ? it.returnDate : max), "");
    order.returnDate = maxReturn || order.returnDate;

    await order.save();
    await order.populate("items.productId");

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Extend failed" });
  }
});

module.exports = router;
