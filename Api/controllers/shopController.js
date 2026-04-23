const Shop = require("../models/Shop");
const Area = require("../models/Area");
const Order = require("../models/Order");
const { Parser } = require("json2csv");
const { ObjectId } = require("mongodb");
const fs = require('fs');
const fsPromises = fs.promises;
const csv = require('csv-parser');

// 1. Create Shop
const createShop = async (req, res) => {
  try {
    const { name, handler, address, contactNumber, addressLink, areaId } = req.body;
  
    const shop = new Shop({ name, handler, address, contactNumber, addressLink, createdBy: req.user.username});
    const area = await Area.findOneAndUpdate({_id: areaId, deleted: { $in: [false, null] }}, { $push: { shops: shop._id } }, {new: true});
    if (!area) return res.status(404).json("Area not found");

    shop.area = areaId,
    shop.areaName = area.name
    await shop.save();
    res.status(201).json("Shop created successfully");
  } catch (error) {
    res.status(500).json(error.message);
  }
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
    updates["updatedBy"] = req.user.username
    
    const updatedShop = await Shop.findOneAndUpdate({_id: id, deleted: { $in: [false, null] }}, updates, { new: true });
    if (!updatedShop) return res.status(404).json("Shop not found");

    res.status(200).json(updatedShop);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 3. Delete Shop
const deleteShop = async (req, res) => {
  try {
    const { id, areaId } = req.body;
    const deletedShop = await Shop.findOne({_id: id, deleted: { $in: [false, null] }});
    if (!deletedShop) return res.status(404).json("Shop not found");

    const area = await Area.findOneAndUpdate({_id: areaId, deleted: { $in: [false, null] }}, { $pull: { shops: id } }, {new: true});
    if (!area) return res.status(404).json("Area not found");

    // deletedShop.area = area.id
    // deletedShop.areaName = area.name
    deletedShop.deleted = true 
    deletedShop.deletedBy = req.user.username
    deletedShop.deletedAt = Date.now()
    await deletedShop.save()
 
    res.status(200).json({"message": "Shop deleted and removed from respective route"});
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// Blacklist Shop
const blacklistShop = async (req, res) => {
  try {
    const { id } = req.body;
    const blacklistedShop = await Shop.findOne({_id: id, deleted: { $in: [false, null] }});
    if (!blacklistedShop) return res.status(404).json("Shop not found");
    if (blacklistedShop.blacklisted) return res.status(404).json({message: "Shop is already blacklisted"})

    blacklistedShop.blacklisted = true 
    blacklistedShop.blacklistedBy = req.user.username
    blacklistedShop.blacklistedAt = Date.now()
    await blacklistedShop.save()

    res.status(200).json({"message": "Shop blacklisted successfully."});
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// Survey Shop
const surveyShop = async (req, res) => {
  try {
    const { ids, formattedDate } = req.body; 
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No shop IDs provided" });
    }
    // Fetch all shops
    const shops = await Shop.find({ 
      _id: { $in: ids },
      deleted: { $in: [false, null] }
    });

    for (let shop of shops) {
      if (!shop.survey) shop.survey = [];
      shop.survey.push(formattedDate);
      await shop.save();
    }

    res.status(200).json({ message: `${shops.length} shops updated successfully.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 4. Get shops under a specific area
const getShopsByArea = async (req, res) => {
  try {
    const { areaId, allShops=false, ordered } = req.body;
    
    let query = {area: areaId, deleted: { $in: [false, null] }}
    
    if (!allShops && req.user.role !== "me"){
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

    const shop = await Shop.findOne({_id: id, deleted: { $in: [false, null] }});

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

    const shop = await Shop.findOne({_id: id, deleted: { $in: [false, null] }}, "orders");
    if (!shop) return res.status(404).json("Shop not found");
        
    if (shop?.orders?.length > 0) {
      shop.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.status(200).json(shop.orders);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 6. Change area 
const shiftArea = async (req, res) => {
  try {
    const { prevAreaId, newAreaId, ids } = req.body;

    ids.forEach(async (id) => {
      const shopObjId  = new ObjectId(id);
      
      const prevArea = await Area.findOneAndUpdate({_id: prevAreaId, deleted: { $in: [false, null] }}, { $pull: { shops: shopObjId } }, {new: true});
      if (!prevArea) return res.status(404).json("Area not found");
      
      const newArea = await Area.findOneAndUpdate({_id: newAreaId, deleted: { $in: [false, null] }}, { $push: { shops: shopObjId } }, {new: true});
      if (!newArea) return res.status(404).json("Area not found");
      
      const areaId = new ObjectId(newAreaId);
      await Shop.findOneAndUpdate({_id: shopObjId, deleted: { $in: [false, null] }}, {$set: {area: newAreaId, prevArea: prevAreaId, areaName: newArea.name, prevAreaName: prevArea.name, areaShiftedAt: Date.now(), areaShiftedBy: req.user.username}}, {new: true})
      await Order.updateMany({shopId: id}, { $set: { areaId } });
    })
    
    res.status(200).json({"message": "Shop shifted successfully"});

  } catch (error) {
    res.status(500).json(error.message);
  }
};


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
  surveyShop
};
