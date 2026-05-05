const mongoose = require("mongoose");


const validMonths = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"];

const TargetReportSchema = new mongoose.Schema({
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
  targetAssigned: {
    type: Map,
    of: Number,
    validate: {
      validator: function (value) {
        return [...value.keys()].every(key => validMonths.includes(key));
      },
      message: "Invalid month key. Must be 01-11"
    },
    default: {}
  },
  selfTargetAchieved: {
    type: Map,
    of: Number,
    validate: {
      validator: function (value) {
        return [...value.keys()].every(key => validMonths.includes(key));
      },
      message: "Invalid month key. Must be 01-11"
    },
    default: {}
  },
  subTargetAchieved: {
    type: Map,
    of: Number,
    validate: {
      validator: function (value) {
        return [...value.keys()].every(key => validMonths.includes(key));
      },
      message: "Invalid month key. Must be 00-11"
    },
    default: {}
  },
  assignedBy: {
    type: String
  },
  assignedAt: {
    type: Date
  }
}, {timestamps: true});

module.exports = mongoose.model("TargetReport", TargetReportSchema);
