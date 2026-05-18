const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true
  },
  price: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pricing"
  },
  price_MRP: {
    type:String
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  },
  category_name: {
    type: String
  },
  rate: {
    type: String
  },
  createdBy: {
    type: String
  },
  updatedBy: {
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
  }
}, {timestamps: true});

module.exports = mongoose.model("Product", ProductSchema);
