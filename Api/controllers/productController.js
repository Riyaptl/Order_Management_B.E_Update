const Product = require("../models/Poduct")
const Category = require("../models/Category")
const Pricing = require("../models/Pricing")

// Create product
const createProduct = async (req, res) => {
  try {
    const { name, price, category } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Product name required" });
    }

    const existing = await Product.findOne({ name, deleted: false });
    if (existing) {
      return res.status(400).json({ message: "Product already exists" });
    }

    // 🔍 Find category
    let categoryDoc = null;
    if (category) {
      categoryDoc = await Category.findOne({ name: category, deleted: false });
      if (!categoryDoc) {
        return res.status(404).json({ message: "Category not found" });
      }
    }

    // 🔍 Find pricing slot
    let pricingDoc = null;
    if (price) {
      pricingDoc = await Pricing.findOne({ MRP: price, deleted: false });
      if (!pricingDoc) {
        return res.status(404).json({ message: "Pricing slot not found" });
      }
    }

    // 🧱 Create product
    const product = await Product.create({
      name,
      price: pricingDoc?._id,
      price_MRP: pricingDoc?.MRP,
      category: categoryDoc?._id,
      category_name: categoryDoc?.name,
      rate: categoryDoc.rate,
      createdBy: req.user.username
    });

    // 🔗 Sync category
    if (categoryDoc) {
      await Category.findByIdAndUpdate(categoryDoc._id, {
        $addToSet: { products: product._id }
      });
    }

    // 🔗 Sync pricing
    if (pricingDoc) {
      await Pricing.findByIdAndUpdate(pricingDoc._id, {
        $addToSet: { products: product._id }
      });
    }

    res.status(201).json({
      message: "Product created",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product || product.deleted) {
      return res.status(404).json({ message: "Product not found" });
    }

    // remove from category
    if (product.category) {
      await Category.findByIdAndUpdate(product.category, {
        $pull: { products: id }
      });
    }

    // remove from pricing
    if (product.price) {
      await Pricing.findByIdAndUpdate(product.price, {
        $pull: { products: id }
      });
    }

    product.deleted = true;
    product.deletedBy = req.user.username
    product.deletedAt = new Date();

    await product.save();

    res.status(200).json({
      message: "Product deleted"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Read all
const getAllProducts = async (req, res) => {
  try {
    const {name} = req.body

    let query = { deleted: false }
    if (name) {
      query.name = name
    }
    
    const products = await Product.find(query);

    res.status(200).json(products);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Read - dropdown
const getProductDrop = async (req, res) => {
  try {
    const products = await Product.find({ deleted: false })
      .select("name");

    res.status(200).json(products);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update - set empty cat and pricing slot too
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category } = req.body;

    const product = await Product.findById(id);

    if (!product || product.deleted) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 🧠 STORE OLD VALUES
    const oldCategory = product.category;
    const oldPrice = product.price;

    // ======================
    // NAME UPDATE
    // ======================
    if (name) {
      const duplicate = await Product.findOne({
        name,
        _id: { $ne: id },
        deleted: false
      });

      if (duplicate) {
        return res.status(400).json({ message: "Product name exists" });
      }

      product.name = name;
    }

    // ======================
    // CATEGORY UPDATE / REMOVE
    // ======================
    if (category !== undefined) {

      // REMOVE CATEGORY
      if (category === null || category === "") {
        if (oldCategory) {
          await Category.findByIdAndUpdate(oldCategory, {
            $pull: { products: id }
          });
        }

        product.category = null;
        product.category_name = null;
      }

      // CHANGE CATEGORY
      else {
        const newCategory = await Category.findOne({
          name: category,
          deleted: false
        });

        if (!newCategory) {
          return res.status(404).json({ message: "Category not found" });
        }

        // remove from old
        if (oldCategory && oldCategory.toString() !== newCategory._id.toString()) {
          await Category.findByIdAndUpdate(oldCategory, {
            $pull: { products: id }
          });
        }

        // add to new
        await Category.findByIdAndUpdate(newCategory._id, {
          $addToSet: { products: id }
        });

        product.category = newCategory._id;
        product.category_name = newCategory.name;
      }
    }

    // ======================
    // PRICING UPDATE / REMOVE
    // ======================
    if (price !== undefined) {

      // REMOVE PRICE
      if (price === null || price === "") {
        if (oldPrice) {
          await Pricing.findByIdAndUpdate(oldPrice, {
            $pull: { products: id }
          });
        }

        product.price = null;
        product.price_MRP = null;
      }

      // CHANGE PRICE SLOT
      else {
        const newPricing = await Pricing.findOne({
          MRP: price,
          deleted: false
        });

        if (!newPricing) {
          return res.status(404).json({ message: "Pricing slot not found" });
        }

        // remove from old
        if (oldPrice && oldPrice.toString() !== newPricing._id.toString()) {
          await Pricing.findByIdAndUpdate(oldPrice, {
            $pull: { products: id }
          });
        }

        // add to new
        await Pricing.findByIdAndUpdate(newPricing._id, {
          $addToSet: { products: id }
        });

        product.price = newPricing._id;
        product.price_MRP = newPricing.MRP;
      }
    }

    product.updatedBy = req.user.username

    await product.save();

    res.status(200).json({
      message: "Product updated"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductDrop,
  updateProduct
}