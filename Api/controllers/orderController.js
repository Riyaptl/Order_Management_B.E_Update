// controllers/orderController.js
const Order = require("../models/Order");
const Area = require("../models/Area");
const Shop = require("../models/Shop");
const User = require("../models/User");
const { Parser } = require("json2csv");
const City = require("../models/City");
const { checkCityAccess } = require("./areaController");

// Validate products and category
const validateOrderFields = async (products, total, existing_products, rate) => {

  // 🔹 Fetch valid product names from DB — for products and existing_products
  const productMaps = [products, existing_products].filter(Boolean);
  if (productMaps.some(m => m && m.size > 0)) {
    const allProductKeys = [...new Set(
      productMaps.flatMap(m => m && m.size > 0 ? [...m.keys()] : [])
    )];

    const validProducts = await Product.find({
      name: { $in: allProductKeys },
      deleted: { $in: [false, null] }
    }).select("name");
    const validProductNames = validProducts.map(p => p.name);

    for (let key of allProductKeys) {
      if (!validProductNames.includes(key)) {
        throw { status: 400, message: `Invalid product: ${key}` };
      }
    }
  }

  // 🔹 Fetch valid category names from DB — for total and rate
  const categoryMaps = [total, rate].filter(Boolean);
  if (categoryMaps.some(m => m && m.size > 0)) {
    const allCategoryKeys = [...new Set(
      categoryMaps.flatMap(m => m && m.size > 0 ? [...m.keys()] : [])
    )];

    const validCategories = await Category.find({
      name: { $in: allCategoryKeys },
      deleted: { $in: [false, null] }
    }).select("name");
    const validCategoryNames = validCategories.map(c => c.name);

    for (let key of allCategoryKeys) {
      if (!validCategoryNames.includes(key)) {
        throw { status: 400, message: `Invalid category: ${key}` };
      }
    }
  }
};

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

// Helper - update reports upon order creation
const updateReports = async (username, userId, orderValue, hasProducts, date, type) => {
  const orderDate = date ? new Date(date) : new Date();

  const year = String(orderDate.getFullYear());
  const month = String(orderDate.getMonth()).padStart(2, "0");
  const day = String(orderDate.getDate()).padStart(2, "0");

  // ============================================================
  // 🔹 TARGET REPORT — update selfTargetAchieved based on type
  // ============================================================

  if (orderValue && type !== "replacement") {
    const increment = type === "return"
      ? -Number(orderValue)
      : Number(orderValue); // order

    await TargetReport.findOneAndUpdate(
      { username, year },
      {
        $inc: { [`selfTargetAchieved.${month}`]: increment },
        $setOnInsert: { user: userId, username, year }
      },
      { upsert: true }
    );
  }

  // ============================================================
  // 🔹 WORKING REPORT — update Tc and PC
  // ============================================================

  const performanceUpdate = {
    $inc: { [`performance.${day}.Tc`]: 1 },
    $setOnInsert: { user: userId, username, year, month }
  };

  if (hasProducts) {
    performanceUpdate.$inc[`performance.${day}.PC`] = 1;
  }

  await WorkingReport.findOneAndUpdate(
    { username, year, month },
    performanceUpdate,
    { upsert: true }
  );
};

