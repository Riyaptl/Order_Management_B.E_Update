const Area = require("../models/Area")
const City = require("../models/City")
const { Parser } = require("json2csv");
const Shop = require("../models/Shop");


// 1. Create Area
const createArea = async (req, res) => {
  try {
    const { name, areas, distributor, city } = req.body;
    
    let dist_trimmed = distributor
    if (distributor){
      dist_trimmed = distributor.trim()
    }
    // Check if area with the same name already exists
    const existingArea = await Area.findOne({ name: name.trim(), deleted: { $in: [false, null] } });
    if (existingArea) {
      return res.status(400).json("Area with this name already exists");
    }   

    let query = { name: name.trim(), shops: [], createdBy: req.user.username, areas, distributor:dist_trimmed }
    if (city){
      query.city = city
    }
    const area = new Area(query);

    // add into city
    if (city){
      const cityExists = await City.findOne({_id: city})
      if (!cityExists){
        return res.status(400).json("City doesn't exists");
      }
      cityExists.areas.push(area._id)
      await cityExists.save()
    }

    await area.save();

    res.status(201).json(area);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 2. Update Area Name
const updateAreaName = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, areas, distributor, city } = req.body;
    
    let dist_trimmed = distributor
    if (distributor){
      dist_trimmed = distributor.trim()
    }  
   
    // Check if area with the same name already exists (excluding the current area)
    const existingArea = await Area.findOne({ name: name.trim(), _id: { $ne: id }, deleted: { $in: [false, null] } });
    if (existingArea) {
      return res.status(400).json("Area with this name already exists");
    }

    // get area and city
    const currArea = await Area.findById(id)
    const prevCity = currArea.city 

    // if city exists  
    if (city) {
      const cityExists = await City.findOne({_id: city})
      if (!cityExists){
        return res.status(400).json("City doesn't exists");
      }
    }

    if (name) {
      await Shop.updateMany({area:id}, {$set: {areaName: name}})
      await Shop.updateMany({prevArea:id}, {$set: {prevAreaName: name}})
    }

    let query = { name: name.trim(), areas, distributor: dist_trimmed, updatedBy: req.user.username, updatedAt: Date.now()}
    if (city){
      query.city = city
    }
    const area = await Area.findByIdAndUpdate(id, query , { new: true });
    
    if (prevCity){
      await City.updateOne(
        { _id: prevCity },
        { $pull: { areas: area._id } }
      );
    }
    if (city){
      await City.updateOne(
        { _id: city },
        { $push: { areas: area._id } }
      );

    }
    if (!area) return res.status(404).json("Area not found");

    res.status(200).json({"message": "Route updated successfully"});
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 3. Delete Area (only if no shops)
const deleteArea = async (req, res) => {
  try {
    const { id } = req.params;
    const area = await Area.findOne({_id: id, deleted: { $in: [false, null] }});
    if (!area) return res.status(404).json( "Area not found");

    if (area.shops.length > 0) {
      return res.status(400).json("Cannot delete area with shops");
    }

    // remove from city
    if (area.city){
      const cityExists = await City.findOne({_id: area.city})
      if (!cityExists){
        return res.status(400).json("City doesn't exists");
      }
      cityExists.areas = cityExists.areas.filter(
        id => id.toString() !== area._id.toString()
      );
      await cityExists.save();
      
      
    }
      

    // delete area
    await Area.findByIdAndUpdate(id, {deleted: true, deletedBy: req.user.username, deletedAt: Date.now()});
    
    res.status(200).json( {"message": "Route deleted"} );
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 4. Read All Area Names Only (as array of strings)
const getAllAreas = async (req, res) => {
  try {
    const {dist_username} = req.body
    query = {deleted: { $in: [false, null] } }
    if (dist_username){
      query["distributor"] = dist_username
    }

    const areas = await Area.find(query, 'name');

    res.status(200).json(areas);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 5. Read All Area with Pagination
const getAreas = async (req, res) => {
  try {
    const {dist_username} = req.body
    const page = parseInt(req.query.page) || 1; 
    const limit = 24;
    const skip = (page - 1) * limit;

    const totalCount = await Area.countDocuments({deleted: { $in: [false, null] }});

    let query = {deleted: { $in: [false, null] }}
    if (dist_username){
      query["distributor"] = dist_username
    }
    
    const areas = await Area.find(query).populate('city', 'name _id').sort({ createdAt: -1 }).skip(skip).limit(limit);
    
    res.status(200).json({
      areas,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. CSV Export
const csvExportArea = async (req, res) => {
  try {

    const areas = await Area.find({deleted: { $in: [false, null] }}).sort({ createdAt: -1 })

    const formattedAreas = areas.map(area => {
      const row = {
        Name: area?.name || "",
        Areas: area?.areas || "",
        Distributor: area?.distributor || "",
        "Created By": area?.createdBy || "",
        "Updated By": area?.updatedBy || "",
      };
      return row;
    });

    const fields = [
      "Name",
      "Areas",
      "Distributor",
      "Created By",
      "Updated By",
    ];
    
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(formattedAreas);
       
    res.header("Content-Type", "text/csv");
    res.attachment("routes.csv");
    return res.send(csv);

  } catch (error) {
    res.status(500).json(error.message);
  }
};


module.exports = {
  createArea,
  updateAreaName,
  deleteArea,
  getAllAreas,
  getAreas,
  csvExportArea
};
