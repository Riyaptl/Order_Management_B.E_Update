const Pricing = require("../models/Pricing");

// Create pricing
const createPricing = async (req, res) => {
  try {
    const { MRP } = req.body;

    if (!MRP) {
      return res.status(400).json({ message: "MRP is required" });
    }

    const existing = await Pricing.findOne({ MRP, deleted: false });

    if (existing) {
      return res.status(400).json({ message: "Pricing slot already exists" });
    }

    const pricing = await Pricing.create({
      MRP,
      createdBy: req.user.username
    });

    res.status(201).json({
      message: "Pricing slot created",
      data: pricing
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Read all 
const getAllPricing = async (req, res) => {
  try {
    const {MRP} = req.body
    let query = {deleted: false}

    if (MRP){
      query["MRP"] = MRP
    }

    const pricing = await Pricing.find(query)
      .populate({
        path: "products",
        match: { deleted: false },
        select: "name category_name"
      });

    res.status(200).json(pricing);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Read - dropdown
const getPricingMRPDrop = async (req, res) => {
  try {
    const pricing = await Pricing.find({ deleted: false })
      .select("MRP");

    res.status(200).json(pricing);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete
const deletePricing = async (req, res) => {
  try {
    const { id } = req.params;

    const pricing = await Pricing.findById(id);

    if (!pricing || pricing.deleted) {
      return res.status(404).json({ message: "Pricing not found" });
    }

    if (pricing.products.length > 0) {
      return res.status(400).json({
        message: "Cannot delete pricing slot with assigned products"
      });
    }

    pricing.deleted = true;
    pricing.deletedBy = req.user.username;
    pricing.deletedAt = new Date();

    await pricing.save();

    res.status(200).json({
      message: "Pricing slot deleted"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {createPricing, getAllPricing, getPricingMRPDrop, deletePricing}