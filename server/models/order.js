const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  listingId:     { type: String, required: true },
  buyerId:       { type: String, required: true },
  qty:           { type: Number, required: true },
  total:         { type: Number, required: true },
  originalTotal: { type: Number, required: true },
  status:        { type: String, enum: ["pending","confirmed","rejected","collected"], default: "pending" },
}, { timestamps: true });

module.exports = mongoose.model("Order", OrderSchema);