const City = require("../models/City")
const { Parser } = require("json2csv");

// get all cities with _id which will be passed in area creation
const getAllCities = async (req, res) => {
  try {
    const cities = await City.find({}, { name: 1, _id: 1 });
    return res.status(200).json(cities);
  } catch (error) {
    return res.status(500).json(error);
  }
};

// 1. Create Area
const createCity = async (req, res) => {
  try {
    const { name } = req.body;

    const existingCity = await City.findOne({ name: name.trim() });
    if (existingCity) {
      return res.status(400).json("City with this name already exists");
    }   
    const city = new City({ name: name.trim(), createdBy: req.user.username });
    await city.save();
    res.status(201).json(city);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 2. Update City
const updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const existingCity = await City.findOne({ name: name.trim(), _id: { $ne: id } });
    if (existingCity) {
      return res.status(400).json("City with this name already exists");
    }

    const city = await City.findByIdAndUpdate(id, { name: name.trim(), updatedBy: req.user.username, updatedAt: Date.now()}, { new: true });
    
    if (!city) return res.status(404).json("City not found");

    res.status(200).json({"message": "City name updated successfully"});
  } catch (error) {
    res.status(500).json(error.message);
  }
};


module.exports = {
  createCity,
  updateCity,
  getAllCities,
};
