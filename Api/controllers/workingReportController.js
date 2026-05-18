const WorkingReport = require("../models/WorkingReport");

// Get performance
const getWorkingReport = async (req, res) => {
  try {
    const { userId, month, year } = req.body;

    if (["HR", "Admin"].includes(req.user.dept_name) && !userId) {
      return res.status(400).json({ message: "User is required" });
    }

    const id = userId || req.user._id;
    const targetYear = year || String(new Date().getFullYear());
    const targetMonth = month || String(new Date().getMonth()).padStart(2, "0");

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

    // 🔹 Find working report
    const report = await WorkingReport.findOne({
      user: id,
      year: targetYear,
      month: targetMonth
    });

    if (!report) {
      return res.status(200).json({ performance: {} });
    }

    res.status(200).json({
      year: targetYear,
      month: targetMonth,
      performance: report.performance
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getWorkingReport
};



