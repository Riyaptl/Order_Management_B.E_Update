const mongoose = require("mongoose");

const CitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  areas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Area",
  }],
  createdBy: {
    type: String,
    required: true,
  },
  updatedBy: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model("City", CitySchema);
