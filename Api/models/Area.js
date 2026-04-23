const mongoose = require("mongoose");

const AreaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  distributor: {
    type: String,
  },
  shops: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
  }],
  areas: [{
    type: String
  }],
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "City"
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
}, { timestamps: true });

module.exports = mongoose.model("Area", AreaSchema);
