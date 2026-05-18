const City = require("../models/City")
const { Parser } = require("json2csv");
const { checkCityAccess } = require("./areaController");


// 1. Create city
const createCity = async (req, res) => {
  try {
    const { name, state } = req.body;

    if (!name || !state) {
      return res.status(400).json({ message: "Name and State are required" });
    }

    const existingCity = await City.findOne({ name: name.trim() });
    if (existingCity) {
      return res.status(400).json({ message: "City with this name already exists" });
    }

    await City.create({
      name: name.trim(),
      state: state ? state.trim() : undefined,
      createdBy: req.user.username
    });

    res.status(201).json({ message: "City created successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2.Update city
const updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, state } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    // 🔹 Find city
    const city = await City.findById(id);
    if (!city) {
      return res.status(404).json({ message: "City not found" });
    }

    // 🔹 Check name uniqueness
    const existingCity = await City.findOne({ name: name.trim(), _id: { $ne: id } });
    if (existingCity) {
      return res.status(400).json({ message: "City with this name already exists" });
    }

    const oldName = city.name;
    const newName = name.trim();

    // 🔹 No changes needed
    if (oldName === newName && (!state || state.trim() === city.state)) {
      return res.status(200).json({ message: "No changes detected" });
    }

    // 🔹 Update city
    await City.findByIdAndUpdate(id, {
      $set: {
        name: newName,
        state: state ? state.trim() : city.state,
        updatedBy: req.user.username
      }
    });

    // 🔹 Update city_name in User schema
    if (oldName !== newName) {
      await User.updateMany(
        { city_name: oldName },
        { $set: { "city_name.$": newName } }
      );

      // 🔹 Update city_name in Area schema
      await Area.updateMany(
        { city_name: oldName },
        { $set: { city_name: newName } }
      );
    }

    res.status(200).json({ message: "City updated successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all cities
const getAllCities = async (req, res) => {
  try {
    const { state } = req.query;

    if (req.user.dept_name === "Partners") {
      return res.status(403).json({ message: "Access denied for Partners" });
    }

    let query = {};

    // 🔹 State filter
    if (state) {
      query.state = state.trim();
    }

    // ACCESS CONTROL 
    if (!["HR", "Admin"].includes(req.user.dept_name)) {

      // 1. Get current user + subordinates
      const reqUser = await User.findById(req.user._id).select("subordinates");

      const allUsers = await User.find({
        _id: { $in: [req.user._id, ...reqUser.subordinates] }
      }).select("_id");

      const accessibleUserIds = allUsers.map(u => u._id);

      // 2. Restrict cities by sales field
      query.sales = { $in: accessibleUserIds };
    }

    const cities = await City.find(query)
      .select("_id name");

    return res.status(200).json(cities);

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// get cities for dropdown
const getCitiesDrop = async (req, res) => {
  try {
    let cityIds = [];

    if (!["HR", "Admin"].includes(req.user.dept_name)) {
      // 🔹 Get logged in user + subordinates
      const reqUser = await User.findById(req.user._id).select("city subordinates");

      const allUsers = await User.find({
        _id: { $in: [req.user._id, ...reqUser.subordinates] }
      }).select("city");

      // 🔹 Collect all unique city ids
      cityIds = [...new Set(
        allUsers.flatMap(u => u.city.map(c => c.toString()))
      )];
    }

    // 🔹 Build query
    const query = {};
    if (cityIds.length > 0) {
      query._id = { $in: cityIds };
    }

    const cities = await City.find(query).select("_id name");

    res.status(200).json({ cities });

  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
};

const getCitySalesDrop = async (req, res) => {
  try {
    const { city } = req.body;
    if (!city) {
      return res.status(400).json({ message: "City is required" });
    }

    const cityDoc = await City.findOne({ name: city.trim() }).select("_id");
    if (!cityDoc) {
      return res.status(404).json({ message: "City not found" });
    }

    await checkCityAccess(req.user, cityDoc._id);

    // 🔹 Find all active users who have this city in their allCities array
    const users = await User.find({
      allCities: cityDoc._id,
      active: true,
      dept_name: { $nin: ["HR", "Admin", "Partners"] }
    }).select("_id username");

    res.status(200).json({ users });

  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
};
module.exports = {
  createCity,
  updateCity,
  getAllCities,
  getCitiesDrop,
  getCitySalesDrop
};
