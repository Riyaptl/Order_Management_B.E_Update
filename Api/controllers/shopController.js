const Shop = require("../models/Shop");
const Area = require("../models/Area");
const Order = require("../models/Order");
const { Parser } = require("json2csv");
const { ObjectId } = require("mongodb");
const fs = require('fs');
const fsPromises = fs.promises;
const csv = require('csv-parser');
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

// 1. Create Shop
const createShop = async (req, res) => {
  try {
    const { name, handler, address, contactNumber, addressLink, areaId } = req.body;
  
    const shop = new Shop({ name, handler, address, contactNumber, addressLink, createdBy: req.user.username});
    const area = await Area.findOneAndUpdate({_id: areaId, deleted: { $in: [false, null] }}, { $push: { shops: shop._id } }, {new: true});
    if (!area) return res.status(404).json("Area not found");

    shop.area = areaId,
    shop.areaName = area.name
    shop.city = area.city
    shop.cityName = area.city_name
    await shop.save();
    res.status(201).json({message: "Shop created successfully"});
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// Check shop access through city
const checkShopAccess = async (reqUser, shopId) => {
  if (["HR", "Admin"].includes(reqUser.dept_name)) return;

  const shop = await Shop.findOne({_id: shopId, deleted: {$in: [null, false]}}).select("city");
  if (!shop) {
    throw { status: 404, message: "Shop not found" };
  }

  const user = await User.findById(reqUser._id).select("city subordinates");
  const allUserIds = [reqUser._id, ...user.subordinates];

  const cityAssigned = await User.findOne({
    _id: { $in: allUserIds },
    city: shop.city
  });

  if (!cityAssigned) {
    throw { status: 403, message: "You do not have access to this shop" };
  }

  return shop; // return shop so controller doesn't need to fetch it again
};

// 2. Update Shop (only passed fields)
const updateShop = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};

    const allowedFields = ["name", "address", "contactNumber", "addressLink", "handler"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const shop = await checkShopAccess(req.user, id);

    Object.assign(shop, updates);
    shop.updatedBy = req.user.username;
    await shop.save();

    res.status(200).json(shop);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 3. Delete Shop
const deleteShop = async (req, res) => {
  try {
    const { id, areaId } = req.body;

    const shop = await checkShopAccess(req.user, id);

    const area = await Area.findOneAndUpdate({_id: areaId, deleted: { $in: [false, null] }}, { $pull: { shops: id } }, {new: true});
    if (!area) return res.status(404).json("Area not found");

    // deletedShop.area = area.id
    // deletedShop.areaName = area.name
    shop.deleted = true 
    shop.deletedBy = req.user.username
    shop.deletedAt = Date.now()
    await shop.save()
 
    res.status(200).json({"message": "Shop deleted and removed from respective route"});
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// Blacklist Shop
const blacklistShop = async (req, res) => {
  try {
    const { id } = req.body;
    const shop = await checkShopAccess(req.user, id);
    if (shop.blacklisted) return res.status(404).json({message: "Shop is already blacklisted"})

    shop.blacklisted = true 
    shop.blacklistedBy = req.user.username
    shop.blacklistedAt = Date.now()
    await shop.save()

    res.status(200).json({"message": "Shop blacklisted successfully."});
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// Change area 
const shiftArea = async (req, res) => {
  try {
    const { prevAreaId, newAreaId, ids } = req.body;

    if (!prevAreaId || !newAreaId || !ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "prevAreaId, newAreaId and ids are required" });
    }

    // 🔹 Find both areas
    const prevArea = await Area.findOne({ _id: prevAreaId, deleted: { $in: [false, null] } });
    if (!prevArea) return res.status(404).json({ message: "Previous area not found" });

    const newArea = await Area.findOne({ _id: newAreaId, deleted: { $in: [false, null] } });
    if (!newArea) return res.status(404).json({ message: "New area not found" });

    // 🔹 Check access for both areas' cities
    await checkCityAccess(req.user, prevArea.city);
    await checkCityAccess(req.user, newArea.city);

    const areaShiftedAt = new Date();
    const areaShiftedBy = req.user.username;
    const newAreaObjId = new ObjectId(newAreaId);

    // 🔹 Process all shops
    await Promise.all(ids.map(async (id) => {
      const shopObjId = new ObjectId(id);

      // 🔹 Find shop and update using save()
      const shop = await checkShopAccess(req.user, shopObjId);

      shop.area = newAreaId;
      shop.prevArea = prevAreaId;
      shop.areaName = newArea.name;
      shop.prevAreaName = prevArea.name;
      shop.areaShiftedAt = areaShiftedAt;
      shop.areaShiftedBy = areaShiftedBy;
      shop.updatedBy = areaShiftedBy;
      shop.city = newArea.city
      shop.cityName = newArea.city_name
      await shop.save();

      // 🔹 Update orders
      await Order.updateMany(
        { shopId: id },
        { $set: { areaId: newAreaObjId } }
      );
    }));

    // 🔹 Update areas
    await Area.findByIdAndUpdate(prevAreaId, {
      $pull: { shops: { $in: ids.map(id => new ObjectId(id)) } }
    });

    await Area.findByIdAndUpdate(newAreaId, {
      $push: { shops: { $each: ids.map(id => new ObjectId(id)) } }
    });

    res.status(200).json({ message: "Shops shifted successfully" });

  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
};

// 4. Get shops under a specific area
const getShopsByArea = async (req, res) => {
  try {
    const { areaId, allShops=false, ordered } = req.body;
  
    let query = {area: areaId, deleted: { $in: [false, null] }}
    
    if (!allShops){
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      query.$or = [
        {visitedAt: {$exists: false}},
        {visitedAt: { $lt: twentyFourHoursAgo }}
      ]
    }

    if (ordered) {
       query["orders.0"] = { $exists: true };
    }

    
    const areaShops = await Shop.find(query).sort({createdAt: -1})

    if (!areaShops) return res.status(404).json("Shops not found");

    res.status(200).json({
      shops: areaShops,
    });

   
  } catch (error) {

    res.status(500).json(error.message);
  }
};

// 5. Get shop details
const getShopDetailes = async (req, res) => {
  try {
    const { id } = req.params;

    const shop = await checkShopAccess(req.user, id);

    if (!shop) return res.status(404).json("Shop not found");

    res.status(200).json(shop);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

//  Get shop orders
const getShopOrders = async (req, res) => {
  try {
    const { id } = req.params;

    const shop = await checkShopAccess(req.user, id);
        
    if (shop?.orders?.length > 0) {
      shop.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.status(200).json(shop.orders);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 6. 

// 7. CSV Export
const csvExportShop = async (req, res) => {
  try {
    const { areaId } = req.body;

    if (!areaId) {
      return res.status(400).json({ message: "Area parameter is required" });
    }

    const area = await Area.findOne({_id: areaId, deleted: { $in: [false, null] } })
      .populate({
      path: "shops",
      select: "name address addressLink contactNumber createdBy updatedBy", 
    }).sort({ createdAt: -1 })
    const shops = area.shops

    const formattedShops = shops.map(shop => {
      const row = {
        Name: shop?.name || "",
        Phone: shop?.contactNumber || "",
        Address: shop?.address || "",
        "Previous Route": shop?.prevAreaName || "",
        "Current Route": shop?.areaName || ""
      };
      return row;
    });
  
    const fields = [
      "Name",
      "Phone",
      "Address",
      "Previous Route",
      "Current Route"
    ];
    
    
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(formattedShops);
       
    res.header("Content-Type", "text/csv");
    res.attachment("shops.csv");
    return res.send(csv);

  } catch (error) {
    res.status(500).json(error.message);
  }
};

const csvImportShop = async (req, res) => {
  const { areaId } = req.params;
  const filePath = req.file.path;
  const shopsToInsert = [];

  try {
    const area1 = await Area.findOne({_id: areaId, deleted: { $in: [false, null] } });
    if (!area1) {
      return res.status(404).json({ "message": 'Area not found' });
    }
    
    const areaName = area1.name
    const area = area1._id
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        const name = row.name?.trim();
        const address = row.address?.trim() || '';
        const contactNumber = row.contactNumber?.trim() || '';
        const addressLink = row.addressLink?.trim() || '';

        if (name) {
          shopsToInsert.push({
            name,
            address,
            contactNumber,
            addressLink,
            createdBy: req.user.username,
            area,
            areaName
          });
        }        
      })
      .on('end', async () => {
        if (shopsToInsert.length === 0) {
          await fsPromises.unlink(filePath);
          return res.status(400).json({ "message": 'No valid rows with "name" field found.' });
        }

        const createdShops = await Shop.insertMany(shopsToInsert);
        
        const shopIds = createdShops.map(shop => shop._id);
        area1.shops.push(...shopIds);
        await area1.save();

        await fsPromises.unlink(filePath);

        res.status(200).json({ "message": 'CSV imported successfully' });
      });
  } catch (err) {
    if (fs.existsSync(filePath)) await fsPromises.unlink(filePath);
    res.status(500).json(err.message);
  }
}

const updateShopAreaNames = async (req, res) => {
  const areas = await Area.find({ deleted: {$in: [false, null]} }).select('name shops');

  for (const area of areas) {
    const shopIds = area.shops;
    if (area.name === "Maninagar 1"){
      console.log(shopIds, area.name);
    }
    
    await Shop.updateMany(
      { _id: { $in: shopIds } },
      { $set: { areaName: area.name, area: area._id } }
    );
  }

  console.log("Updated all shops with area names.");
  res.status(201).json('Done')
};

module.exports = {
  createShop,
  updateShop,
  deleteShop,
  getShopsByArea,
  getShopDetailes,
  csvExportShop,
  shiftArea,
  csvImportShop,
  getShopOrders,
  updateShopAreaNames,
  blacklistShop,
};
