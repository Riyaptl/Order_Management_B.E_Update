const DistributorOrder = require("../models/DistributorOrder")
const User = require("../models/User")
const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");


// Create order
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
      contact
    } = req.body;

    if (req.user.role === "distributor") {
      distributor = req.user.username
      placedBy = req.user.username
      orderPlacedBy = req.user.username
    }

    // Basic required validation
    if (!distributor) {
      return res.status(400).json({ message: "Distributor is required" });
    }

    if (!products || Object.keys(products.toObject ? products.toObject() : products).length === 0) {
      return res.status(400).json({ message: "Products are required" });
    }

    if (distributor === "other" && (!address || !contact)) {
      return res.status(400).json({ message: "Address and Contact details are required" });
    }

    // get address if not passed from distributor
    if ((!address || !contact) && distributor !== "other") {
      const dist = await User.findOne({ username: distributor })
      if (!address) {
        address = dist.address
      }
      if (!contact) {
        contact = dist.contact
      }
    }

    // Calculate total if products exist
    let total = {}

    // Mapping of product keys to their respective total category
    const totalMapping = {
      "Regular 50g": ["Cranberry 50g", "Dryfruits 50g", "Peanuts 50g", "Mix seeds 50g", "Blueberry 50g", "Hazelnut 50g", "Orange 50g", "Berries Burst 50g"],
      "Coffee 50g": ["Classic Coffee 50g", "Dark Coffee 50g", "Intense Coffee 50g", "Toxic Coffee 50g"],
      "Regular 25g": ["Cranberry 25g", "Dryfruits 25g", "Peanuts 25g", "Mix seeds 25g", "Orange 25g", "Mint 25g", "Blueberry 25g", "Hazelnut 25g", "Berries Burst 25g"],
      "Coffee 25g": ["Classic Coffee 25g", "Dark Coffee 25g", "Intense Coffee 25g", "Toxic Coffee 25g"],
      "Gift box": ["Gift box"],
      "Hazelnut & Blueberries 55g": ["Hazelnut & Blueberries 55g"],
      "Roasted Almonds & Pink Salt 55g": ["Roasted Almonds & Pink Salt 55g"],
      "Kiwi & Pineapple 55g": ["Kiwi & Pineapple 55g"],
      "Ginger & Cinnamon 55g": ["Ginger & Cinnamon 55g"],
      "Pistachio & Black Raisin 55g": ["Pistachio & Black Raisin 55g"],
      "Dates & Raisin 55g": ["Dates & Raisin 55g"]
    };

    // Calculate total object
    total = {
      "Regular 50g": 0,
      "Coffee 50g": 0,
      "Regular 25g": 0,
      "Coffee 25g": 0,
      "Gift box": 0,
      "Hazelnut & Blueberries 55g": 0,
      "Roasted Almonds & Pink Salt 55g": 0,
      "Kiwi & Pineapple 55g": 0,
      "Ginger & Cinnamon 55g": 0,
      "Pistachio & Black Raisin 55g": 0,
      "Dates & Raisin 55g": 0
    };

    // Loop through each category and sum up matching product quantities
    for (const [category, keys] of Object.entries(totalMapping)) {
      keys.forEach((key) => {
        if (products && products[key]) {
          total[category] += products[key];
        }
      });
    }

    // Build order payload
    const orderData = {
      distributor,
      city,
      products,
      remarks,
      address,
      contact,
      total: total || {},
      gst: "5",
      createdBy: req.user.username,
      placedBy: placedBy || req.user.username,
      orderPlacedBy: orderPlacedBy,
      status: "pending",
      expected_delivery: expected_delivery || [],
      createdAt: new Date(),
    };

    await DistributorOrder.create(orderData);

    return res.status(201).json({
      message: "Distributor order created successfully",
    });

  } catch (error) {
    console.error("Create Distributor Order Error:", error);

    res.status(500).json(error.message);
  }
};