// create order
const createOrder = async (req, res) => {
  try {
    let {
      shopId,
      areaId,
      products,
      existing_products,
      rate,
      placedBy,
      location,
      paymentTerms,
      remarks,
      orderPlacedBy,
      type = "order",
      date,
      orderValue
    } = req.body;

    // 🔹 Required fields
    if (!shopId || !areaId || !orderPlacedBy || !rate || !orderValue) {
      return res.status(400).json({ message: "shopId, areaId, orderPlacedBy, order value and rate are required" });
    }

    const createdBy = req.user.username;
    const finalPlacedBy = placedBy || createdBy;

    // ============================================================
    // 🔹 PARALLEL DB CALLS
    // ============================================================

    const productKeys = products ? Object.keys(products) : [];

    const [areaExists, shopExists, productDocs] = await Promise.all([
      Area.findOne({ _id: areaId, deleted: { $in: [false, null] } }),
      Shop.findOne({ _id: shopId, deleted: { $in: [false, null] } }),
      productKeys.length > 0
        ? Product.find({
          name: { $in: productKeys },
          deleted: { $in: [false, null] }
        }).select("name category_name price_MRP rate")
        : Promise.resolve([])
    ]);

    if (!areaExists) return res.status(404).json({ message: "Area not found" });
    if (!shopExists) return res.status(404).json({ message: "Shop not found" });

    // ============================================================
    // 🔹 PRODUCTS VALIDATION
    // ============================================================

    if (productKeys.length > 0) {
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
    } else {
      // 🔹 No products — location required
      if (!location) return res.status(400).json({ message: "Location is required when no products are ordered" });
    }

    // ============================================================
    // 🔹 UPDATE AREA lastActivityAt
    // ============================================================

    areaExists.lastActivityAt = new Date();
    await areaExists.save();

    // ============================================================
    // 🔹 UPDATE SHOP
    // ============================================================

    if (productKeys.length > 0) {
      const shopData = {
        placedBy: finalPlacedBy,
        products,
        total,
        existing_products,
        rate,
        paymentTerms,
        remarks,
        orderPlacedBy,
        createdAt: date,
        orderId: null, // will update after order creation
        type,
        orderValue
      };

      if (!shopExists.orders) shopExists.orders = [];
      shopExists.orders.push(shopData);

      // 🔹 Readjust stock
      if (!shopExists.stock) shopExists.stock = new Map();
      shopExists.stock = new Map(Object.entries(existing_products || {}));

      if (type === "order") {
        for (const [product, qty] of Object.entries(products || {})) {
          const current = shopExists.stock.get(product) || 0;
          shopExists.stock.set(product, current + qty);
        }
      } else if (type === "return") {
        for (const [product, qty] of Object.entries(products || {})) {
          const current = shopExists.stock.get(product) || 0;
          shopExists.stock.set(product, Math.max(0, current - qty));
        }
      }
    }

    shopExists.visitedAt = date;

    if (type === "order" && !location) {
      if (shopExists.first) {
        shopExists.repeat = true;
        shopExists.first = false;
      } else if (!shopExists.first && !shopExists.repeat) {
        shopExists.first = true;
      }
    }

    // ============================================================
    // 🔹 CREATE ORDER
    // ============================================================

    const order = await Order.create({
      shopId,
      areaId,
      city: areaExists.city,
      cityName: areaExists.city_name,
      placedBy: finalPlacedBy,
      products,
      total,
      existing_products,
      rate,
      orderValue,
      createdBy,
      location,
      paymentTerms,
      remarks,
      orderPlacedBy,
      type,
      gst: "5",
      createdAt: date || new Date(),
      orderValue
    });

    // 🔹 Update orderId in shop's last order entry
    if (productKeys.length > 0 && shopExists.orders.length > 0) {
      shopExists.orders[shopExists.orders.length - 1].orderId = order._id;
    }

    await shopExists.save();

    // ============================================================
    // 🔹 Update Reports
    // ============================================================

    const hasProducts = productKeys.length > 0;
    await updateReports(
      finalPlacedBy,
      null, // userId not available here unless fetched
      orderValue,
      hasProducts,
      date,
      type
    );

    res.status(201).json({ message: "Order created successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Read orders
const getOrders = async (req, res) => {
  try {
    const {
      city,
      area,
      salesPerson,
      date,
      completeData,
      month,
      year,
      placedOrders,
      type,
      page = 1,
      limit = 60
    } = req.body;

    // ============================================================
    // 🔹 VALIDATION
    // ============================================================

    // 🔹 Area or salesPerson requires city
    if ((area || salesPerson) && !city) {
      return res.status(400).json({ message: "City is required when filtering by area or sales person" });
    }

    // 🔹 Only one date filter at a time
    const dateFilters = [date, completeData, (month && year)].filter(Boolean);
    if (dateFilters.length > 1) {
      return res.status(400).json({ message: "Only one date filter can be applied at a time" });
    }

    // ============================================================
    // 🔹 Initialize QUERY
    // ============================================================

    const query = { deleted: { $in: [false, null] } };


    // ============================================================
    // 🔹 ACCESS CONTROL
    // ============================================================

    if (!["HR", "Admin"].includes(req.user.dept_name)) {
      if (city) {
        await checkCityAccess(req.user, city);
      }

      // 🔹 Sales person must be in subordinates
      if (salesPerson) {
        const reqUser = await User.findById(req.user._id).select("subordinates");
        const isSubordinate = reqUser.subordinates.map(s => s.toString()).includes(salesPerson);
        if (!isSubordinate && req.user.username !== salesPerson) {
          return res.status(403).json({ message: "You do not have access to this sales person's orders" });
        }
      } else {
        // 🔹 No salesPerson passed — always show logged in user's orders
        query.placedBy = req.user.username;
      }
    }

    // ============================================================
    // 🔹 BUILD QUERY
    // ============================================================

    // 🔹 City filter — get areas in city
    if (city) {
      if (area) {
        query.areaId = area;
      } else {
        const cityDoc = await City.findById(city).select("areas");
        if (!cityDoc) return res.status(404).json({ message: "City not found" });
        query.areaId = { $in: cityDoc.areas };
      }
    }

    // 🔹 Sales person filter
    if (salesPerson) {
      query.placedBy = salesPerson;
    }

    // 🔹 Type filter
    if (type) {
      query.type = type;
    }

    // 🔹 Products filter
    if (placedOrders === true) {
      query.products = { $ne: {} };
    } else if (placedOrders === false) {
      query.products = {};
    }

    // ============================================================
    // 🔹 DATE FILTER
    // ============================================================

    const istOffsetMs = 5.5 * 60 * 60 * 1000;

    if (date) {
      // 🔹 Specific date
      const [y, m, d] = date.split("-").map(Number);
      query.createdAt = {
        $gte: new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - istOffsetMs),
        $lte: new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999) - istOffsetMs)
      };
    } else if (completeData) {
      // 🔹 Whole current month
      const now = new Date();
      query.createdAt = {
        $gte: new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0) - istOffsetMs),
        $lte: new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999) - istOffsetMs)
      };
    } else if (month && year) {
      // 🔹 Previous month
      const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
      query.createdAt = {
        $gte: new Date(year, monthIndex, 1, 0, 0, 0, 0),
        $lte: new Date(year, monthIndex + 1, 0, 23, 59, 59, 999)
      };
    } else {
      // 🔹 Default — orders placed today
      const now = new Date();
      query.createdAt = {
        $gte: new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0) - istOffsetMs),
        $lte: new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999) - istOffsetMs)
      };
    }

    // ============================================================
    // 🔹 PAGINATED QUERY
    // ============================================================

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 60;
    const skip = (pageNum - 1) * limitNum;

    const [orders, totalOrders] = await Promise.all([
      Order.find(query)
        .populate("shopId", "name address contactNumber addressLink areaName repeat first blacklisted")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(query)
    ]);

    res.status(200).json({
      orders,
      currentPage: pageNum,
      totalPages: Math.ceil(totalOrders / limitNum),
      totalCount: totalOrders
    });

  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
};

