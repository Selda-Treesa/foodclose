const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { seedData } = require("./seed");

const app = express();
app.use(cors());
app.use(express.json());

// ─── Models ───────────────────────────────────────────────────────────────
const User    = require("./models/user");
const Listing = require("./models/listing");
const Order   = require("./models/order");

// ─── Users ────────────────────────────────────────────────────────────────
app.get("/api/users", async (_req, res) => {
  const users = await User.find({}, { password: 0 }).lean();
  res.json(users);
});

app.post("/api/users/register", async (req, res) => {
  try {
    const { name, email, password, role, city, avatar } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ error: "Missing required fields" });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ error: "Email already registered" });
    const user = await User.create({ name, email, password, role, city: city || "", avatar: avatar || "" });
    const obj = user.toObject();
    delete obj.password;
    res.status(201).json(obj);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).lean();
    if (!user || user.password !== password)
      return res.status(401).json({ error: "Invalid email or password" });
    const { password: _pw, ...safe } = user;
    res.json(safe);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Listings ─────────────────────────────────────────────────────────────
app.get("/api/listings", async (_req, res) => {
  res.json(await Listing.find().lean());
});

app.post("/api/listings", async (req, res) => {
  try {
    const { name, qty, unit, originalPrice, salePrice, description, category,
            city, address, pickupFrom, pickupUntil, sellerId, status } = req.body;
    if (!name || !qty || !originalPrice || !salePrice || !sellerId)
      return res.status(400).json({ error: "Missing required fields" });
    const listing = await Listing.create({
      name, qty: Number(qty), unit: unit || "portions",
      originalPrice: Number(originalPrice), salePrice: Number(salePrice),
      description: description || "", category: category || "Meals",
      city: city || "", address: address || "",
      pickupFrom: pickupFrom ? new Date(pickupFrom) : null,
      pickupUntil: pickupUntil ? new Date(pickupUntil) : null,
      sellerId, status: status || "active",
    });
    res.status(201).json(listing.toObject());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/listings/:id", async (req, res) => {
  try {
    const fields = ["name","qty","unit","originalPrice","salePrice","description",
                    "category","city","address","pickupFrom","pickupUntil","status"];
    const update = {};
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        if (["qty","originalPrice","salePrice"].includes(f)) update[f] = Number(req.body[f]);
        else if (["pickupFrom","pickupUntil"].includes(f))   update[f] = new Date(req.body[f]);
        else update[f] = req.body[f];
      }
    }
    const listing = await Listing.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
    if (!listing) return res.status(404).json({ error: "Not found" });
    res.json(listing);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/listings/:id", async (req, res) => {
  await Listing.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// ─── Orders ───────────────────────────────────────────────────────────────
app.get("/api/orders", async (_req, res) => {
  res.json(await Order.find().lean());
});

app.post("/api/orders", async (req, res) => {
  try {
    const { listingId, buyerId, qty, total, originalTotal } = req.body;
    if (!listingId || !buyerId || !qty || total === undefined || originalTotal === undefined)
      return res.status(400).json({ error: "Missing required fields" });
    const order = await Order.create({
      listingId, buyerId,
      qty: Number(qty), total: Number(total), originalTotal: Number(originalTotal),
      status: "pending",
    });
    res.status(201).json(order.toObject());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch("/api/orders/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "confirmed", "rejected", "collected"];
    if (!allowed.includes(status))
      return res.status(400).json({ error: "Invalid status" });
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true }).lean();
    if (!order) return res.status(404).json({ error: "Not found" });
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/foodclose";
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB");
    await seedData();
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => { console.error("❌ MongoDB error:", err); process.exit(1); });