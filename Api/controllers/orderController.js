// controllers/orderController.js
const Order = require("../models/Order");
const Area = require("../models/Area");
const Shop = require("../models/Shop");
const User = require("../models/User");
const { Parser } = require("json2csv");
const City = require("../models/City");

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

// create order
const createOrder = async (req, res) => {
  try {
    let { shopId, areaId, products, existing_products, rate, placedBy, location, paymentTerms, remarks, orderPlacedBy, type = "order", date } = req.body;

    const createdBy = req.user.username;
    const finalPlacedBy = placedBy || createdBy

    const areaExists = await Area.findOne({ _id: areaId, deleted: { $in: [false, null] } });
    const shopExists = await Shop.findOne({ _id: shopId, deleted: { $in: [false, null] } });
    if (!areaExists || !shopExists) return res.status(400).json("Invalid area or shop ID");

    if (!rate) {
      rate = { "25g": 28, "50g": 40, "55g": 40, "gift": 40 }
    }

    let data = { shopId, areaId, placedBy: finalPlacedBy, products, existing_products, rate, createdBy, location, paymentTerms, remarks, orderPlacedBy, type, createdAt: date }

    // Calculate total if products exist
    let total = {}
    if (products && Object.keys(products.toObject ? products.toObject() : products).length !== 0) {

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
      data["total"] = total

    } else {
      if (!location) return res.status(400).json("Location not found");
    }

    const order = new Order(data);

    if (products && Object.keys(products.toObject ? products.toObject() : products).length !== 0) {

      let shopData = { placedBy: finalPlacedBy, products, total, existing_products, rate, paymentTerms, remarks, orderPlacedBy, createdAt: date, orderId: order._id, type }

      if (!shopExists.orders) {
        shopExists.orders = []
      }
      shopExists.orders.push(shopData)
      // if (shopExists.orders.length > 3) {
      //   shopExists.orders.shift()
      // }

      // Readjust stock
      // assign stock to existing_products and then
      // if type = order -> add products to stock
      // if type = replacement -> dont do anything
      // if type = return -> remove products from stock

      // --- Readjust stock ---
      if (!shopExists.stock) {
        shopExists.stock = new Map();
      }

      // 1️⃣ Assign stock to existing_products (current stock snapshot)
      shopExists.stock = new Map(Object.entries(shopData.existing_products || {}));

      // 2️⃣ Adjust based on order type
      if (type === "order") {
        // Add ordered products to stock
        for (const [product, qty] of Object.entries(shopData.products || {})) {
          const current = shopExists.stock.get(product) || 0;
          shopExists.stock.set(product, current + qty);
        }

      } else if (type === "return") {
        // Subtract returned products from stock
        for (const [product, qty] of Object.entries(shopData.products || {})) {
          const current = shopExists.stock.get(product) || 0;
          const newQty = current - qty;
          shopExists.stock.set(product, newQty >= 0 ? newQty : 0); // prevent negatives
        }

      }

    }

    shopExists.visitedAt = date
    if (type === "order" && !location) {
      if (shopExists.first) {
        shopExists.repeat = true
        shopExists.first = false
      } else if (!shopExists.first && !shopExists.repeat) {
        shopExists.first = true
      }
    }

    await shopExists.save()
    await order.save();
    res.status(201).json({ "message": "Order created successfully" });
  } catch (error) {
    res.status(500).json(error.message);
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
        const newQty = current - qty;
        shop.stock.set(product, newQty >= 0 ? newQty : 0);
      }
    }
  }

  return shop;
};


const softDeleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBy = req.user.username;

    const order = await Order.findOne({ _id: id, deleted: false });
    if (!order || order.deleted) return res.status(404).json("Order not found or already deleted");

    order.deleted = true;
    order.deletedBy = deletedBy;
    order.deletedAt = new Date();

    // remove from shop orders history
    const shopExists = await Shop.findOne({ _id: order.shopId })
    shopExists.orders = shopExists.orders.filter(
      (o) => o.orderId.toString() !== order._id.toString()
    );
    await order.save();

    const ordersCnt = await Order.find({
      deleted: false,
      location: {
        $exists: false
      },
      type: "order",
      shopId: shopExists._id
    }).countDocuments()

    if (ordersCnt === 0) {
      shopExists.first = false
      shopExists.repeat = false
    } else if (ordersCnt === 1) {
      shopExists.first = true
      shopExists.repeat = false
    }

    await adjustShopStockAfterOrderRemoval(shopExists, order);
    await shopExists.save()

    res.status(200).json("Order deleted successfully");
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// Daily report
const dailyReport = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: "Username is required" });

    const nowIST = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const startOfMonth = new Date(nowIST);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfDay = new Date(nowIST);
    endOfDay.setHours(23, 59, 59, 999);

    const query = {
      products: { $ne: {} },
      createdAt: { $gte: startOfMonth, $lte: endOfDay },
      deleted: false,
      type: "order"
    };

    if (username !== "old") {
      query.placedBy = username;
    }

    const orders = await Order.find(query);

    const orderKeys = [
      "Regular 50g", "Coffee 50g", "Regular 25g", "Coffee 25g",
      "Gift box", "Hazelnut & Blueberries 55g", "Roasted Almonds & Pink Salt 55g",
      "Kiwi & Pineapple 55g", "Ginger & Cinnamon 55g",
      "Pistachio & Black Raisin 55g", "Dates & Raisin 55g"
    ];

    const keysToReport = orderKeys.map(key => `Ordered ${key}`);
    const dailySummary = {};

    orders.forEach(order => {
      const dateKey = new Date(order.createdAt).toISOString().split('T')[0];

      if (!dailySummary[dateKey]) {
        dailySummary[dateKey] = {
          date: dateKey,
          ...Object.fromEntries(keysToReport.map(key => [key, 0]))
        };
      }

      orderKeys.forEach(baseKey => {
        const qty = order.total?.get(baseKey) || 0;
        const orderKey = `Ordered ${baseKey}`;
        dailySummary[dateKey][orderKey] += qty;
      });
    });

    const reportList = Object.values(dailySummary).sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );

    res.json({ totalSummary: reportList });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// performance report
const dailyCallsReport = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: "Username is required" });

    const nowIST = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const startOfMonth = new Date(nowIST);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfDay = new Date(nowIST);
    endOfDay.setHours(23, 59, 59, 999);

    const query = {
      placedBy: username,
      createdAt: { $gte: startOfMonth, $lte: endOfDay },
      deleted: false,
      type: "order"
    };

    const orders = await Order.find(query);
    const dailySummary = {};

    orders.forEach(order => {
      const dateKey = new Date(order.createdAt).toISOString().split('T')[0];

      if (!dailySummary[dateKey]) {
        dailySummary[dateKey] = {
          date: dateKey,
          pc: 0,
          tc: 0,
        };
      }

      const isEmpty =
        !(order.products instanceof Map) ||
        [...order.products.values()].filter(qty => qty > 0).length === 0;

      if (!isEmpty) {
        dailySummary[dateKey].pc += 1;
      }

      dailySummary[dateKey].tc += 1;
    });

    const reportList = Object.values(dailySummary).sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );

    res.json({ totalCalls: reportList });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// date query
const getDateQuery = (query, completeData, date = "", month, year) => {
  try {

    if (!completeData && !date) {

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      query.createdAt = { $gte: startOfToday, $lte: endOfToday };
    } else if (completeData) {

      const istOffsetMs = 5.5 * 60 * 60 * 1000;
      const now = new Date();
      const startOfMonthIST = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0) - istOffsetMs);
      const endOfMonthIST = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999) - istOffsetMs);

      query.createdAt = { $gte: startOfMonthIST, $lte: endOfMonthIST };
    } else if (date) {

      const istOffsetMs = 5.5 * 60 * 60 * 1000;
      const [year, month, day] = date.split("-").map(Number);
      const istStartofDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - istOffsetMs);
      const istEndofDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - istOffsetMs);
      query.createdAt = { $gte: istStartofDay, $lte: istEndofDay };
    }

    // set month passed
    if (month && year) {
      // const now = new Date();
      // const year = now.getFullYear();

      // Step 2: Convert month name (e.g., "June") to month number (0-indexed)
      const monthIndex = new Date(`${month} 1, ${year}`).getMonth();

      // Step 3: Build IST start and end of month
      const startIST = new Date(year, monthIndex, 1, 0, 0, 0, 0);
      const endIST = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

      // Step 4: Convert to UTC
      const startUTC = new Date(startIST.getTime());
      const endUTC = new Date(endIST.getTime());
      query.createdAt = { $gte: startUTC, $lte: endUTC };
    }


    return query

  } catch (error) {
    return
  }
}

