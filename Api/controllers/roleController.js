const Role = require("../models/Role");
const Department = require("../models/Department");

// Create role
const createRole = async (req, res) => {
  try {
    const { name, rank, department } = req.body;
    
     if (!department) {
      return res.status(400).json({ message: "Department is required" });
    }

    const dept = await Department.findOne({ name: department });
    if (!dept) {
      return res.status(404).json({ message: "Department not found" });
    }

    const role = await Role.create({
      name,
      rank,
      department: dept._id,
      dept_name: dept.name,
      createdBy: req.user.username
    });

    await Department.findByIdAndUpdate(
      dept._id,
      { $push: { roles: role._id } },
      { new: true }
    );

    res.status(200).json(role);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// Read roles
const getRole = async (req, res) => {
  try {
    const {department} = req.body
    let query = {}
    if (department){
        query["dept_name"] = department
    }

    const data = await Role.find(query);

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// Update Departent
const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { department } = req.body; // department name

    if (!department) {
      return res.status(400).json({ message: "Department is required" });
    }

    const newDept = await Department.findOne({ name: department });
    if (!newDept) {
      return res.status(404).json({ message: "New Department not found" });
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    const oldDeptId = role.department;
    if (oldDeptId?.toString() === newDept._id.toString()) {
      return res.status(200).json({ message: "Department unchanged", role });
    }

    role.department = newDept._id;
    role.dept_name = newDept.name
    await role.save();

    // Update departments
    if (oldDeptId) {
      await Department.findByIdAndUpdate(
        oldDeptId,
        { $pull: { roles: role._id } }
      );
    }
    await Department.findByIdAndUpdate(
      newDept._id,
      { $addToSet: { roles: role._id } }
    );



    res.status(200).json({
      message: "Department updated successfully",
      role
    });

  } catch (error) {
    res.status(500).json(error.message);
  }
};

module.exports = {
  createRole,
  getRole,
  updateRole,
};
