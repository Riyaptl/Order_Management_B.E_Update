const Inventory = require("../models/Inventory");

const createInventory = async (req, res) => {
  try {
    const { name, size } = req.body;
   
    const inventory = await Inventory.create(
      {name, size}
    );

    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json(error.message);
  }
};


const getInventory = async (req, res) => {
  try {
    const data = await Inventory.aggregate([
      {
        $addFields: {
          statusOrder: {
            $switch: {
              branches: [
                { case: { $eq: ["$status", "Out of Stock"] }, then: 1 },
                { case: { $eq: ["$status", "Running Low"] }, then: 2 },
                { case: { $eq: ["$status", "In Stock"] }, then: 3 }
              ],
              default: 4
            }
          }
        }
      },
      { $sort: { statusOrder: 1 } },
      { $project: { statusOrder: 0 } } // hide helper field
    ]);

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status, size, remarks } = req.body;
    const { id } = req.params;

    const inventory = await Inventory.findByIdAndUpdate(
      id,
      {
        status,
        size,
        remarks,
        updatedBy: req.user.username,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!inventory) {
      return res.status(404).json("Inventory item not found");
    }

    res.status(200).json("message", "Inventry status is updated");
  } catch (error) {
    res.status(500).json(error.message);
  }
};

module.exports = {
  createInventory,
  getInventory,
  updateStatus
};