// Update status (multiple orders)
const updateDistributorOrder = async (req, res) => {
  try {
    const {
      ids, // ARRAY OF IDS
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

    const orders = await DistributorOrder.find({
      _id: { $in: ids },
      deleted: false
    });

    if (orders.length === 0) {
      return res.status(404).json({ message: "No distributor orders found" });
    }

    const totalMapping = {
      "Regular 50g": ["Cranberry 50g", "Dryfruits 50g", "Peanuts 50g", "Mix seeds 50g", "Blueberry 50g", "Hazelnut 50g", "Orange 50g", "Berries Burst 50g"],
      "Coffee 50g": ["Classic Coffee 50g", "Dark Coffee 50g", "Intense Coffee 50g", "Toxic Coffee 50g"],
      "Regular 25g": ["Cranberry 25g", "Dryfruits 25g", "Peanuts 25g", "Mix seeds 25g", "Orange 25g", "Mint 25g", "Blueberry 25g", "Hazelnut 25g", "Berries Burst 25g"],
      "Coffee 25g": ["Classic Coffee 25g", "Dark Coffee 25g", "Intense Coffee 25g", "Toxic Coffee 25g"],
      "Gift box": ["Gift box"],
      "Hazelnut & Blueberries 55g": ["Hazelnut & Blueberries 55g"],
      "Roasted Almonds & Pink Salt 55g": ["Roasted Almonds & Pink Salt 55g"],
      "Kiwi & Pineapple 55g": ["Kiwi & Pineapple 55g"],
      "Ginger & Cinnamon 55g": ["Ginger & Cinnamon 55g"],
      "Pistachio & Black Raisin 55g": ["Pistachio & Black Raisin 55g"],
      "Dates & Raisin 55g": ["Dates & Raisin 55g"]
    };

    for (const order of orders) {

      if (
        (status === "dispatched" || status === "partially dispatched") &&
        (!order.ETD || !Array.isArray(order.ETD) || (order.ETD.length === 0 && !ETD))
      ) {
        return res.status(400).json({
          message: "ETD is required for dispatch",
        });
      }

      if (status === "delivered" && (order.status !== "dispatched" && order.status !== "partially dispatched")) {
        return res.status(400).json({
          message: `Order ${order._id} must be dispatched before delivery`
        });
      }

      /* ---------- Delivered products & totals ---------- */
      if ((status === "dispatched" || status === "partially dispatched") && delivered_products) {
        const delivered_total = {};
        Object.keys(totalMapping).forEach(c => delivered_total[c] = 0);

        for (const [category, keys] of Object.entries(totalMapping)) {
          keys.forEach(key => {
            if (delivered_products[key]) {
              delivered_total[category] += delivered_products[key];
            }
          });
        }

        order.delivered = order.delivered || [];
        order.delivered.push({
          date: new Date(ETD),
          products: delivered_products,
          total: delivered_total,
          companyRemarks
        });
      }

      /* ---------- Status update ---------- */
      order.status = status;
      order.statusUpdatedBy = req.user.username;
      order.statusUpdatedAt = new Date();
      order.companyRemarks = companyRemarks || order.companyRemarks || "";
      if (order.status === "dispatched" || order.status === "partially dispatched") {
        if (!order.dispatchedAt) {
          order.dispatchedAt = []
        }
        order.dispatchedAt.push(Date.now())
      }

      if (canceledReason) {
        order.canceledReason = canceledReason;
      }

      if (ETD) {
        order.ETD.push(new Date(ETD));
      }

      if (status === "delivered") {
        if (!order.delivered_on) {
          order.delivered_on = []
        }
        order.delivered_on.push(Date.now())
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

    if (!id || !orderId || !ARN ) {
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

    // Base filter
    const query = {
      deleted: false
    };

    // Optional filters
    if (distributor) {
      query.distributor = distributor;
    }

    if (placedBy) {
      query.placedBy = placedBy;
    }

    if (dispatchedAt) {
      const start = new Date(dispatchedAt);
      start.setHours(0, 0, 0, 0);

      const end = new Date(dispatchedAt);
      end.setHours(23, 59, 59, 999);

      query.dispatchedAt = {
        $elemMatch: {
          $gte: start,
          $lte: end,
        },
      };
    }

    // filter on due date and unpaid
    if (dueDate) {
  const passedDate = new Date(dueDate);

  // normalize to end of day (VERY IMPORTANT)
  passedDate.setHours(23, 59, 59, 999);

  query.paymentStatus = { $nin: ["paid", "pending"] };

  query.$expr = {
    $and: [
      // valid dueOn
      { $ne: ["$dueOn", null] },
      { $ne: ["$dueOn", ""] },

      // overdue condition
      {
        $lt: [
          { $toDate: "$dueOn" },
          passedDate
        ]
      }
    ]
  };
}

    // if not admin, self orders only
    if (req.user.role !== "admin" && req.user.role !== "distributor") {
      query.placedBy = req.user.username;
    }

    if (req.user.role === "distributor") {
      query.distributor = req.user.username;
    }

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
    res.status(500).json(error.message);
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
  exportDistributorOrdersCSV
};
