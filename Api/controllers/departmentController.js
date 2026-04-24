const Department = require("../models/Department");

const createDepartment = async (req, res) => {
  try {
    const { name, rank } = req.body;
   
    const department = await Department.create(
      {name, rank, createdBy: req.user.username}
    );

    res.status(200).json(department);
  } catch (error) {
    res.status(500).json(error.message);
  }
};


const getDepartment = async (req, res) => {
  try {
    const data = await Department.find().select("name");

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json(error.message);
  }
};


module.exports = {
  createDepartment,
  getDepartment
};
