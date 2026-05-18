const mongoose = require("mongoose");

const distributorOrderSchema = new mongoose.Schema({
  distributor: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  placedBy: {
    type: String,
    required: true
  },
  products: {
    type: Map,
    of: Number,
  },
  total:{
    type: Map,
    of: Number,
  },
  rates: {
    type: Map,
    of: Number
  },
  delivered: [
  {
     _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true   
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    products: {
      type: Map,
      of: Number,
    },
    total: {
      type: Map,
      of: Number,
    },
    billAttached: {
      type: Boolean,
      default: false
    },
    companyRemarks: {
      type: String
    },
    ARN: {
      type: String
    },
    courier: {
      type: String
    },
    boxes: {
      type: String
    }
  }
],
  gst: {
    type: String,
    default: "5",
    required: true,
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
  status: {
    type: String,
    enum: ["pending", "preparing", "dispatched", "delivered",  "canceled", "partially dispatched"],
    default: "pending"
  },
  dispatchedAt: [{
    type: Date
  }],
  expected_delivery: [{
    type: Date
  }],
  delivered_on: [{
    type: Date
  }],
  ETD: [{
    type: Date
  }],
  statusUpdatedBy: {
    type: String,
  },
  statusUpdatedAt: {
    type: Date,
  },
  canceledReason: {
    type: String,
  },
  createdAt: {
    type: Date
  },
  remarks: {
    type: String
  },
  companyRemarks: {
    type: String
  },
  address: {
    type: String
  },
  contact: {
    type: String
  },
  paymentStatus: {
    type: String,
    enum: ["posted", "paid", "due", "informed", "pending", "partially paid"],
    default: "pending"
  },
  paymentRemarks: {
    type: String
  },
  paymentStatusDate: {
    type: Date
  },
  invoiceNo: {
    type: String
  },
  dueOn: {
    type: String,
    default: ""
  },
  orderValue: {
    type: String
  },
  finalOrderValue: {
    type: String
  }
});
// { timestamps: true }

module.exports = mongoose.model("DistributorOrder", distributorOrderSchema);
