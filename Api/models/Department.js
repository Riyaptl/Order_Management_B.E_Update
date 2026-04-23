const mongoose = require("mongoose");

const DepartmentSchema = new mongoose.Schema({
 name: {
    type: String,
    required: true,
    unique: true
 },
 rank: {
    type: String,
    required: true
 },
 roles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role"
 }],
  createdBy: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Department", DepartmentSchema);
