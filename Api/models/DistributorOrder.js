const mongoose = require("mongoose");

const productList = [
  "Cranberry 50g", "Dryfruits 50g", "Peanuts 50g", "Mix seeds 50g", "Blueberry 50g", "Hazelnut 50g", "Orange 50g", "Berries Burst 50g",
  "Classic Coffee 50g", "Dark Coffee 50g", "Intense Coffee 50g", "Toxic Coffee 50g",
  "Cranberry 25g", "Dryfruits 25g", "Peanuts 25g", "Mix seeds 25g", "Blueberry 25g", "Hazelnut 25g", "Berries Burst 25g",
  "Orange 25g", "Mint 25g", "Classic Coffee 25g", "Dark Coffee 25g",
  "Intense Coffee 25g", "Toxic Coffee 25g", "Gift box", 
  "Hazelnut & Blueberries 55g", "Roasted Almonds & Pink Salt 55g", "Kiwi & Pineapple 55g", "Ginger & Cinnamon 55g", "Pistachio & Black Raisin 55g", "Dates & Raisin 55g"
];

const totalList = [
  "Regular 50g", "Coffee 50g", "Regular 25g", "Coffee 25g", "Gift box",
  "Hazelnut & Blueberries 55g", "Roasted Almonds & Pink Salt 55g", "Kiwi & Pineapple 55g", "Ginger & Cinnamon 55g", "Pistachio & Black Raisin 55g", "Dates & Raisin 55g"
];

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
    validate: {
      validator: function (value) {
        return [...value.keys()].every(key => productList.includes(key));
      },
      message: "One or more product names are invalid"
    }
  },
  total:{
    type: Map,
    of: Number,
    validate: {
      validator: function (value) {
        return [...value.keys()].every(key => totalList.includes(key));
      },
      message: "One or more total names are invalid"
    }
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
      validate: {
        validator: function(value) {
          return [...value.keys()].every(key => productList.includes(key));
        },
        message: "One or more product names are invalid"
      }
    },
    total: {
      type: Map,
      of: Number,
      validate: {
        validator: function(value) {
          return [...value.keys()].every(key => totalList.includes(key));
        },
        message: "One or more total names are invalid"
      }
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
  }
});
// { timestamps: true }

module.exports = mongoose.model("DistributorOrderSchema", distributorOrderSchema);