// paginated orders
const paginatedOrders = async (page, limit, query) => {
  try {
    // Pagination params
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(query)
      .populate("shopId", "name address contactNumber addressLink areaName repeat first blacklisted")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Optional: total count for frontend pagination controls
    const totalOrders = await Order.countDocuments(query);

    return { orders, totalOrders, pageNum }

  } catch (error) {
    return error
  }
}

// orders  by area
const getOrdersByArea = async (req, res) => {
  try {
    const { areaId, completeData = false, page = 1, limit = 60, placedOrders, month, city, date } = req.body;

    if (!areaId && !city) {
      return res.status(400).json({ message: "Area parameter is required" });
    }

    if (completeData && month) {
      return res.status(404).jaon({ message: "Invalid Entry" })
    }

    if (areaId && city) {
      return res.status(404).jaon({ message: "Invalid Entry" })
    }

    // Build query
    const query_prev = { deleted: false };
    if (areaId) {
      query_prev.areaId = areaId
    }
    if (city) {
      const cityExists = await City.findOne({ _id: city })
      if (!cityExists) {
        return res.status(500).json({ message: "City not found" })
      }
      query_prev.areaId = { $in: cityExists.areas }
    }
    if (req.user.role === "sr") {
      query_prev.placedBy = req.user.username
    }

    const query = getDateQuery(query_prev, completeData, date, month)

    if (placedOrders) {
      query["products"] = { $ne: {} };
    } else {
      query["products"] = {};
    }

    // get paginated orders
    const { orders, totalOrders, pageNum } = await paginatedOrders(page, limit, query);

    res.status(200).json({
      orders,
      currentPage: pageNum,
      totalPages: Math.ceil(totalOrders / limit),
      totalCount: totalOrders
    });
  } catch (error) {

    res.status(500).json({ message: error.message });
  }
};

