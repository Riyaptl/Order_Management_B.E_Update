const DistributorOrder = require("../models/DistributorOrder")
const User = require("../models/User")
const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");

// Create order - Calculate order value on frontend
const createDistributorOrder = async (req, res) => {
  try {
    let {
      distributor,
      city,
      placedBy,
      products,
      expected_delivery,
      orderPlacedBy,
      remarks,
      address,
      contact,
      rates,
      orderValue
    } = req.body;

    if (req.user.dept_name === "Partners" && req.user.role_name !== "Distributors"){
      return res.status(400).json({ message: "Only distributor can place the order" });
    }

    // 🔹 If distributor is placing order themselves
    if (req.user.role_name === "Distributors") {
      distributor = req.user.username;
      placedBy = req.user.username;
      orderPlacedBy = req.user.username;
    }

    // 🔹 Basic validation
    if (!distributor) {
      return res.status(400).json({ message: "Distributor is required" });
    }
    
    if (!orderValue) {
      return res.status(400).json({ message: "Order value is required" });
    }

    if (!products || Object.keys(products).length === 0) {
      return res.status(400).json({ message: "Products are required" });
    }

    if (!rates || Object.keys(rates).length === 0) {
      return res.status(400).json({ message: "Rates are required" });
    }

    if (distributor === "other" && (!address || !contact)) {
      return res.status(400).json({ message: "Address and contact are required for other orders" });
    }

    // ============================================================
    // 🔹 PARALLEL DB CALLS
    // ============================================================

    const productKeys = Object.keys(products);
    const rateKeys = Object.keys(rates);

    const [productDocs, categoryDocs, distributorUser, reqUser] = await Promise.all([
      // Validate products
      Product.find({
        name: { $in: productKeys },
        deleted: { $in: [false, null] }
      }).select("name category_name price_MRP rate"),

      // Validate rate categories
      Category.find({
        name: { $in: rateKeys },
        deleted: { $in: [false, null] }
      }).select("name"),

      // Find distributor — single call for both access check and address/contact
      distributor !== "other"
        ? User.findOne({ username: distributor, dept_name: "Partners" })
          .select("companyPersonal address contact")
        : Promise.resolve(null),

      // Get logged in user's subordinates
      !["HR", "Admin"].includes(req.user.dept_name) && req.user.role_name !== "Distributor"
        ? User.findById(req.user._id).select("subordinates")
        : Promise.resolve(null)
    ]);

    // ============================================================
    // 🔹 PRODUCT VALIDATION
    // ============================================================

    if (productDocs.length !== productKeys.length) {
      const validNames = productDocs.map(p => p.name);
      const invalid = productKeys.filter(k => !validNames.includes(k));
      return res.status(400).json({ message: `Invalid products: ${invalid.join(", ")}` });
    }

    // 🔹 Check all products have price and rate
    const missingPriceOrRate = productDocs.filter(p => !p.price_MRP || !p.rate);
    if (missingPriceOrRate.length > 0) {
      return res.status(400).json({
        message: `Following products are missing price or rate: ${missingPriceOrRate.map(p => p.name).join(", ")}`
      });
    }

    // ============================================================
    // 🔹 RATES VALIDATION
    // ============================================================

    if (categoryDocs.length !== rateKeys.length) {
      const validNames = categoryDocs.map(c => c.name);
      const invalid = rateKeys.filter(k => !validNames.includes(k));
      return res.status(400).json({ message: `Invalid rate categories: ${invalid.join(", ")}` });
    }

    // ============================================================
    // 🔹 ACCESS CONTROL
    // ============================================================

    if (!["HR", "Admin"].includes(req.user.dept_name) && req.user.role_name !== "Distributor") {
      if (distributor !== "other") {
        if (!distributorUser) {
          return res.status(404).json({ message: "Distributor not found" });
        }

        const relevantUserIds = [req.user._id.toString(), ...reqUser.subordinates.map(s => s.toString())];
        const hasAccess = distributorUser.companyPersonal.some(cp =>
          relevantUserIds.includes(cp.toString())
        );

        if (!hasAccess) {
          return res.status(403).json({ message: "You do not have access to this distributor" });
        }
      }
    }

    // ============================================================
    // 🔹 TOTAL CALCULATION
    // ============================================================

    const total = {};
    productDocs.forEach(product => {
      if (product.category_name) {
        if (!total[product.category_name]) total[product.category_name] = 0;
        total[product.category_name] += products[product.name];
      }
    });

    // ============================================================
    // 🔹 GET ADDRESS AND CONTACT IF NOT PASSED
    // ============================================================

    if (distributor !== "other" && distributorUser) {
      if (!address) address = distributorUser.address;
      if (!contact) contact = distributorUser.contact;
    }

    // ============================================================
    // 🔹 CREATE ORDER
    // ============================================================

    await DistributorOrder.create({
      distributor,
      city,
      products,
      total,
      rates,
      remarks,
      address,
      contact,
      gst: "5",
      createdBy: req.user.username,
      placedBy: placedBy || req.user.username,
      orderPlacedBy: orderPlacedBy || req.user.username,
      status: "pending",
      expected_delivery: expected_delivery || [],
      createdAt: new Date(),
      orderValue
    });

    return res.status(201).json({ message: "Distributor order created successfully" });

  } catch (error) {
    console.error("Create Distributor Order Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update status (multiple orders)
const updateDistributorOrder = async (req, res) => {
  try {
    const {
      ids,
      status,
      canceledReason,
      ETD,
      delivered_products,
      same_as_products,
      companyRemarks,
    } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Order ids are required" });
    }

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    // ============================================================
    // 🔹 PARALLEL DB CALLS
    // ============================================================

    const [orders, productDocs] = await Promise.all([
      DistributorOrder.find({
        _id: { $in: ids },
        deleted: { $in: [false, null] }
      }),

      delivered_products && (status === "dispatched" || status === "partially dispatched")
        ? Product.find({
            name: { $in: Object.keys(delivered_products) },
            deleted: { $in: [false, null] }
          }).select("name category_name price_MRP rate")
        : Promise.resolve([])
    ]);

    if (orders.length === 0) {
      return res.status(404).json({ message: "No distributor orders found" });
    }

    // ============================================================
    // 🔹 DELIVERED PRODUCTS VALIDATION
    // ============================================================

    if (delivered_products && productDocs.length > 0) {
      const deliveredKeys = Object.keys(delivered_products);
      if (productDocs.length !== deliveredKeys.length) {
        const validNames = productDocs.map(p => p.name);
        const invalid = deliveredKeys.filter(k => !validNames.includes(k));
        return res.status(400).json({ message: `Invalid delivered products: ${invalid.join(", ")}` });
      }

      // 🔹 Check all products have price and rate
      const missingPriceOrRate = productDocs.filter(p => !p.price_MRP || !p.rate);
      if (missingPriceOrRate.length > 0) {
        return res.status(400).json({
          message: `Following products are missing price or rate: ${missingPriceOrRate.map(p => p.name).join(", ")}`
        });
      }
    }

    // ============================================================
    // 🔹 CALCULATE DELIVERED TOTAL AND ORDER VALUE FROM DB
    // ============================================================

    let delivered_total = null;
    let deliveredValue = 0;

    if (delivered_products && productDocs.length > 0) {
      delivered_total = {};

      productDocs.forEach(product => {
        const quantity = delivered_products[product.name];

        // 🔹 Calculate total
        if (product.category_name) {
          if (!delivered_total[product.category_name]) delivered_total[product.category_name] = 0;
          delivered_total[product.category_name] += quantity;
        }

        // 🔹 Calculate order value
        if (quantity && product.price_MRP && product.rate) {
          const MRP = Number(product.price_MRP);
          const rate = Number(product.rate);
          const valuePerUnit = (MRP - (MRP * rate / 100)) / 1.05;
          deliveredValue += valuePerUnit * quantity;
        }
      });

      deliveredValue = Math.round(deliveredValue * 100) / 100;
    }

    // ============================================================
    // 🔹 UPDATE ORDERS
    // ============================================================

    for (const order of orders) {

      if (
        (status === "dispatched" || status === "partially dispatched") &&
        (!order.ETD || !Array.isArray(order.ETD) || (order.ETD.length === 0 && !ETD))
      ) {
        return res.status(400).json({ message: "ETD is required for dispatch" });
      }

      if (status === "delivered" && (order.status !== "dispatched" && order.status !== "partially dispatched")) {
        return res.status(400).json({
          message: `Order ${order._id} must be dispatched before delivery`
        });
      }

      // 🔹 Push delivered entry
      if ((status === "dispatched" || status === "partially dispatched") && delivered_products && delivered_total) {
        order.delivered = order.delivered || [];
        order.delivered.push({
          date: new Date(ETD),
          products: delivered_products,
          total: delivered_total,
          companyRemarks
        });

        // 🔹 Accumulate finalOrderValue
        order.finalOrderValue = Math.round(((order.finalOrderValue || 0) + deliveredValue) * 100) / 100;
      }

      // 🔹 Status update
      order.status = status;
      order.statusUpdatedBy = req.user.username;
      order.statusUpdatedAt = new Date();
      order.companyRemarks = companyRemarks || order.companyRemarks || "";

      if (status === "dispatched" || status === "partially dispatched") {
        if (!order.dispatchedAt) order.dispatchedAt = [];
        order.dispatchedAt.push(new Date());
      }

      if (canceledReason) order.canceledReason = canceledReason;
      if (ETD) order.ETD.push(new Date(ETD));

      if (status === "delivered") {
        if (!order.delivered_on) order.delivered_on = [];
        order.delivered_on.push(new Date());
      }

      await order.save();
    }

    return res.status(200).json({
      message: `${orders.length} distributor orders updated successfully`
    });

  } catch (error) {
    console.error("Update Distributor Order Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update delivery details
const updateDeliveryDetails = async (req, res) => {
  try {
    const { id, orderId, ARN, billAttached = false, courier, boxes } = req.body;

    if (!id || !orderId || !ARN) {
      return res.status(400).json({
        message: "Missing required fields"
      });
    }

    const updateFields = {};

    updateFields["delivered.$.ARN"] = ARN;
    updateFields["delivered.$.billAttached"] = billAttached;
    updateFields["delivered.$.courier"] = courier || "";
    updateFields["delivered.$.boxes"] = boxes || "0";

    const order = await DistributorOrder.findOneAndUpdate(
      {
        _id: id,
        "delivered._id": orderId,
        deleted: false
      },
      {
        $set: updateFields
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        message: "Order or delivery entry not found"
      });
    }

    return res.status(200).json({
      message: "Delivery details updated successfully"
    });

  } catch (error) {
    console.error("Update Delivery Details Error:", error);
    res.status(500).json(error.message);
  }
};

// Read orders
const readDistributorOrders = async (req, res) => {
  try {
    const { distributor, placedBy, dispatchedAt, dueDate } = req.body;

    // 🔹 Base filter
    const query = {
      deleted: { $in: [false, null] }
    };

    // 🔹 Optional filters
    if (distributor) query.distributor = distributor;
    if (placedBy) query.placedBy = placedBy;

    if (dispatchedAt) {
      const start = new Date(dispatchedAt);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dispatchedAt);
      end.setHours(23, 59, 59, 999);
      query.dispatchedAt = {
        $elemMatch: { $gte: start, $lte: end }
      };
    }

    if (dueDate) {
      const passedDate = new Date(dueDate);
      passedDate.setHours(23, 59, 59, 999);

      query.paymentStatus = { $nin: ["paid", "pending"] };
      query.$expr = {
        $and: [
          { $ne: ["$dueOn", null] },
          { $ne: ["$dueOn", ""] },
          { $lt: [{ $toDate: "$dueOn" }, passedDate] }
        ]
      };
    }

    // ============================================================
    // 🔹 ACCESS CONTROL
    // ============================================================

    if (req.user.dept_name === "Partners" || req.user.role_name === "Distributor") {
      // 🔹 Partners — own orders only
      query.distributor = req.user.username;

    } else if (!["HR", "Admin"].includes(req.user.dept_name)) {
      // 🔹 Sales and other departments — partners associated to them or subordinates
      const reqUser = await User.findById(req.user._id).select("subordinates");
      const allUserIds = [req.user._id, ...reqUser.subordinates];

      // 🔹 Find all partners linked to logged in user or subordinates
      const linkedPartners = await User.find({
        companyPersonal: { $in: allUserIds },
        dept_name: "Partners"
      }).select("username");

      const linkedPartnerUsernames = linkedPartners.map(p => p.username);

      // 🔹 If distributor filter passed, check it's within accessible partners
      if (distributor && !linkedPartnerUsernames.includes(distributor)) {
        return res.status(403).json({ message: "You do not have access to this distributor's orders" });
      }

      query.distributor = distributor
        ? distributor
        : { $in: linkedPartnerUsernames };
    }

    // 🔹 HR and Admin — no restrictions, all filters apply as passed

    const orders = await DistributorOrder
      .find(query)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: orders.length,
      message: "Orders received successfully",
      orders
    });

  } catch (error) {
    console.error("Read Distributor Orders Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete order
const deleteDistributorOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await DistributorOrder.findOne({
      _id: id,
      deleted: false
    });

    if (!order) {
      return res.status(404).json({
        message: "Distributor order not found or already deleted"
      });
    }

    order.deleted = true;
    order.deletedBy = req.user.username;
    order.deletedAt = new Date();

    await order.save();

    return res.status(200).json({
      message: "Distributor order deleted successfully"
    });

  } catch (error) {
    console.error("Delete Distributor Order Error:", error);
    res.status(500).json(error.message);
  }
};

// payment status
const updatePaymentStatus = async (req, res) => {
  try {
    const { id, paymentStatus, paymentRemarks, invoiceNo, dueOn } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const updatedOrder = await DistributorOrder.findByIdAndUpdate(
      id,
      {
        $set: {
          paymentStatus,
          paymentRemarks,
          invoiceNo,
          dueOn,
          paymentStatusDate: new Date() // Sets current timestamp
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Distributor order not found" });
    }

    res.status(200).json({
      message: "Payment status updated successfully",
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// Read Order amount
// const getDistributorOrderSummary = async (req, res) => {
//   try {
//     const { distributor, month, dueDate } = req.query;

//     // 🔹 Base query
//     const query = {
//       deleted: { $in: [false, null] }
//     };

//     if (distributor) query.distributor = distributor;

//     // 🔹 Month filter — default to current month
//     const targetMonth = month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
//     const [year, mon] = targetMonth.split("-");
//     const startOfMonth = new Date(year, mon - 1, 1);
//     const endOfMonth = new Date(year, mon, 0, 23, 59, 59, 999);
//     query.createdAt = { $gte: startOfMonth, $lte: endOfMonth };

//     // 🔹 dueDate filter
//     if (dueDate) {
//       const passedDate = new Date(dueDate);
//       passedDate.setHours(23, 59, 59, 999);

//       query.paymentStatus = { $in: ["due", "informed"] };
//       query.$expr = {
//         $and: [
//           { $ne: ["$dueOn", null] },
//           { $ne: ["$dueOn", ""] },
//           { $lt: [{ $toDate: "$dueOn" }, passedDate] }
//         ]
//       };
//     }

//     // ============================================================
//     // 🔹 ACCESS CONTROL
//     // ============================================================

//     if (req.user.dept_name === "Partners" || req.user.role_name === "Distributor") {
//       query.distributor = req.user.username;
//     } else if (!["HR", "Admin"].includes(req.user.dept_name)) {
//       const reqUser = await User.findById(req.user._id).select("subordinates");
//       const allUserIds = [req.user._id, ...reqUser.subordinates];

//       const linkedPartners = await User.find({
//         companyPersonal: { $in: allUserIds },
//         dept_name: "Partners"
//       }).select("username");

//       const linkedPartnerUsernames = linkedPartners.map(p => p.username);

//       if (distributor && !linkedPartnerUsernames.includes(distributor)) {
//         return res.status(403).json({ message: "You do not have access to this distributor" });
//       }

//       query.distributor = distributor
//         ? distributor
//         : { $in: linkedPartnerUsernames };
//     }

//     // ============================================================
//     // 🔹 AGGREGATE
//     // ============================================================

//     const summary = await DistributorOrder.aggregate([
//       { $match: query },
//       {
//         $group: {
//           _id: null,
//           totalOrderValue: { $sum: { $toDouble: "$orderValue" } },
//           totalFinalOrderValue: { $sum: { $toDouble: "$finalOrderValue" } }
//         }
//       }
//     ]);

//     const result = summary[0] || { totalOrderValue: 0, totalFinalOrderValue: 0 };

//     return res.status(200).json({
//       totalOrderValue: Math.round(result.totalOrderValue * 100) / 100,
//       totalFinalOrderValue: Math.round(result.totalFinalOrderValue * 100) / 100
//     });

//   } catch (error) {
//     console.error("Get Distributor Order Summary Error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };
// Read Order amount
const getDistributorOrderSummary = async (req, res) => {
  try {
    const { month, dueDate } = req.query;

    // 🔹 Base query
    const query = {
      deleted: { $in: [false, null] }
    };

    // 🔹 Month filter — default to current month
    const targetMonth = month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    const [year, mon] = targetMonth.split("-");
    const startOfMonth = new Date(year, mon - 1, 1);
    const endOfMonth = new Date(year, mon, 0, 23, 59, 59, 999);
    query.createdAt = { $gte: startOfMonth, $lte: endOfMonth };

    // 🔹 dueDate filter
    if (dueDate) {
      const passedDate = new Date(dueDate);
      passedDate.setHours(23, 59, 59, 999);
      query.paymentStatus = { $in: ["due", "informed"] };
      query.$expr = {
        $and: [
          { $ne: ["$dueOn", null] },
          { $ne: ["$dueOn", ""] },
          { $lt: [{ $toDate: "$dueOn" }, passedDate] }
        ]
      };
    }

    // ============================================================
    // 🔹 ACCESS CONTROL
    // ============================================================

    if (!["HR", "Admin"].includes(req.user.dept_name)) {
      const reqUser = await User.findById(req.user._id).select("subordinates");
      const allUserIds = [req.user._id, ...reqUser.subordinates];

      const linkedPartners = await User.find({
        companyPersonal: { $in: allUserIds },
        dept_name: "Partners"
      }).select("username");

      const linkedPartnerUsernames = linkedPartners.map(p => p.username);
      query.distributor = { $in: linkedPartnerUsernames };
    }

    // ============================================================
    // 🔹 AGGREGATE — parallel calls
    // ============================================================

    const distributorPipeline = [
      { $match: query },
      {
        $group: {
          _id: "$distributor",
          totalOrderValue: { $sum: { $toDouble: "$orderValue" } },
          totalFinalOrderValue: { $sum: { $toDouble: "$finalOrderValue" } },
          totals: { $push: "$total" }
        }
      },
      {
        $addFields: {
          categoryQuantities: {
            $reduce: {
              input: { $concatArrays: { $map: { input: "$totals", as: "t", in: { $objectToArray: "$$t" } } } },
              initialValue: [],
              in: { $concatArrays: ["$$value", ["$$this"]] }
            }
          }
        }
      },
      {
        $addFields: {
          categoryQuantities: {
            $arrayToObject: {
              $map: {
                input: {
                  $reduce: {
                    input: "$categoryQuantities",
                    initialValue: [],
                    in: {
                      $let: {
                        vars: {
                          existing: {
                            $filter: {
                              input: "$$value",
                              as: "e",
                              cond: { $eq: ["$$e.k", "$$this.k"] }
                            }
                          }
                        },
                        in: {
                          $cond: [
                            { $gt: [{ $size: "$$existing" }, 0] },
                            {
                              $map: {
                                input: "$$value",
                                as: "v",
                                in: {
                                  $cond: [
                                    { $eq: ["$$v.k", "$$this.k"] },
                                    { k: "$$v.k", v: { $add: ["$$v.v", "$$this.v"] } },
                                    "$$v"
                                  ]
                                }
                              }
                            },
                            { $concatArrays: ["$$value", ["$$this"]] }
                          ]
                        }
                      }
                    }
                  }
                },
                as: "item",
                in: { k: "$$item.k", v: "$$item.v" }
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          distributor: "$_id",
          totalOrderValue: { $round: ["$totalOrderValue", 2] },
          totalFinalOrderValue: { $round: ["$totalFinalOrderValue", 2] },
          categoryQuantities: 1
        }
      },
      { $sort: { totalFinalOrderValue: -1 } }
    ];

    const overallPipeline = [
      { $match: query },
      {
        $group: {
          _id: null,
          overallOrderValue: { $sum: { $toDouble: "$orderValue" } },
          overallFinalOrderValue: { $sum: { $toDouble: "$finalOrderValue" } }
        }
      }
    ];

    const [summary, overall] = await Promise.all([
      DistributorOrder.aggregate(distributorPipeline),
      DistributorOrder.aggregate(overallPipeline)
    ]);

    const overallResult = overall[0] || { overallOrderValue: 0, overallFinalOrderValue: 0 };

    return res.status(200).json({
      month: targetMonth,
      overallOrderValue: Math.round(overallResult.overallOrderValue * 100) / 100,
      overallFinalOrderValue: Math.round(overallResult.overallFinalOrderValue * 100) / 100,
      distributors: summary
    });

  } catch (error) {
    console.error("Get Distributor Order Summary Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 12 months dist orders trend
const getDistributorOrderTrend = async (req, res) => {
  try {

    // ============================================================
    // 🔹 ACCESS CONTROL
    // ============================================================

    const query = { deleted: { $in: [false, null] } };

    if (!["HR", "Admin"].includes(req.user.dept_name)) {
      const reqUser = await User.findById(req.user._id).select("subordinates");
      const allUserIds = [req.user._id, ...reqUser.subordinates];

      const linkedPartners = await User.find({
        companyPersonal: { $in: allUserIds },
        dept_name: "Partners"
      }).select("username");

      const linkedPartnerUsernames = linkedPartners.map(p => p.username);
      query.distributor = { $in: linkedPartnerUsernames };
    }

    // ============================================================
    // 🔹 LAST 12 MONTHS DATE RANGE
    // ============================================================

    const now = new Date();
    const startOf12MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    query.createdAt = { $gte: startOf12MonthsAgo, $lte: endOfCurrentMonth };

    // ============================================================
    // 🔹 AGGREGATE — parallel calls
    // ============================================================

    const distributorPipeline = [
      { $match: query },
      {
        $group: {
          _id: "$distributor",
          totalOrderValue: { $sum: { $toDouble: "$orderValue" } },
          totalFinalOrderValue: { $sum: { $toDouble: "$finalOrderValue" } }
        }
      },
      {
        $project: {
          _id: 0,
          distributor: "$_id",
          totalOrderValue: { $round: ["$totalOrderValue", 2] },
          totalFinalOrderValue: { $round: ["$totalFinalOrderValue", 2] }
        }
      },
      { $sort: { totalFinalOrderValue: -1 } }
    ];

    const overallPipeline = [
      { $match: query },
      {
        $group: {
          _id: null,
          overallOrderValue: { $sum: { $toDouble: "$orderValue" } },
          overallFinalOrderValue: { $sum: { $toDouble: "$finalOrderValue" } }
        }
      }
    ];

    const [summary, overall] = await Promise.all([
      DistributorOrder.aggregate(distributorPipeline),
      DistributorOrder.aggregate(overallPipeline)
    ]);

    const overallResult = overall[0] || { overallOrderValue: 0, overallFinalOrderValue: 0 };

    return res.status(200).json({
      period: `${startOf12MonthsAgo.toISOString().slice(0, 7)} to ${now.toISOString().slice(0, 7)}`,
      overallOrderValue: Math.round(overallResult.overallOrderValue * 100) / 100,
      overallFinalOrderValue: Math.round(overallResult.overallFinalOrderValue * 100) / 100,
      distributors: summary
    });

  } catch (error) {
    console.error("Get Distributor Order Trend Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// CSV export
const exportDistributorOrdersCSV = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await DistributorOrder.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 40 });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=order_${order.distributor}.pdf`
    );

    doc.pipe(res);

    // Title
    doc.fontSize(18).text("Distributor Order", { align: "center" });
    doc.moveDown();

    // Helper function to add rows
    const addRow = (label, value) => {
      const startX = doc.x;
      const startY = doc.y;

      doc.fontSize(12).text(`${label}:     ${value}`);

      // Draw line below the text
      const lineY = doc.y + 2;

      doc
        .moveTo(startX, lineY)
        .lineTo(550, lineY) // adjust width if needed
        .stroke();

      doc.moveDown(0.5); // spacing after line
    };

    // Distributor
    addRow("Distributor:", order.distributor);
    doc.moveDown();

    // Products
    doc.fontSize(14).text("Products: ");
    doc.moveDown(0.5);

    if (order.products) {
      for (let [key, value] of order.products.entries()) {
        addRow(key, value);
      }
    }

    doc.moveDown();

    // Totals
    doc.fontSize(14).text("Totals:");
    doc.moveDown(0.5);

    if (order.total) {
      for (let [key, value] of order.total.entries()) {
        addRow(key, value);
      }
    }

    // Remarks
    doc.moveDown();
    addRow("Remarks:", order.remarks);

    doc.end();
  } catch (error) {
    res.status(500).json({ message: "Error generating PDF" });
  }
};


module.exports = {
  createDistributorOrder,
  updateDistributorOrder,
  readDistributorOrders,
  deleteDistributorOrder,
  updateDeliveryDetails,
  updatePaymentStatus,
  getDistributorOrderSummary,
  getDistributorOrderTrend,
  exportDistributorOrdersCSV
};
