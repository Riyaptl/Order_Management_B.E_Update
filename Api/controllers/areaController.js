const Area = require("../models/Area");
const City = require("../models/City");
const { Parser } = require("json2csv");
const Shop = require("../models/Shop");

const checkCityAccess = async (reqUser, cityId) => {
  if (["HR", "Admin"].includes(reqUser.dept_name)) return;

  const user = await User.findById(reqUser._id).select("allCities");

  const hasAccess = user.allCities.map(c => c.toString()).includes(cityId.toString());

  if (!hasAccess) {
    throw { status: 403, message: "You do not have access to this city" };
  }
};

// 1. Create Area
const createArea = async (req, res) => {
  try {
    const { name, areas, city } = req.body;

    if (!name || !city) {
      return res.status(400).json({ message: "Name and city are required" });
    }

    // 🔹 Check if area with same name already exists
    const existingArea = await Area.findOne({
      name: name.trim(),
      deleted: { $in: [false, null] },
    });
    if (existingArea) {
      return res
        .status(400)
        .json({ message: "Area with this name already exists" });
    }

    // 🔹 Find city
    const cityDoc = await City.findById(city);
    if (!cityDoc) {
      return res.status(404).json({ message: "City not found" });
    }

    // Check city access for Sales department
    await checkCityAccess(req.user, cityDoc._id);

    // 🔹 Create area
    const area = await Area.create({
      name: name.trim(),
      areas: areas || [],
      city: cityDoc._id,
      city_name: cityDoc.name,
      createdBy: req.user.username,
    });

    // 🔹 Add area to city's areas array
    await City.findByIdAndUpdate(city, {
      $addToSet: { areas: area._id },
    });

    res.status(201).json({ message: "Area created successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Update Area
const updateArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, areas } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    // 🔹 Find area
    const area = await Area.findOne({ _id: id, deleted: { $in: [false, null] } });
    if (!area) {
      return res.status(404).json({ message: "Area not found" });
    }

    // 🔹 Sales access check using area's existing city
    await checkCityAccess(req.user, area.city);

    const updateFields = {};
    const nameChanged = name.trim() !== area.name;

    // ============================================================
    // 🔹 NAME CHANGE
    // ============================================================

    if (nameChanged) {
      // 🔹 Check name uniqueness
      const existingArea = await Area.findOne({
        name: name.trim(),
        deleted: { $in: [false, null] },
        _id: { $ne: id }
      });
      if (existingArea) {
        return res.status(400).json({ message: "Area with this name already exists" });
      }
      updateFields.name = name.trim();

      // 🔹 Update sale user's areas_name
      if (area.sale) {
        await User.updateMany(
          { username: area.sale },
          { $set: { "areas_name.$[elem]": name.trim() } },
          { arrayFilters: [{ "elem": area.name }] }
        );
      }

      // 🔹 Update partner user's areas_name
      if (area.partner) {
        await User.updateMany(
          { username: area.partner },
          { $set: { "areas_name.$[elem]": name.trim() } },
          { arrayFilters: [{ "elem": area.name }] }
        );
      }
    }

    // ============================================================
    // 🔹 AREAS FIELD — simple override
    // ============================================================

    if (areas) {
      updateFields.areas = areas;
    }

    // 🔹 No changes detected
    if (Object.keys(updateFields).length === 0) {
      return res.status(200).json({ message: "No changes detected" });
    }

    updateFields.updatedBy = req.user.username;

    await Area.findByIdAndUpdate(id, { $set: updateFields });

    res.status(200).json({ message: "Area updated successfully" });

  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
};

// 3. Delete Area (only if no shops)
const deleteArea = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔹 Find area
    const area = await Area.findOne({ _id: id, deleted: { $in: [false, null] } });
    if (!area) {
      return res.status(404).json({ message: "Area not found" });
    }

    // 🔹 Sales access check
    await checkCityAccess(req.user, area.city);

    // ============================================================
    // 🔹 CLEANUP — free sale and partner assignments
    // ============================================================

    // 🔹 Remove from sale user
    if (area.sale) {
      await User.updateMany(
        { username: area.sale },
        {
          $pull: { areas: area._id },
          $pullAll: { areas_name: [area.name] }
        }
      );
    }

    // 🔹 Remove from partner user
    if (area.partner) {
      await User.updateMany(
        { username: area.partner },
        {
          $pull: { areas: area._id },
          $pullAll: { areas_name: [area.name] }
        }
      );
    }

    // 🔹 Remove from city's areas array
    await City.findByIdAndUpdate(area.city, {
      $pull: { areas: area._id }
    });

    // ============================================================
    // 🔹 SOFT DELETE
    // ============================================================

    await Area.findByIdAndUpdate(id, {
      $set: {
        deleted: true,
        deletedBy: req.user.username,
        deletedAt: new Date()
      }
    });

    res.status(200).json({ message: "Area deleted successfully" });

  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
};

// 4. Read All Area Names Only (as array of strings)
const getAllAreas = async (req, res) => {
  try {
    const { dist_username } = req.body;
    query = { deleted: { $in: [false, null] } };
    if (dist_username) {
      query["distributor"] = dist_username;
    }

    const areas = await Area.find(query, "name");

    res.status(200).json(areas);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 5. Read All Area with Pagination
const getAreas = async (req, res) => {
  try {
    const { city, sale, partner } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = 24;
    const skip = (page - 1) * limit;

    // 🔹 Base query
    let query = { deleted: { $in: [false, null] } };

    // 🔹 Filters
    if (city) query.city_name = city.trim();
    if (sale) query.sale = sale.trim();
    if (partner) query.partner = partner.trim();

    // 🔹 No restriction on HR / Admin
    if (!["HR", "Admin"].includes(req.user.dept_name)) {
      const reqUser = await User.findById(req.user._id).select("subordinates");

      const allUsers = await User.find({
        _id: { $in: [req.user._id, ...reqUser.subordinates] }
      }).select("username");

      const accessibleUsernames = allUsers.map(u => u.username);

      // If sale filter passed, check it's within accessible usernames
      if (sale && !accessibleUsernames.includes(sale.trim())) {
        return res.status(403).json({ message: "You do not have access to this user's areas" });
      }

      query.sale = sale ? sale.trim() : { $in: accessibleUsernames };
    }

    const totalCount = await Area.countDocuments(query);

    const areas = await Area.find(query)
      .select("_id name city_name sale partner areas")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

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

// Areas dropdown - city based
const getAreasDrop = async (req, res) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({ message: "City is required" });
    }

    // 🔹 Find city
    const cityDoc = await City.findOne({ name: city.trim() }).select("_id name");
    if (!cityDoc) {
      return res.status(404).json({ message: "City not found" });
    }

    // 🔹 Check access to passed city
    await checkCityAccess(req.user, cityDoc._id);

    // 🔹 Get areas in city
    const areas = await Area.find({
      city_name: cityDoc.name,
      deleted: { $in: [false, null] }
    }).select("_id name");

    res.status(200).json({ areas });

  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
};

// 4. CSV Export
const csvExportArea = async (req, res) => {
  try {
    const areas = await Area.find({ deleted: { $in: [false, null] } }).sort({
      createdAt: -1,
    });

    const formattedAreas = areas.map((area) => {
      const row = {
        Name: area?.name || "",
        Areas: area?.areas || "",
        Distributor: area?.distributor || "",
        "Created By": area?.createdBy || "",
        "Updated By": area?.updatedBy || "",
      };
      return row;
    });

    const fields = ["Name", "Areas", "Distributor", "Created By", "Updated By"];

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
  updateArea,
  deleteArea,
  getAllAreas,
  getAreas,
  getAreasDrop,
  csvExportArea,
  checkCityAccess
};
