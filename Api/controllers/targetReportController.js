const TargetReport = require("../models/TargetReport");

// Handles create and update of target assignment
const createTarget = async (req, res) => {
  try {
    const { usersId, month, value } = req.body;

    if (!usersId || !Array.isArray(usersId) || usersId.length === 0) {
      return res.status(400).json({ message: "usersId must be a non-empty array" });
    }

    if (!month || !value) {
      return res.status(400).json({ message: "month and value are required" });
    }

    // 🔹 Validate month
    const validMonths = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"];
    if (!validMonths.includes(month)) {
      return res.status(400).json({ message: "Invalid month. Must be 00-11" });
    }

    // 🔹 Current year
    const year = new Date().getFullYear().toString();

    // 🔹 Validate users exist
    const users = await User.find({ _id: { $in: usersId } }).select("_id username");
    if (users.length !== usersId.length) {
      return res.status(404).json({ message: "One or more users not found" });
    }

    // 🔹 Access check — logged in user must have access to all users
    if (!["HR", "Admin"].includes(req.user.dept_name)) {
      const reqUser = await User.findById(req.user._id).select("subordinates");
      const subordinateIds = reqUser.subordinates.map(s => s.toString());
      for (let user of users) {
        if (!subordinateIds.includes(user._id.toString())) {
          return res.status(403).json({ message: `You do not have access to user ${user.username}` });
        }
      }
    }

    const assignedAt = new Date();
    const assignedBy = req.user.username;

    // 🔹 Upsert target report for each user
    await Promise.all(users.map(user =>
      TargetReport.findOneAndUpdate(
        { user: user._id, year },
        {
          $set: {
            [`targetAssigned.${month}`]: value,
            username: user.username,
            assignedBy,
            assignedAt
          },
          $setOnInsert: {
            user: user._id,
            year
          }
        },
        { upsert: true, new: true }
      )
    ));

    res.status(200).json({ message: "Target assigned successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get subordinates target for given month
const calculateSubTargetAchieved = async (req, res) => {
  try {
    const { userId, month, year } = req.body;

    if (["HR", "Admin"].includes(req.user.dept_name) && !userId) {
      return res.status(400).json({ message: "User is required" });
    }
    const id = userId || req.user._id;

    if (!month) {
      return res.status(400).json({ message: "Month is required" });
    }

    const validMonths = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"];
    if (!validMonths.includes(month)) {
      return res.status(400).json({ message: "Invalid month. Must be 00-11" });
    }

    const targetYear = year || String(new Date().getFullYear());

    // 🔹 Find user
    const user = await User.findById(id).select("username subordinates");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔹 Sales access check
    if (!["HR", "Admin"].includes(req.user.dept_name)) {
      if (id.toString() !== req.user._id.toString()) {
        const reqUser = await User.findById(req.user._id).select("subordinates");
        const isInSubordinates = reqUser.subordinates.map(s => s.toString()).includes(id.toString());
        if (!isInSubordinates) {
          return res.status(403).json({ message: "You do not have access to this user" });
        }
      }
    }

    if (!user.subordinates || user.subordinates.length === 0) {
      return res.status(200).json({ subTargetAchieved: 0 });
    }

    // 🔹 Find or create target report
    const targetReport = await TargetReport.findOneAndUpdate(
      { user: id, year: targetYear },
      { $setOnInsert: { user: id, username: user.username, year: targetYear } },
      { upsert: true, new: true }
    );

    const monthIndex = Number(month);
    const requestedMonthStart = new Date(Number(targetYear), monthIndex, 1, 0, 0, 0);
    const requestedMonthEnd = new Date(Number(targetYear), monthIndex + 1, 0, 23, 59, 59, 999);

    // ============================================================
    // 🔹 CHECK IF CALCULATION IS NEEDED
    // If subTargetLastCalculatedAt is newer than requestedMonthEnd
    // month is already fully calculated — no need to recalculate
    // ============================================================

    if (
      targetReport.subTargetLastCalculatedAt &&
      requestedMonthEnd < targetReport.subTargetLastCalculatedAt
    ) {
      return res.status(400).json({
        message: "This month is already calculated. Use getSubTargetAchieved to retrieve stored value."
      });
    }

    // ============================================================
    // 🔹 CALCULATE FROM lastCalculatedAt OR START OF MONTH
    // ============================================================

    const calcFrom = targetReport.subTargetLastCalculatedAt &&
      targetReport.subTargetLastCalculatedAt > requestedMonthStart
      ? targetReport.subTargetLastCalculatedAt
      : requestedMonthStart;

    // 🔹 Get all subordinates' usernames
    const subordinateUsers = await User.find({
      _id: { $in: user.subordinates }
    }).select("username");
    const subordinateUsernames = subordinateUsers.map(u => u.username);

    // 🔹 Find orders placed by subordinates in given period
    const orders = await Order.find({
      placedBy: { $in: subordinateUsernames },
      createdAt: { $gte: calcFrom, $lte: requestedMonthEnd },
      deleted: { $in: [false, null] },
      products: { $ne: {} }
    }).select("orderValue");

    // 🔹 Sum order values
    const newValue = orders.reduce((sum, order) => {
      return sum + (Number(order.orderValue) || 0);
    }, 0);

    // 🔹 Add to existing value
    const existingValue = targetReport.subTargetAchieved.get(month) || 0;
    const updatedValue = Math.round((existingValue + newValue) * 100) / 100;

    // 🔹 Update target report
    await TargetReport.findOneAndUpdate(
      { user: id, year: targetYear },
      {
        $set: {
          [`subTargetAchieved.${month}`]: updatedValue,
          subTargetLastCalculatedAt: new Date()
        }
      }
    );

    res.status(200).json({
      calcSubTargetAchieved: updatedValue
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get complete subordinates target array
const getSubTargetAchieved = async (req, res) => {
  try {
    const { userId, year } = req.body;

    if (["HR", "Admin"].includes(req.user.dept_name) && !userId) {
      return res.status(400).json({ message: "User is required" });
    }

    const id = userId || req.user._id;
    const targetYear = year || String(new Date().getFullYear());

    // 🔹 Sales access check
    if (!["HR", "Admin"].includes(req.user.dept_name)) {
      if (id.toString() !== req.user._id.toString()) {
        const reqUser = await User.findById(req.user._id).select("subordinates");
        const isInSubordinates = reqUser.subordinates.map(s => s.toString()).includes(id.toString());
        if (!isInSubordinates) {
          return res.status(403).json({ message: "You do not have access to this user" });
        }
      }
    }

    // 🔹 Find target report
    const targetReport = await TargetReport.findOne({ user: id, year: targetYear });
    if (!targetReport) {
      return res.status(200).json({ subTargetAchieved: {} });
    }

    res.status(200).json({
      subTargetLastCalculatedAt: targetReport.subTargetLastCalculatedAt,
      subTargetAchieved: targetReport.subTargetAchieved
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTarget,
  calculateSubTargetAchieved,
  getSubTargetAchieved
};