// Delete Order 
const adjustShopStockAfterOrderRemoval = async (shop, removedOrderId) => {

  // Filter out the removed/canceled order
  const remainingOrders = shop.orders
    .filter(o => o.orderId.toString() !== removedOrderId.toString())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Take the latest order (if any)
  const latestOrder = remainingOrders[0];

  // Reset stock map
  shop.stock = new Map();

  if (latestOrder) {
    // Assign stock to latest order's existing_products
    if (latestOrder.existing_products) {
      for (const [product, qty] of latestOrder.existing_products.entries()) {
        shop.stock.set(product, qty);
      }
    }

    // Then adjust stock based on type
    if (latestOrder.type === "order") {
      for (const [product, qty] of latestOrder.products.entries()) {
        const current = shop.stock.get(product) || 0;
        shop.stock.set(product, current + qty);
      }
    } else if (latestOrder.type === "return") {
      for (const [product, qty] of latestOrder.products.entries()) {
        const current = shop.stock.get(product) || 0;
        shop.stock.set(product, Math.max(0, current - qty));
      }
    }
  }

  return shop;
};

const softDeleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔹 Find order
    const order = await Order.findOne({ _id: id, deleted: { $in: [false, null] } });
    if (!order) return res.status(404).json({ message: "Order not found or already deleted" });

    // 🔹 Soft delete order
    order.deleted = true;
    order.deletedBy = req.user.username;
    order.deletedAt = new Date();
    await order.save();

    // 🔹 Find shop
    const shop = await Shop.findById(order.shopId);
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    // 🔹 Remove from shop orders history
    shop.orders = shop.orders.filter(
      o => o.orderId.toString() !== order._id.toString()
    );

    // 🔹 Recalculate first/repeat based on remaining orders
    const ordersCnt = await Order.countDocuments({
      deleted: { $in: [false, null] },
      location: { $exists: false },
      type: "order",
      shopId: shop._id
    });

    if (ordersCnt === 0) {
      shop.first = false;
      shop.repeat = false;
    } else if (ordersCnt === 1) {
      shop.first = true;
      shop.repeat = false;
    }

    // 🔹 Readjust stock
    await adjustShopStockAfterOrderRemoval(shop, order._id);
    await shop.save();

    res.status(200).json({ message: "Order deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Sales report
const getSalesReport = async (req, res) => {
  try {
    const { date, month, year, city, userId } = req.body;

    // 🔹 Only one date filter at a time
    if (date && month) {
      return res.status(400).json({ message: "Only one date filter can be applied at a time" });
    }

    // ============================================================
    // 🔹 BUILD MATCH QUERY
    // ============================================================

    const match = {
      deleted: { $in: [false, null] },
      products: { $ne: {} }
    };

    // 🔹 Access control
    if (!["HR", "Admin"].includes(req.user.dept_name)) {
      if (userId) {
        // 🔹 Find user to get username and check access
        const targetUser = await User.findById(userId).select("username");
        if (!targetUser) {
          return res.status(404).json({ message: "User not found" });
        }

        const reqUser = await User.findById(req.user._id).select("subordinates");
        const isInSubordinates = reqUser.subordinates.map(s => s.toString()).includes(userId.toString());
        if (!isInSubordinates && userId.toString() !== req.user._id.toString()) {
          return res.status(403).json({ message: "You do not have access to this user" });
        }
        match.placedBy = targetUser.username;
      } else {
        match.placedBy = req.user.username;
      }

      // 🔹 City access check — add here
      if (city) {
        await checkCityAccess(req.user, city);
      }

    }

    // 🔹 userId filter for HR/Admin
    if (["HR", "Admin"].includes(req.user.dept_name) && userId) {
      const targetUser = await User.findById(userId).select("username");
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      match.placedBy = targetUser.username;
    }

    // 🔹 City filter
    if (city) {
      match.city = new mongoose.Types.ObjectId(city);
    }

    // ============================================================
    // 🔹 DATE FILTER
    // ============================================================

    const istOffsetMs = 5.5 * 60 * 60 * 1000;

    if (date) {
      const [y, m, d] = date.split("-").map(Number);
      match.createdAt = {
        $gte: new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - istOffsetMs),
        $lte: new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999) - istOffsetMs)
      };
    } else if (month && year) {
      const monthIndex = Number(month);
      match.createdAt = {
        $gte: new Date(Number(year), monthIndex, 1, 0, 0, 0),
        $lte: new Date(Number(year), monthIndex + 1, 0, 23, 59, 59, 999)
      };
    } else {
      // 🔹 Default — today
      const now = new Date();
      match.createdAt = {
        $gte: new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0) - istOffsetMs),
        $lte: new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999) - istOffsetMs)
      };
    }

    // ============================================================
    // 🔹 AGGREGATE PIPELINE
    // ============================================================

    const pipeline = [
      { $match: match },
      {
        $facet: {

          // 🔹 Overall sale value by type
          saleByType: [
            {
              $group: {
                _id: "$type",
                totalValue: { $sum: { $toDouble: "$orderValue" } },
                count: { $sum: 1 }
              }
            }
          ],

          // 🔹 Product quantities
          productQuantities: [
            { $project: { products: { $objectToArray: "$products" } } },
            { $unwind: "$products" },
            {
              $group: {
                _id: "$products.k",
                quantity: { $sum: "$products.v" }
              }
            },
            { $sort: { quantity: -1 } }
          ],

          // 🔹 Category quantities
          categoryQuantities: [
            { $project: { total: { $objectToArray: "$total" } } },
            { $unwind: "$total" },
            {
              $group: {
                _id: "$total.k",
                quantity: { $sum: "$total.v" }
              }
            },
            { $sort: { quantity: -1 } }
          ]
        }
      }
    ];

    const [result] = await Order.aggregate(pipeline);

    // ============================================================
    // 🔹 FORMAT RESPONSE
    // ============================================================

    // 🔹 Format sale by type
    const saleByType = { order: 0, replacement: 0, return: 0 };
    result.saleByType.forEach(item => {
      saleByType[item._id] = {
        totalValue: Math.round(item.totalValue * 100) / 100,
        count: item.count
      };
    });

    // 🔹 Format product quantities
    const productQuantities = {};
    result.productQuantities.forEach(item => {
      productQuantities[item._id] = item.quantity;
    });

    // 🔹 Format category quantities
    const categoryQuantities = {};
    result.categoryQuantities.forEach(item => {
      categoryQuantities[item._id] = item.quantity;
    });

    res.status(200).json({
      saleByType,
      productQuantities,
      categoryQuantities
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CSV
const prepareCSV = async (orders, placedOrders) => {
  try {

    const formattedOrders = orders.map(order => {
      const date = new Date(order.createdAt);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const created_date = `${day}/${month}/${year} ${hours}:${minutes}`;

      const row = {
        Date: order?.createdAt.toLocaleDateString(),
        Time: order?.createdAt.toLocaleTimeString(),
        Shop: order?.shopId?.name || "",
        Contact: order?.shopId?.contactNumber || "",
        Address: order?.shopId?.address || "",
        AddressLink: order?.shopId?.addressLink || "",
        SR: order?.placedBy,
        "Created At": created_date
      };


      if (placedOrders && order?.products) {
        [...productList].forEach(item => {
          row[item] = order?.products.get(item) || 0;
        });
        [...totalList].forEach(item => {
          row[item] = order?.total.get(item) || 0;
        });
      }
      return row;
    });

    const fields = [
      "Date",
      "Time",
      "Shop",
      "Contact",
      "Address",
      "AddressLink",
      "SR",
      "Created At",
      ...(placedOrders ? [...productList, ...totalList] : [])
    ];


    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(formattedOrders);

    return csv
  } catch (error) {
    return error
  }
}

// 4. CSV Export
const csvExportOrder = async (req, res) => {
  try {
    const { areaId, username, completeData = false, placedOrders, date } = req.body;

    if (completeData && date) {
      return res.status(400).json({ message: "Invalid entry" });
    }
    if (areaId && (username || date)) {
      return res.status(400).json({ message: "Invalid entry" });
    }
    if (!areaId && !(username || date)) {
      return res.status(400).json({ message: "Route, SR or Date is required" });
    }

    // Build query
    const query_prev = { deleted: false };

    if (areaId) {
      query_prev.areaId = areaId
    }
    if (username) {
      query_prev.placedBy = username
    }

    const query = getDateQuery(query_prev, completeData, date)

    if (placedOrders) {
      query["products"] = { $ne: {} };
    } else {
      query["products"] = {};
    }

    const orders = await Order.find(query)
      .populate("shopId", "name address addressLink contactNumber")
      .sort({ createdAt: -1 })

    if (!orders.length) {
      return res.status(404).json({ message: "No orders found" });
    }

    const csv = await prepareCSV(orders, placedOrders)

    res.header("Content-Type", "text/csv");
    res.attachment("orders.csv");
    return res.send(csv);

  } catch (error) {
    res.status(500).json(error.message);
  }
};


module.exports = {
  createOrder,
  getOrders,
  softDeleteOrder,
  csvExportOrder,
  getSalesReport,
};
