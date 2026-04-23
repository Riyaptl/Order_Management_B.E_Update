const Announcement = require("../models/Announcement");

const createAnnouncement = async (req, res) => {
  try {
    const { remarks } = req.body;
   
    await Announcement.create(
      {remarks, createdBy: req.user.username, createdAt: Date.now()}
    );

    res.status(200).json("message", "Announcement is created");
  } catch (error) {
    res.status(500).json(error.message);
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const { remarks } = req.body;
    const { id } = req.params;

    const announcement = await Announcement.findByIdAndUpdate(
      id,
      {
        remarks,
        updatedBy: req.user.username,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!announcement) {
      return res.status(404).json("Inventory item not found");
    }

    res.status(200).json("message", "Announcement is updated");
  } catch (error) {
    res.status(500).json(error.message);
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findByIdAndDelete(id);

    if (!announcement) {
      return res.status(404).json("Inventory item not found");
    }

    res.status(200).json("message", "Announcement is deleted");
  } catch (error) {
    res.status(500).json(error.message);
  }
};

const getAnnouncement = async (req, res) => {
  try {
    const data = await Announcement.find({},{"remarks": 1})

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json(error.message);
  }
};


module.exports = {
  createAnnouncement,
  getAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};
