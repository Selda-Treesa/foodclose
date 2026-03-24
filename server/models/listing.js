const mongoose = require("mongoose");

const ListingSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  qty:           { type: Number, required: true },
  unit:          { type: String, default: "portions" },
  originalPrice: { type: Number, required: true },
  salePrice:     { type: Number, required: true },
  description:   { type: String, default: "" },
  category:      { type: String, default: "Meals" },
  city:          { type: String, default: "" },
  address:       { type: String, default: "" },
  pickupFrom:    { type: Date },
  pickupUntil:   { type: Date },
  sellerId:      { type: String, required: true },
  status:        { type: String, enum: ["active", "inactive"], default: "active" },
}, { timestamps: true });

module.exports = mongoose.model("Listing", ListingSchema);