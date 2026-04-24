const City = require("../models/City")
const { Parser } = require("json2csv");


// 1. Create city
const createCity = async (req, res) => {
  try {
    const { name, state } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
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


// get all cities with _id which will be passed in area creation
const getAllCities = async (req, res) => {
  try {

    const {state} = req.body

    let query = {}
    if (state){
      query["state"] = state
    }

    const cities = await City.find(query, { name: 1, _id: 1 });
    return res.status(200).json(cities);
  } catch (error) {
    return res.status(500).json(error);
  }
};

module.exports = {
  createCity,
  updateCity,
  getAllCities,
};
