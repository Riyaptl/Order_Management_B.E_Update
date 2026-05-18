const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true
  },
  areaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Area",
    required: true
  },
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "City"
  },
  cityName: {
    type: String
  },
  placedBy: {
    type: String,
    required: true
  },
  products: {
    type: Map,
    of: Number,
  },
  total: {
    type: Map,
    of: Number,
  },
  existing_products: {
    type: Map,
    of: Number,
  },
  rate: {
    type: Map,
    of: Number,
  },
  gst: {
    type: String,
    default: "5",
    required: true,
  },
  location: {
    type: {
      latitude: Number,
      longitude: Number
    }
  },
  paymentTerms: {
    type: String,
    enum: ["cash", "cheque", "company credit", "sr credit", "distributor credit", ""]
  },
  remarks: {
    type: String
  },
  orderPlacedBy: {
    type: String
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedBy: {
    type: String
  },
  deletedAt: {
    type: Date
  },
  createdBy: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["order", "replacement", "return"],
    default: "order"
  },
  createdAt: {
    type: Date
  },
  orderValue: {
    type: String
  },
});
// { timestamps: true }

module.exports = mongoose.model("Order", orderSchema);
