const mongoose = require("mongoose");

const ordersSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },
  products: {
    type: Map,
    of: Number,
  },
  total:{
    type: Map,
    of: Number,
  },
  existing_products: {
    type: Map,
    of: Number,
  },
  rate:{
    type: Map,
    of: Number,
  },
  paymentTerms: {
    type: String,
    enum: ["cash", "cheque", "company credit", "sr credit", "distributor credit", ""]
  },
  placedBy: {
    type: String,
  },
  orderPlacedBy: {
    type: String
  },
  remarks: {
    type: String
  },
  createdAt: {
    type: Date,
  },
  type: {
    type: String,
    enum: ["order", "replacement", "return"],
    default: "order"
  },
  orderValue: {
    type: String
  }
}, { _id: false }); 

const ShopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  handler: {
    type: String,
  },
  address: {
    type: String,
  },
  contactNumber: {
    type: String,
  },
  addressLink: {
    type: String,
  },
  createdBy: {
    type: String,
    required: true,
  },
  updatedBy: {
    type: String,
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedBy: {
    type: String,
  },
  deletedAt: {
    type: Date,
  },
  prevArea: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Area",
  },
  area: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Area",
  },
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "City",
  },
  cityName: {
    type: String
  },
  prevAreaName: {
    type: String,
  },
  areaName: {
    type: String,
  },
  areaShiftedBy: {
    type: String,
  },
  areaShiftedAt: {
    type: Date,
  },
  blacklisted: {
    type: Boolean,
    defaulf: false
  },
  blacklistedAt: {
    type: Date,
  },
  blacklistedBy: {
    type: String,
  },
  visitedAt: {
    type: Date
  },
  first: {
    type: Boolean,
    default: false
  },
  repeat: {
    type: Boolean,
    default: false
  },
  orders: [ordersSchema],
  stock: {
    type: Map,
    of: Number,
  },
}, { timestamps: true });

module.exports = mongoose.model("Shop", ShopSchema);
