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

const rate = ["25g", "50g", "55g", "gift"]


const ordersSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
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
  existing_products: {
    type: Map,
    of: Number,
    validate: {
      validator: function (value) {
        return [...value.keys()].every(key => productList.includes(key));
      },
      message: "One or more product names are invalid"
    }
  },
  rate:{
    type: Map,
    of: Number,
    validate: {
      validator: function (value) {
        return [...value.keys()].every(key => rate.includes(key));
      },
      message: "One or more rates are invalid"
    }
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
  survey: [{
    type: String
  }],

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
    validate: {
      validator: function (value) {
        return [...value.keys()].every(key => productList.includes(key));
      },
      message: "One or more product names are invalid"
    }
  },
}, { timestamps: true });

module.exports = mongoose.model("Shop", ShopSchema);
