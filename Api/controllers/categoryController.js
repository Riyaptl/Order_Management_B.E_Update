const Pricing = require("../models/Pricing");
const Category = require("../models/Category");
const Product = require("../models/Poduct");

// Create pricing
const createCategory = async (req, res) => {
  try {
    const { name, rate } = req.body;

    if (!name || !rate) {
      return res.status(400).json({ message: "Category name and rate is required" });
    }

    const existing = await Category.findOne({ name, deleted: false });

    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await Category.create({
      name,
      rate,
      createdBy: req.user.username
    });

    res.status(201).json({
      message: "Category created",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update - name, rate only
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rate } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const category = await Category.findById(id);

    if (!category || category.deleted) {
      return res.status(404).json({ message: "Category not found" });
    }
c
    const duplicate = await Category.findOne({
      name,
      _id: { $ne: id },
      deleted: false
    });

    if (duplicate) {
      return res.status(400).json({ message: "Category name already exists" });
    }

    // update category
    category.name = name;
    if (rate) {
      category.rate = rate;
      await Product.updateMany({_id: {$in: category.products}}, { $set: { rate } })
    }
    category.updatedBy = req.user.username;
    await category.save();

    // 🔥 sync all products
    await Product.updateMany(
      { category: id },
      { category_name: name }
    );

    res.status(200).json({
      message: "Category updated successfully"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Read all
const getAllCategories = async (req, res) => {
  try {
    const { name } = req.query;

    let query = { deleted: false };

    if (name) {
      query.name = name;
    }

    const categories = await Category.find(query)
      .populate({
        path: "products",
        match: { deleted: false },
        select: "name"
      });

    res.status(200).json(categories);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Read dropdown
const getCategoryDrop = async (req, res) => {
  try {
    const categories = await Category.find({deleted: false})
      .select("name");

    res.status(200).json(categories);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get rates of all categories
const getCategoryRates = async (req, res) => {
  try {
    const categories = await Category.find({deleted: false})
      .select("name rate");

    const rates = {};
    categories.forEach(c => {
      rates[c.name] = Number(c.rate);
    });

    res.status(200).json(rates);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete 
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category || category.deleted) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (category.products.length > 0) {
      return res.status(400).json({
        message: "Cannot delete category with assigned products"
      });
    }

    category.deleted = true;
    category.deletedBy = req.user.username;
    category.deletedAt = new Date();

    await category.save();

    res.status(200).json({
      message: "Category deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {createCategory, updateCategory, getAllCategories, getCategoryDrop, deleteCategory, getCategoryRates}