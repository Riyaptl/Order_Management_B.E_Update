const mongoose = require("mongoose");

const WorkingReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  username: {
    type: String
  },
  year: {
    type: String
  },
  month: {
    type: String
  },
  performance: {
    type: Map,
    of: new mongoose.Schema({
      Tc: { type: Number, default: 0 },
      PC: { type: Number, default: 0 }
    }, { _id: false }),
    default: {}
  },
}, {timestamps: true});

module.exports = mongoose.model("WorkingReport", WorkingReportSchema);
