const mongoose = require("mongoose");

const PricingSchema = new mongoose.Schema({
  MRP: {
    type: String,
    unique: true,
    required: true,
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  }],
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

module.exports = mongoose.model("Pricing", PricingSchema);