// 2. get orders- placed by
const getOrdersBySR = async (req, res) => {
  try {
    const { username, completeData = false, page = 1, limit = 60, placedOrders, month, date } = req.body;

    if (!username) {
      return res.status(404).json("SR name is required");
    }

    if (completeData && month) {
      return res.status(404).jaon({ message: "Invalid Entry" })
    }

    // Build query
    const query_prev = { deleted: false };

    if (username !== "old") {
      query_prev.placedBy = username
    } else {
      const usersData = await User.find({ role: { $in: ["sr", "tl"] }, active: false }, { username: 1, _id: 0 })
      const users = []
      usersData.map(obj => users.push(obj.username))
      query_prev.placedBy = { $in: users }
    }

    const query = getDateQuery(query_prev, completeData, date, month)

    if (placedOrders) {
      query["products"] = { $ne: {} };
    } else {
      query["products"] = {};
    }


    // get paginated orders
    const { orders, totalOrders, pageNum } = await paginatedOrders(page, limit, query);

    res.status(200).json({
      orders,
      currentPage: pageNum,
      totalPages: Math.ceil(totalOrders / limit),
      totalCount: totalOrders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Orders by date
const getOrdersByDate = async (req, res) => {
  try {

    const { username, page = 1, limit = 60, placedOrders, date, dist = "" } = req.body;

    // Build query
    const query_prev = { deleted: false };
    if (username) {
      if (username !== "old") {
        query_prev.placedBy = username
      } else {
        const usersData = await User.find({ role: { $in: ["sr", "tl"] }, active: false }, { username: 1, _id: 0 })
        const users = []
        usersData.map(obj => users.push(obj.username))
        query_prev.placedBy = { $in: users }
      }
    }

    const query = getDateQuery(query_prev, false, date, "")

    if (placedOrders) {
      query["products"] = { $ne: {} };
    } else {
      query["products"] = {};
    }

    if (dist) {
      if (username) return res.status(404).json("Invalid Entry")
      const areas = await Area.find({ distributor: dist, deleted: { $in: [false, null] } }, { _id: 1 })
      const areaIds = []
      areas.forEach((obj) => areaIds.push(obj._id))
      query.areaId = { $in: areaIds }
    }

    // get paginated orders
    const { orders, totalOrders, pageNum } = await paginatedOrders(page, limit, query);

    res.status(200).json({
      orders,
      currentPage: pageNum,
      totalPages: Math.ceil(totalOrders / limit),
      totalCount: totalOrders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- for Orders / Replacements ---
const getReport = async (orders) => {
  try {
    const keysToReport = [
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

    const amountTotal = [90, 90, 45, 45, 350, 310, 285, 310, 270, 300, 350]; // PRICE, MRP
    const productTotals = {};
    const overallTotals = {};

    keysToReport.forEach(key => productTotals[key] = 0);
    totalList.forEach(key => overallTotals[key] = 0);

    let grandTotal = 0;
    for (const order of orders) {
      const orderProducts = order.products || {};
      const orderTotal = order.total || {};
      const rate = order.rate || { "25g": 30, "50g": 40, "55g": 40, "gift": 40 };
      const gst = 1 + parseFloat(order.gst) / 100

      keysToReport.forEach(key => {
        if (orderProducts.get(key)) {
          productTotals[key] += orderProducts.get(key);
        }
      });

      totalList.forEach(key => {
        if (orderTotal.get ? orderTotal.get(key) : orderTotal[key]) {
          overallTotals[key] += (orderTotal.get ? orderTotal.get(key) : orderTotal[key]) || 0;
        }
      });
      const landingPrices = [];

      for (let i = 0; i < totalList.length; i++) {
        const item = totalList[i];
        const mrp = amountTotal[i];

        let marginPercent = 0;
        if (item.includes("25g")) marginPercent = rate.get('25g') || 0
        else if (item.includes("50g")) marginPercent = rate.get('50g') || 0
        else if (item.includes("55g")) marginPercent = rate.get('55g') || 0
        else if (item.toLowerCase().includes("gift")) marginPercent = rate.get("gift") || 0

        const landingPrice = (mrp - (mrp * marginPercent / 100)) / gst;


        landingPrices.push(parseFloat(landingPrice.toFixed(2)))

        const qty = orderTotal.get(item) || 0;
        grandTotal += landingPrice * qty;
      }
    }
    const amount = grandTotal.toFixed(2)

    return { productTotals, overallTotals, amount };
  } catch (error) {
    return error;
  }
};


// for Returns + Partial Returns 
const getReturnReport = async (orders) => {
  try {
    const keysToReport = [
      "Cranberry 50g", "Dryfruits 50g", "Peanuts 50g", "Mix seeds 50g", "Blueberry 50g", "Hazelnut 50g", "Orange 50g", "Berries Burst 50g",
      "Classic Coffee 50g", "Dark Coffee 50g", "Intense Coffee 50g", "Toxic Coffee 50g",
      "Cranberry 25g", "Dryfruits 25g", "Peanuts 25g", "Mix seeds 25g", "Blueberry 25g", "Hazelnut 25g", "Berries Burst 25g",
      "Orange 25g", "Mint 25g", "Classic Coffee 25g", "Dark Coffee 25g",
      "Intense Coffee 25g", "Toxic Coffee 25g", "Gift box",
      "Hazelnut & Blueberries 55g", "Roasted Almonds & Pink Salt 55g", "Kiwi & Pineapple 55g", "Ginger & Cinnamon 55g", "Pistachio & Black Raisin 55g", "Dates & Raisin 55g"
    ];

    const totalList = [
      "Regular 50g", "Coffee 50g", "Regular 25g", "Coffee 25g", "Gift box", "Hazelnut & Blueberries 55g", "Roasted Almonds & Pink Salt 55g", "Kiwi & Pineapple 55g", "Ginger & Cinnamon 55g", "Pistachio & Black Raisin 55g", "Dates & Raisin 55g"
    ];

    const amountTotal = [90, 90, 45, 45, 350, 310, 285, 310, 270, 300, 350]; // PRICE, MRP
    const productTotals = {};
    const overallTotals = {};

    keysToReport.forEach(key => productTotals[key] = 0);
    totalList.forEach(key => overallTotals[key] = 0);

    let grandTotal = 0;
    for (const order of orders) {
      let orderProducts = {};
      let orderTotal = {};
      const rate = order.rate || { "25g": 30, "50g": 40, "55g": 40, "gift": 40 };
      const gst = 1 + parseFloat(order.gst) / 100

      if (order.type === "return") {
        orderProducts = order.products || {};
        orderTotal = order.total || {};
      }

      keysToReport.forEach(key => {
        if (orderProducts.get && orderProducts.get(key)) {
          productTotals[key] += orderProducts.get(key);
        }
      });

      totalList.forEach(key => {
        if (orderTotal.get && orderTotal.get(key)) {
          overallTotals[key] += orderTotal.get(key);
        }
      });

      const landingPrices = [];

      for (let i = 0; i < totalList.length; i++) {
        const item = totalList[i];
        const mrp = amountTotal[i];

        let marginPercent = 0;
        if (item.includes("25g")) marginPercent = rate.get('25g') || 0
        else if (item.includes("50g")) marginPercent = rate.get('50g') || 0
        else if (item.includes("55g")) marginPercent = rate.get('55g') || 0
        else if (item.toLowerCase().includes("gift")) marginPercent = rate.get("gift") || 0

        const landingPrice = (mrp - (mrp * marginPercent / 100)) / gst;

        landingPrices.push(parseFloat(landingPrice.toFixed(2)))
        const qty = orderTotal.get(item) || 0;
        grandTotal += landingPrice * qty;
      }
    }

    const amount = grandTotal.toFixed(2)
    return { productTotals, overallTotals, amount };
  } catch (error) {
    return error;
  }
};


const buildReportQuery = async (dist_username, placed_username, completeData, date, month, year) => {
  try {
    // Build query
    const query_prev = { deleted: false, products: { $ne: {} } };

    // Get area ids, if distributor
    if (dist_username) {
      const areaIds = await Area.find({ distributor: dist_username }, "id")
      query_prev["areaId"] = { $in: areaIds }
    }

    if (placed_username) {
      query_prev["placedBy"] = placed_username
    }

    // Date query
    const query = await getDateQuery(query_prev, completeData, date, month, year)

    return query
  } catch (error) {
    return error
  }
}

const getSalesReport = async (req, res) => {
  try {
    const {
      dist_username,
      completeData = false,
      placed_username,
      date,
      month,
      year,
      areaId,
      city
    } = req.body;

    if (completeData && date) {
      return res.status(404).json({ message: "Invalid Entry" });
    }

    if ((completeData || date) && month) {
      return res.status(404).json({ message: "Invalid Entry" });
    }

    if (city && areaId) {
      return res.status(404).json({ message: "Invalid Entry" });
    }

    const query = await buildReportQuery(
      dist_username,
      placed_username,
      completeData,
      date,
      month,
      year
    );

    if (areaId) {
      query.areaId = areaId;
    }

    if (city) {
      const cityExists = await City.findOne({ _id: city });
      if (!cityExists) {
        return res.status(500).json({ message: "City not found" });
      }
      query.areaId = { $in: cityExists.areas };
    }

    // 🔹 Orders
    const order_query = {
      ...query,
      type: "order"
    };

    const order_orders = await Order.find(order_query, {
      products: 1,
      total: 1,
      type: 1,
      rate: 1,
      gst: 1
    });

    const saleReport = await getReport(order_orders);

    // 🔹 Replacements
    const replacement_query = {
      ...query,
      type: "replacement"
    };

    const replacement_orders = await Order.find(replacement_query, {
      products: 1,
      total: 1,
      type: 1,
      rate: 1,
      gst: 1
    });

    const saleReplaceReport = await getReport(replacement_orders);

    // 🔹 Returns
    const return_query = {
      ...query,
      type: "return"
    };

    const return_orders = await Order.find(return_query, {
      products: 1,
      total: 1,
      type: 1,
      rate: 1,
      gst: 1
    });

    const saleReturnReport = await getReturnReport(return_orders);

    res.status(200).json({
      saleReport,
      saleReplaceReport,
      saleReturnReport
    });

  } catch (error) {
    res.status(500).json(error.message);
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
  getOrdersByArea,
  softDeleteOrder,
  csvExportOrder,
  dailyReport,
  getSalesReport,
  getOrdersBySR,
  getOrdersByDate,
  dailyCallsReport,
};
