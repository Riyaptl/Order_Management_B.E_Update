const User = require("../models/User");
const Department = require("../models/Department");
const Role = require("../models/Role");
const City = require("../models/City");
const bcrypt = require("bcrypt");
const Area = require("../models/Area");
const crypto = require("crypto");
const mongoose = require("mongoose");

// Find department and role
const findDeptRole = async (department, role) => {
  try {
    const dept_entry = await Department.findOne({ name: department });
    if (!dept_entry) {
      throw new Error("Department not found");
    }

    const role_entry = await Role.findOne({ name: role });
    if (!role_entry) {
      throw new Error("Role not found");
    }

    return { dept_entry, role_entry }; // ✅ correct return
  } catch (error) {
    throw error; // ✅ let controller handle response
  }
};

// Create company user
const createUser = async (req, res) => {
  try {
    let {
      username,
      email,
      password,
      confirmPass,
      contact,
      department,
      role,
      city,
    } = req.body;

    if (!username || !password || !confirmPass || !contact) {
      return res.status(400).json({
        message: "All fields are compulsory",
      });
    }

    username = username.trim();
    password = password.trim();
    confirmPass = confirmPass.trim();
    contact = contact.trim();
    if (email) email = email.trim();
    if (department) department = department.trim();
    if (role) role = role.trim();

    if (password !== confirmPass) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({
        message: "Username already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Find department and role [if passed]
    let dept_entry;
    if (department) {
      dept_entry = await Department.findOne({ name: department });
      if (!dept_entry) {
        return res.status(404).json({ message: "Department not found" });
      }
    }
    let role_entry;
    if (role) {
      role_entry = await Role.findOne({ name: role });
      if (!role_entry) {
        return res.status(404).json({ message: "Role not found" });
      }
    }

    // 🔹 Find cities if passed
    let cityIds = [];
    let cityNames = [];
    if (city && Array.isArray(city) && city.length > 0) {
      const cityDocs = await City.find({
        name: { $in: city.map((c) => c.trim()) },
      }).select("_id name");
      if (cityDocs.length !== city.length) {
        return res
          .status(404)
          .json({ message: "One or more cities not found" });
      }
      cityIds = cityDocs.map((c) => c._id);
      cityNames = cityDocs.map((c) => c.name);
    }

    await User.create({
      username,
      email,
      password: hashedPassword,
      contact,
      createdBy: req.user.username,
      department: dept_entry && dept_entry._id,
      role: role_entry && role_entry._id,
      dept_name: dept_entry && dept_entry.name,
      role_name: role_entry && role_entry.name,
      city: cityIds,
      city_name: cityNames,
    });

    // 🔹 Add user to sales array in each city
    if (cityIds.length > 0) {
      await City.updateMany(
        { _id: { $in: cityIds } },
        { $addToSet: { sales: newUser._id } },
      );
    }

    return res.status(201).json({
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Create User Error:", error);
    res.status(500).json(error.message);
  }
};

// Helper: Check if logged in Sales user has access to given user
const checkUserAccess  = async (reqUser, id) => {
 if (["HR", "Admin"].includes(reqUser.dept_name)) return;
  if (reqUser._id.toString() === id) return;

  const user = await User.findById(reqUser._id).select("subordinates");
  const isInSubordinates = user.subordinates
    .map((s) => s.toString())
    .includes(id);
  if (!isInSubordinates) {
    throw { status: 403, message: "You do not have access to this user" };
  }
};

// Edit company user 
const editUser = async (req, res) => {
  try {
    const { id } = req.params;

    let { password, confirmPass, email, contact } = req.body;

    // 🔹 Find user first
    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await checkUserAccess (req.user, id);

    const updateFields = {};

    if (email) updateFields.email = email.trim();
    if (contact) updateFields.contact = contact.trim();

    // ============================================================
    // 🔹 PASSWORD UPDATE
    // ============================================================

    if (password) {
      if (!confirmPass) {
        return res.status(400).json({ message: "Please confirm your password" });
      }
      if (password.trim() !== confirmPass.trim()) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password.trim(), salt);
    }

    updateFields.updatedBy = req.user.username;

    await User.findByIdAndUpdate(id, { $set: updateFields }, { new: true });

    res.status(200).json({ message: "User updated successfully" });

  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
};

// Helper - assign areas to user and partner
const assignAreasHelper = async (req, user, areasId, areaField, deptName) => {
  // 🔹 Find all areas
  const areaDocs = await Area.find({
    _id: { $in: areasId },
    deleted: false,
  }).select(`_id name city_name ${areaField} lastActivityAt`);

  if (areaDocs.length !== areasId.length) {
    throw { status: 404, message: "One or more areas not found or deleted" };
  }

  // 🔹 Areas must be in user's city
  for (let area of areaDocs) {
    if (!user.city_name.includes(area.city_name)) {
      throw { status: 400, message: `Area ${area.name} is not in user's city` };
    }
  }

  // 🔹 24hr activity threshold
  const activeThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
  for (let area of areaDocs) {
    if (
      area[areaField] &&
      area[areaField] !== "" &&
      area[areaField] !== user.username &&
      area.lastActivityAt &&
      area.lastActivityAt > activeThreshold
    ) {
      throw {
        status: 400,
        message: `Area ${area.name} is actively being used by ${area[areaField]}, cannot reassign within 24hrs of last activity`,
      };
    }
  }

  // 🔹 CLEANUP PHASE
  const existingAreaIds = user.areas.map((a) => a.toString());
  const newAreaIds = areasId.map((a) => a.toString());

  const toRemove = existingAreaIds.filter((a) => !newAreaIds.includes(a));
  const toAdd = areaDocs.filter(
    (a) => !existingAreaIds.includes(a._id.toString()),
  );

  if (toRemove.length > 0) {
    await Area.updateMany(
      { _id: { $in: toRemove } },
      { $set: { [areaField]: "" } },
    );
  }

  // 🔹 Free newly assigned areas from previous owners
  const occupiedAreas = toAdd.filter(
    (a) =>
      a[areaField] && a[areaField] !== "" && a[areaField] !== user.username,
  );
  if (occupiedAreas.length > 0) {
    const previousOwnerUsernames = [
      ...new Set(occupiedAreas.map((a) => a[areaField])),
    ];
    const previousOwners = await User.find({
      username: { $in: previousOwnerUsernames },
      dept_name: deptName,
    }).select("_id username areas areas_name");

    for (let owner of previousOwners) {
      const ownerAreasToRemove = occupiedAreas
        .filter((a) => a[areaField] === owner.username)
        .map((a) => a._id.toString());

      const updatedAreas = owner.areas.filter(
        (a) => !ownerAreasToRemove.includes(a.toString()),
      );
      const updatedAreasName = owner.areas_name.filter(
        (_, i) => !ownerAreasToRemove.includes(owner.areas[i].toString()),
      );

      await User.findByIdAndUpdate(owner._id, {
        $set: { areas: updatedAreas, areas_name: updatedAreasName },
      });
    }
  }

  // 🔹 UPDATE PHASE
  await User.findByIdAndUpdate(user._id, {
    $set: {
      areas: areaDocs.map((a) => a._id),
      areas_name: areaDocs.map((a) => a.name),
      assignedAreaBy: req.user.username,
      assignedAreaAt: new Date(),
    },
  });

  if (toAdd.length > 0) {
    await Area.updateMany(
      { _id: { $in: toAdd.map((a) => a._id) } },
      { $set: { [areaField]: user.username } },
    );
  }
};

// Assign areas to user
const assignAreas = async (req, res) => {
  try {
    const { id } = req.params;
    const { areasId } = req.body;

    if (!areasId || !Array.isArray(areasId) || areasId.length === 0) {
      return res
        .status(400)
        .json({ message: "areasId must be a non-empty array" });
    }

    const user = await User.findById(id).select(
      "username active dept_name city_name areas areas_name",
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.active)
      return res
        .status(400)
        .json({ message: "Cannot assign areas to an inactive user" });
    if (user.dept_name !== "Sales")
      return res.status(400).json({
        message: "Areas can only be assigned to Sales department users",
      });

    await checkUserAccess (req.user, id);
    await assignAreasHelper(req, user, areasId, "sale", "Sales");

    res.status(200).json({ message: "Areas assigned successfully" });
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
};

// Read users
const getUsers = async (req, res) => {
  try {
    // 🔹 Use passed id or fall back to logged in user
    const userId = req.params.id || req.user._id;

    // 🔹 Extract filters from query params
    const { department, role, city } = req.query;

    // 🔹 Find the user and get their subordinates list
    const user = await User.findById(userId).select("subordinates");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.subordinates || user.subordinates.length === 0) {
      return res.status(200).json({ users: [] });
    }

    // 🔹 Build filter query
    const filter = {
      _id: { $in: user.subordinates },
      active: true,
    };

    if (department) {
      filter.dept_name = department.trim();
    }

    if (role) {
      filter.role_name = role.trim();
    }

    if (city) {
      filter.city_name = city.trim();
    }

    // 🔹 Fetch filtered subordinates
    const users = await User.find(filter).select(
      "-password -otp -otpGeneratedAt",
    );

    res.status(200).json({
      total: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign role and department
const setDepartmentRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { department, role } = req.body;

    if (!department || !role) {
      return res
        .status(400)
        .json({ message: "Department and Role are required" });
    }

    // get department and role
    const { dept_entry, role_entry } = await findDeptRole(department, role);

    // make sure role is in department
    if (role_entry.department.toString() !== dept_entry._id.toString()) {
      return res.status(400).json({
        message: "Role does not belong to given department",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        department: dept_entry._id,
        role: role_entry._id,
        dept_name: dept_entry.name,
        role_name: role_entry.name,
        updatedBy: req.user.username,
      },
      { new: true },
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Department and Role assigned successfully",
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// Assign users helper
const getAllAncestors = async (userId) => {
  const ancestors = await User.find({
    subordinates: new mongoose.Types.ObjectId(userId),
  }).select("_id");

  return [...new Set(ancestors.map((a) => a._id.toString()))];
};

// Helper - Assign users checks
const validateAssignment = async (id, usersId, requireOrphans = false) => {
  // 🔹 Prevent self-assignment
  if (usersId.includes(id)) {
    throw { status: 400, message: "User cannot assign themselves" };
  }

  // 🔹 Find new parent
  const parentUser = await User.findById(id);
  if (!parentUser) {
    throw { status: 404, message: "Parent user not found" };
  }

  // 🔹 Find child users
  const childUsers = await User.find({ _id: { $in: usersId } }).select(
    "assignedTo assigned subordinates dept_name role_name username",
  );
  if (childUsers.length !== usersId.length) {
    throw { status: 404, message: "One or more users not found" };
  }

  // 🔹 Orphan check (only for assignOrphans)
  if (requireOrphans) {
    for (let child of childUsers) {
      if (child.assignedTo && child.assignedTo.length > 0) {
        throw {
          status: 400,
          message: `User ${child.username} is not an orphan`,
        };
      }
    }
  }

  // 🔹 Same department check
  for (let child of childUsers) {
    if (child.dept_name !== parentUser.dept_name) {
      throw {
        status: 400,
        message: `User ${child.username} belongs to a different department`,
      };
    }
  }

  // 🔹 Rank ordering
  const parentRole = await Role.findOne({ name: parentUser.role_name });
  if (!parentRole) {
    throw { status: 404, message: "Parent role not found" };
  }

  const parentRank = Number(parentRole.rank);
  const roleNames = childUsers.map((u) => u.role_name);
  const roles = await Role.find({ name: { $in: roleNames } });

  const roleMap = {};
  roles.forEach((r) => {
    roleMap[r.name] = Number(r.rank);
  });

  for (let child of childUsers) {
    const childRank = roleMap[child.role_name];
    if (childRank === undefined) {
      throw {
        status: 404,
        message: `Role not found for user ${child.username}`,
      };
    }
    if (parentRank >= childRank) {
      throw {
        status: 400,
        message: `Parent rank must be higher than child: ${child.username}`,
      };
    }
    if (childRank - parentRank > 1) {
      throw {
        status: 400,
        message: `Cannot assign ${child.username} — parent must be exactly one level above. Use promotion/demotion instead.`,
      };
    }
  }

  // 🔹 Circular assignment check
  const ancestorIds = await getAllAncestors(id);
  for (let childId of usersId) {
    if (ancestorIds.includes(childId.toString())) {
      throw { status: 400, message: "Circular assignment detected" };
    }
  }

  return { parentUser, childUsers, ancestorIds };
};

// Helper - logged in user access check for assigning users
const checkHierarchyAccess = async (reqUser, id, usersId) => {
  if (reqUser.dept_name !== "Sales") return;

  const user = await User.findById(reqUser._id).select("subordinates");
  const subordinateIds = user.subordinates.map((s) => s.toString());

  // Parent must be strictly in subordinates — not themselves
  if (!subordinateIds.includes(id)) {
    throw {
      status: 403,
      message: "You do not have access to this parent user",
    };
  }

  // All children must be in subordinates
  for (let childId of usersId) {
    if (!subordinateIds.includes(childId.toString())) {
      throw {
        status: 403,
        message: "One or more users are not in your hierarchy",
      };
    }
  }
};

// Assign users
const assignUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const { usersId } = req.body;

    if (!usersId || !Array.isArray(usersId) || usersId.length === 0) {
      return res
        .status(400)
        .json({ message: "usersId must be a non-empty array" });
    }

    await checkHierarchyAccess(req.user, id, usersId);

    // Validate checks
    const { childUsers, ancestorIds } = await validateAssignment(id, usersId);

    // ============================================================
    // 🔹 CLEANUP PHASE — remove children from old parents
    // ============================================================

    // Get each child's existing subordinates (their subtree moves with them)
    const allNewSubordinates = [
      ...usersId,
      ...childUsers.flatMap((c) => c.subordinates.map((s) => s.toString())),
    ];
    const uniqueNewSubordinates = [...new Set(allNewSubordinates)];

    // 🔹 For each child being moved, clean up old chains
    for (let child of childUsers) {
      // What to remove: this child + their entire subordinates subtree
      const toRemove = [child._id, ...child.subordinates];

      // Remove child + their subordinates from ANY user who has them
      // Works for both orphans and non-orphans — no assignedTo dependency
      await User.updateMany(
        { subordinates: child._id },
        { $pullAll: { subordinates: toRemove } },
      );

      // Remove child from old parent's assigned (only if not orphan)
      if (child.assignedTo && child.assignedTo.length > 0) {
        await User.findByIdAndUpdate(child.assignedTo[0], {
          $pull: { assigned: child._id },
        });
      }
    }

    // Remove children from their old assignedTo
    await User.updateMany(
      { _id: { $in: usersId } },
      { $set: { assignedTo: [] } },
    );

    // ============================================================
    // 🔹 ADD PHASE — assign to new parent
    // ============================================================

    const allNewAncestorIds = [id, ...ancestorIds];
    const assignedAt = new Date();
    const assignedBy = req.user.username;

    // Update parent → add immediate children
    await User.findByIdAndUpdate(id, {
      $addToSet: { assigned: { $each: usersId } },
      $set: { assignedBy, assignedAt },
    });

    // Update children → set new parent in assignedTo
    await User.updateMany(
      { _id: { $in: usersId } },
      {
        $set: { assignedTo: [id], assignedBy, assignedAt },
      },
    );

    // Bubble up subordinates to new parent and all new ancestors
    await User.updateMany(
      { _id: { $in: allNewAncestorIds } },
      { $addToSet: { subordinates: { $each: uniqueNewSubordinates } } },
    );

    res.status(200).json({ message: "Users assigned successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign users without subordibates transferred
const assignUsersWithoutSub = async (req, res) => {
  try {
    const { id } = req.params; // new parent
    const { usersId } = req.body; // users to move

    if (!usersId || !Array.isArray(usersId) || usersId.length === 0) {
      return res
        .status(400)
        .json({ message: "usersId must be a non-empty array" });
    }

    await checkHierarchyAccess(req.user, id, usersId);

    // Validate checks
    const { childUsers, ancestorIds } = await validateAssignment(id, usersId);

    // ============================================================
    // 🔹 CLEANUP PHASE
    // ============================================================

    for (let child of childUsers) {
      // Remove ONLY child from any user who has them in subordinates
      // Their subordinates stay in old chain
      await User.updateMany(
        { subordinates: child._id },
        { $pull: { subordinates: child._id } },
      );

      // Remove child from old parent's assigned (only if not orphan)
      if (child.assignedTo && child.assignedTo.length > 0) {
        await User.findByIdAndUpdate(child.assignedTo[0], {
          $pull: { assigned: child._id },
        });
      }

      // Orphan child's immediate assigned users
      if (child.assigned && child.assigned.length > 0) {
        await User.updateMany(
          { _id: { $in: child.assigned } },
          { $set: { assignedTo: [] } },
        );
      }
    }

    // 🔹 Clear subordinates, assigned and assignedTo of moved users — they stay behind
    await User.updateMany(
      { _id: { $in: usersId } },
      { $set: { assigned: [], assignedTo: [], subordinates: [] } },
    );

    // ============================================================
    // 🔹 ADD PHASE
    // ============================================================

    const allNewAncestorIds = [id, ...ancestorIds];
    const assignedAt = new Date();
    const assignedBy = req.user.username;

    // Add all users to new parent's assigned
    await User.findByIdAndUpdate(id, {
      $addToSet: { assigned: { $each: usersId } },
      $set: { assignedBy, assignedAt },
    });

    // Set new parent for all moved users
    await User.updateMany(
      { _id: { $in: usersId } },
      {
        $set: { assignedTo: [id], assignedBy, assignedAt },
      },
    );

    // Bubble up ONLY moved users to new parent and all new ancestors
    // NOT their old subordinates — they stayed behind
    await User.updateMany(
      { _id: { $in: allNewAncestorIds } },
      { $addToSet: { subordinates: { $each: usersId } } },
    );

    res.status(200).json({ message: "Users assigned successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign orphans
const assignOrphans = async (req, res) => {
  try {
    const { id } = req.params; // new parent
    const { usersId } = req.body;

    if (!usersId || !Array.isArray(usersId) || usersId.length === 0) {
      return res
        .status(400)
        .json({ message: "usersId must be a non-empty array" });
    }

    await checkHierarchyAccess(req.user, id, usersId);

    // Validate Checks
    const { childUsers, ancestorIds } = await validateAssignment(
      id,
      usersId,
      true,
    );

    // ============================================================
    // 🔹 NO CLEANUP PHASE — orphans have no old parent chain
    // ============================================================

    // Collect each orphan + their entire subordinates subtree
    const allNewSubordinates = [
      ...usersId,
      ...childUsers.flatMap((c) => c.subordinates.map((s) => s.toString())),
    ];
    const uniqueNewSubordinates = [...new Set(allNewSubordinates)];

    // ============================================================
    // 🔹 ADD PHASE
    // ============================================================

    const allNewAncestorIds = [id, ...ancestorIds];
    const assignedAt = new Date();
    const assignedBy = req.user.username;

    // Add orphans to new parent's assigned
    await User.findByIdAndUpdate(id, {
      $addToSet: { assigned: { $each: usersId } },
      $set: { assignedBy, assignedAt },
    });

    // Set new parent for all orphans
    await User.updateMany(
      { _id: { $in: usersId } },
      {
        $set: { assignedTo: [id], assignedBy, assignedAt },
      },
    );

    // Bubble up orphans + their entire subtrees to new parent and all ancestors
    await User.updateMany(
      { _id: { $in: allNewAncestorIds } },
      { $addToSet: { subordinates: { $each: uniqueNewSubordinates } } },
    );

    res.status(200).json({ message: "Orphans assigned successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper: Common role change validations
const validateRoleChange = async (id, role) => {
  // 🔹 Find user
  const user = await User.findById(id).select(
    "assignedTo assigned subordinates role_name dept_name",
  );
  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  // 🔹 Find current role
  const currentRole = await Role.findOne({ name: user.role_name });
  if (!currentRole) {
    throw { status: 404, message: "Current role not found" };
  }

  // 🔹 Find new role in same department
  const newRole = await Role.findOne({
    name: role,
    dept_name: currentRole.dept_name,
  });
  if (!newRole) {
    throw { status: 404, message: "New role not found in same department" };
  }

  const currentRank = Number(currentRole.rank);
  const newRank = Number(newRole.rank);

  // 🔹 Must be exactly 1 level difference
  if (Math.abs(currentRank - newRank) !== 1) {
    throw {
      status: 400,
      message: "Promotion/demotion can only be 1 level at a time",
    };
  }

  return { user, currentRole, newRole, currentRank, newRank };
};

// Promotion
const promoteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ message: "Role is required" });
    }

    const { user, currentRole, newRole, currentRank, newRank } =
      await validateRoleChange(id, role);

    // 🔹 Must be promotion — newRank must be lower number (higher authority)
    if (newRank >= currentRank) {
      return res.status(400).json({
        message: "New role must be higher than current role for promotion",
      });
    }

    // 🔹 Cannot promote rank 1 (top of hierarchy)
    if (currentRank === 1) {
      return res.status(400).json({
        message:
          "User is already at the top of hierarchy, cannot be promoted further",
      });
    }

    // ============================================================
    // 🔹 CLEANUP PHASE
    // ============================================================

    // Remove user + their subordinates from old parent's assigned and subordinates
    if (user.assignedTo && user.assignedTo.length > 0) {
      const toRemove = [user._id, ...user.subordinates];
      await User.findByIdAndUpdate(user.assignedTo[0], {
        $pull: { assigned: user._id },
        $pullAll: { subordinates: toRemove },
      });
    }

    // Orphan immediate assigned users
    if (user.assigned && user.assigned.length > 0) {
      await User.updateMany(
        { _id: { $in: user.assigned } },
        { $set: { assignedTo: [] } },
      );
    }

    // Clear user's assigned and assignedTo — subordinates stay intact
    await User.findByIdAndUpdate(id, {
      $set: { assigned: [], assignedTo: [] },
    });

    // ============================================================
    // 🔹 UPDATE ROLE
    // ============================================================

    await User.findByIdAndUpdate(id, {
      $set: {
        role: newRole._id,
        role_name: newRole.name,
        updatedBy: req.user.username,
      },
    });

    // ============================================================
    // 🔹 FIND NEW PARENT & ADD PHASE
    // No bubble up needed — promoted user already exists in higher ancestors' subordinates
    // Only immediate parent relationship needs to be updated
    // ============================================================

    const parentRoleDoc = await Role.findOne({
      dept_name: currentRole.dept_name,
      rank: newRank - 1,
    });

    if (parentRoleDoc && user.assignedTo && user.assignedTo.length > 0) {
      const newParent = await User.findOne({
        role_name: parentRoleDoc.name,
        subordinates: user.assignedTo[0],
      }).select("_id");

      if (newParent) {
        await User.findByIdAndUpdate(newParent._id, {
          $addToSet: { assigned: id },
          $set: { assignedBy: req.user.username, assignedAt: new Date() },
        });

        await User.findByIdAndUpdate(id, {
          $set: {
            assignedTo: [newParent._id],
            assignedBy: req.user.username,
            assignedAt: new Date(),
          },
        });
      }
    }

    res
      .status(200)
      .json({ message: `User successfully promoted to ${newRole.name}` });
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
};

// Demotion
const demoteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ message: "Role is required" });
    }

    const { user, currentRole, newRole, currentRank, newRank } =
      await validateRoleChange(id, role);

    // 🔹 Must be demotion — newRank must be higher number (lower authority)
    if (newRank <= currentRank) {
      return res.status(400).json({
        message: "New role must be lower than current role for demotion",
      });
    }

    // 🔹 Cannot demote if already at lowest rank in department
    const lowestRole = await Role.findOne({
      dept_name: currentRole.dept_name,
    }).sort({ rank: -1 });
    if (currentRank === Number(lowestRole.rank)) {
      return res.status(400).json({
        message:
          "User is already at the lowest rank, cannot be demoted further",
      });
    }

    // ============================================================
    // 🔹 CLEANUP PHASE
    // ============================================================

    // Remove user from old parent's assigned only
    // User stays in old parent's subordinates (RSM still their boss)
    if (user.assignedTo && user.assignedTo.length > 0) {
      await User.findByIdAndUpdate(user.assignedTo[0], {
        $pull: { assigned: user._id },
      });
    }

    // Orphan immediate assigned users
    if (user.assigned && user.assigned.length > 0) {
      await User.updateMany(
        { _id: { $in: user.assigned } },
        { $set: { assignedTo: [] } },
      );
    }

    // Clear user's assigned, assignedTo and subordinates
    await User.findByIdAndUpdate(id, {
      $set: { assigned: [], assignedTo: [], subordinates: [] },
    });

    // ============================================================
    // 🔹 UPDATE ROLE
    // ============================================================

    await User.findByIdAndUpdate(id, {
      $set: {
        role: newRole._id,
        role_name: newRole.name,
        updatedBy: req.user.username,
      },
    });

    // ============================================================
    // 🔹 NO ADD PHASE — demoted user becomes orphan
    // Stays in RSM's subordinates, waits for manual reassignment
    // ============================================================

    res
      .status(200)
      .json({ message: `User successfully demoted to ${newRole.name}` });
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
};

// User's routes data with subordinates
const getUserAreas = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔹 Sales restriction — passed id must be logged in user or in their subordinates
    if (!["HR", "Admin"].includes(req.user.dept_name)) {
      if (req.user._id.toString() !== id) {
        const reqUser = await User.findById(req.user._id).select(
          "subordinates",
        );
        const isInSubordinates = reqUser.subordinates
          .map((s) => s.toString())
          .includes(id);
        if (!isInSubordinates) {
          return res
            .status(403)
            .json({ message: "You do not have access to this user" });
        }
      }
    }

    const mainUser = await User.findById(id).select("subordinates");
    if (!mainUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const allUserIds = [id, ...mainUser.subordinates.map((s) => s.toString())];

    const users = await User.find({ _id: { $in: allUserIds } })
      .select("username role_name areas partners")
      .populate({
        path: "partners",
        match: { active: true },
        select: "username city_name",
      });

    // 🔹 Collect all unique area ids across all users
    const allAreaIds = [
      ...new Set(users.flatMap((u) => u.areas.map((a) => a.toString()))),
    ];

    // 🔹 Fetch all areas in one query — get name and city_name
    const areaDocs = await Area.find({ _id: { $in: allAreaIds } }).select(
      "_id name city_name",
    );

    // 🔹 Build areaId -> { name, city_name } map
    const areaMap = {};
    areaDocs.forEach((a) => {
      areaMap[a._id.toString()] = {
        name: a.name,
        city_name: a.city_name,
      };
    });

    // 🔹 Build response
    const data = users.map((u) => {
      const routes = {};

      u.areas.forEach((areaId) => {
        const area = areaMap[areaId.toString()];
        if (!area) return;

        if (!routes[area.city_name]) {
          routes[area.city_name] = [];
        }
        routes[area.city_name].push(area.name);
      });

      return {
        username: u.username,
        role: u.role_name,
        routes,
        partners: u.partners.map((p) => ({
          username: p.username,
          city: p.city_name,
        })),
      };
    });

    res.status(200).json({
      total: data.length,
      data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// City updates in user and partner
const updateUserCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { city } = req.body;

    if (!city || !Array.isArray(city) || city.length === 0) {
      return res.status(400).json({ message: "city must be a non-empty array" });
    }

    // 🔹 Find user/partner
    const user = await User.findById(id).select("username dept_name city city_name areas areas_name partners companyPersonal");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔹 Determine type
    const isSales = user.dept_name === "Sales";
    const isPartner = user.dept_name === "Partners";

    if (!isSales && !isPartner) {
      return res.status(400).json({ message: "City update only allowed for Sales and Partners department users" });
    }

    // 🔹 Access check
    if (isSales) await checkHierarchyAccess (req.user, id);
    if (isPartner) await checkPartnerAccess(req.user, user);

    // 🔹 Look up all new cities
    const newCityDocs = await City.find({
      name: { $in: city.map(c => c.trim()) }
    }).select("_id name");

    if (newCityDocs.length !== city.length) {
      return res.status(404).json({ message: "One or more cities not found" });
    }

    const existingCityIds = user.city.map(c => c.toString());
    const newCityIds = newCityDocs.map(c => c._id.toString());

    // 🔹 Cities to remove — in old but not in new
    const toRemoveIds = existingCityIds.filter(c => !newCityIds.includes(c));

    // 🔹 Cities to add — in new but not in old
    const toAddDocs = newCityDocs.filter(c => !existingCityIds.includes(c._id.toString()));

    // ============================================================
    // 🔹 CLEANUP FOR REMOVED CITIES
    // ============================================================

    if (toRemoveIds.length > 0) {
      const removedCityDocs = await City.find({ _id: { $in: toRemoveIds } }).select("_id name");
      const removedCityNames = removedCityDocs.map(c => c.name);

      // 🔹 Remaining city names after removal
      const remainingCityNames = user.city_name.filter(c => !removedCityNames.includes(c));

      // 🔹 Find and clear areas in removed cities
      const areasToRemove = await Area.find({
        _id: { $in: user.areas },
        city_name: { $in: removedCityNames }
      }).select("_id name");

      if (areasToRemove.length > 0) {
        const areaIdsToRemove = areasToRemove.map(a => a._id.toString());
        const areaNamesToRemove = areasToRemove.map(a => a.name);

        // 🔹 Clear sale/partner field in removed areas
        await Area.updateMany(
          { _id: { $in: areaIdsToRemove } },
          { $set: { [isSales ? "sale" : "partner"]: "" } }
        );

        // 🔹 Remove areas from user in memory
        user.areas = user.areas.filter(a => !areaIdsToRemove.includes(a.toString()));
        user.areas_name = user.areas_name.filter(n => !areaNamesToRemove.includes(n));
      }

      if (isSales) {
        // 🔹 Remove partners with no remaining common city
        if (user.partners && user.partners.length > 0) {
          const partnerDocs = await User.find({
            _id: { $in: user.partners }
          }).select("_id city_name");

          const partnersToRemove = partnerDocs.filter(p =>
            !p.city_name.some(c => remainingCityNames.includes(c))
          );

          if (partnersToRemove.length > 0) {
            const partnerIdsToRemove = partnersToRemove.map(p => p._id);

            // 🔹 Remove user from partner's companyPersonal
            await User.updateMany(
              { _id: { $in: partnerIdsToRemove } },
              { $pull: { companyPersonal: user._id } }
            );

            // 🔹 Remove partners from user in memory
            user.partners = user.partners.filter(
              p => !partnerIdsToRemove.map(i => i.toString()).includes(p.toString())
            );
          }
        }
      }

      if (isPartner) {
        // 🔹 Remove companyPersonal users with no remaining common city
        if (user.companyPersonal && user.companyPersonal.length > 0) {
          const companyDocs = await User.find({
            _id: { $in: user.companyPersonal }
          }).select("_id city_name");

          const usersToRemove = companyDocs.filter(u =>
            !u.city_name.some(c => remainingCityNames.includes(c))
          );

          if (usersToRemove.length > 0) {
            const userIdsToRemove = usersToRemove.map(u => u._id);

            // 🔹 Remove partner from user's partners array
            await User.updateMany(
              { _id: { $in: userIdsToRemove } },
              { $pull: { partners: user._id } }
            );

            // 🔹 Remove users from partner's companyPersonal in memory
            user.companyPersonal = user.companyPersonal.filter(
              u => !userIdsToRemove.map(i => i.toString()).includes(u.toString())
            );
          }
        }
      }

      // 🔹 Remove user from old cities' sales/partners array
      await City.updateMany(
        { _id: { $in: toRemoveIds } },
        { $pull: { [isSales ? "sales" : "partners"]: user._id } }
      );
    }

    // ============================================================
    // 🔹 ADD NEW CITIES
    // ============================================================

    if (toAddDocs.length > 0) {
      await City.updateMany(
        { _id: { $in: toAddDocs.map(c => c._id) } },
        { $addToSet: { [isSales ? "sales" : "partners"]: user._id } }
      );
    }

    // ============================================================
    // 🔹 SAVE ALL UPDATES
    // ============================================================

    const finalUpdate = {
      city: newCityDocs.map(c => c._id),
      city_name: newCityDocs.map(c => c.name),
      areas: user.areas,
      areas_name: user.areas_name,
      updatedBy: req.user.username
    };

    if (isSales) finalUpdate.partners = user.partners;
    if (isPartner) finalUpdate.companyPersonal = user.companyPersonal;

    await User.findByIdAndUpdate(id, { $set: finalUpdate });

    res.status(200).json({ message: "City updated successfully" });

  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
};

// Create Partner
const createPartner = async (req, res) => {
  try {
    const {
      username,
      email,
      gst,
      password,
      confirmPass,
      city,
      address,
      contact,
      name,
      role,
      userId,
    } = req.body;

    // 🔹 All fields required check
    if (
      !username ||
      !email ||
      !gst ||
      !password ||
      !confirmPass ||
      !city ||
      !address ||
      !contact ||
      !name ||
      !role ||
      !userId
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 🔹 Password match
    if (password !== confirmPass) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // 🔹 Check username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // 🔹 Find the user to link partner with
    const linkUser = await User.findById(userId).select(
      "_id subordinates dept_name partners",
    );
    if (!linkUser) {
      return res.status(404).json({ message: "User to link not found" });
    }

    // 🔹 Look up cities
    const cityDocs = await City.find({
      name: { $in: city.map((c) => c.trim()) },
    }).select("_id name");
    if (cityDocs.length !== city.length) {
      return res.status(404).json({ message: "One or more cities not found" });
    }

    // 🔹 Sales restriction — userId must be in logged in user's subordinates
    if (!["HR", "Admin"].includes(req.user.dept_name)) {
      const reqUser = await User.findById(req.user._id).select("subordinates");
      const isInSubordinates = reqUser.subordinates
        .map((s) => s.toString())
        .includes(userId);
      if (!isInSubordinates) {
        return res.status(403).json({
          message: "You can only link partners to users within your hierarchy",
        });
      }
    }

    // 🔹 Find department and role
    const { dept_entry, role_entry } = await findDeptRole(
      "Partners",
      role.trim(),
    );

    // 🔹 Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 🔹 Create partner user
    const firmName = username;
    const partnerName = name;
    const newPartner = await User.create({
      username: partnerName,
      email,
      gst,
      password: hashedPassword,
      city: cityDocs.map((c) => c._id),
      city_name: cityDocs.map((c) => c.name), // city strings stored in city_name array
      address,
      contact,
      name: firmName,
      role: role_entry._id,
      role_name: role_entry.name,
      department: dept_entry._id,
      dept_name: dept_entry.name,
      companyPersonal: [userId],
      createdBy: req.user?.username || "system",
      active: true,
    });

    // 🔹 Add partner to userId user's partners array
    await User.findByIdAndUpdate(userId, {
      $addToSet: { partners: newPartner._id },
    });

    // 🔹 Add partner to partners array in each city
    if (cityDocs.length > 0) {
      await City.updateMany(
        { _id: { $in: cityDocs.map((c) => c._id) } },
        { $addToSet: { partners: newPartner._id } },
      );
    }

    res.status(201).json({ message: "Partner created successfully" });
  } catch (error) {
    if (
      error.message === "Department not found" ||
      error.message === "Role not found"
    ) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Read distributors
const getPartner = async (req, res) => {
  try {
    const { city, role } = req.query;

    // 🔹 Base query — Partners department only
    let query = { dept_name: "Partners", active: true };

    // 🔹 Role filter
    if (role) {
      query.role_name = role.trim();
    }

    // 🔹 City filter
    if (city) {
      query.city_name = city.trim();
    }

    // 🔹 Sales restriction — show only partners linked to logged in user or their subordinates
    if (!["HR", "Admin"].includes(req.user.dept_name)) {
      const reqUser = await User.findById(req.user._id).select("subordinates");
      const relevantUserIds = [req.user._id, ...reqUser.subordinates];
      query.companyPersonal = { $in: relevantUserIds };
    }

    const partners = await User.find(query)
      .select("-password -otp -otpGeneratedAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      total: partners.length,
      partners,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper: Sales team partner access check
const checkPartnerAccess = async (reqUser, partner) => {
  if (reqUser.dept_name !== "Sales") return; // no restriction for non-Sales

  const user = await User.findById(reqUser._id).select("subordinates");
  const relevantUserIds = [
    reqUser._id.toString(),
    ...user.subordinates.map((s) => s.toString()),
  ];
  const isLinked = partner.companyPersonal.some((cp) =>
    relevantUserIds.includes(cp.toString()),
  );

  if (!isLinked) {
    throw { status: 403, message: "You do not have access to this partner" };
  }
};

// Edit partner 
const editPartner = async (req, res) => {
  try {
    const { id } = req.params;

    let { name, password, confirmPass, email, gst, address, contact } = req.body;

    // 🔹 Find partner first
    const partner = await User.findOne({ _id: id, dept_name: "Partners" });
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    await checkPartnerAccess(req.user, partner);

    const updateFields = {};

    if (name) updateFields.name = name.trim();
    if (email) updateFields.email = email.trim();
    if (gst) updateFields.gst = gst.trim();
    if (address) updateFields.address = address.trim();
    if (contact) updateFields.contact = contact.trim();

    // ============================================================
    // 🔹 PASSWORD UPDATE
    // ============================================================

    if (password) {
      if (!confirmPass) {
        return res.status(400).json({ message: "Please confirm your password" });
      }
      if (password.trim() !== confirmPass.trim()) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password.trim(), salt);
    }

    updateFields.updatedBy = req.user.username;

    await User.findByIdAndUpdate(id, { $set: updateFields }, { new: true });

    res.status(200).json({ message: "Partner updated successfully" });

  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
};

// Assign areas to partner
const assignAreasToPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { areasId } = req.body;

    if (!areasId || !Array.isArray(areasId) || areasId.length === 0) {
      return res
        .status(400)
        .json({ message: "areasId must be a non-empty array" });
    }

    const partner = await User.findById(id).select(
      "username active dept_name city_name areas areas_name",
    );
    if (!partner) return res.status(404).json({ message: "Partner not found" });
    if (!partner.active)
      return res
        .status(400)
        .json({ message: "Cannot assign areas to an inactive partner" });
    if (partner.dept_name !== "Partners")
      return res
        .status(400)
        .json({ message: "Use assignAreas for Sales department users" });

    await checkPartnerAccess(req.user, partner);
    await assignAreasHelper(req, partner, areasId, "partner", "Partners");

    res.status(200).json({ message: "Areas assigned to partner successfully" });
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
};

// Status partner
const statusPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    // 🔹 Validate boolean
    if (typeof active !== "boolean") {
      return res
        .status(400)
        .json({ message: "`active` must be true or false" });
    }

    // 🔹 Find partner
    const partner = await User.findOne({ _id: id, dept_name: "Partners" });
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    await checkPartnerAccess(req.user, partner);

    // ============================================================
    // 🔹 IF DEACTIVATING
    // ============================================================
    if (active === false) {
      // 🔹 Free areas — remove partner username from area's partner field
      if (partner.areas && partner.areas.length > 0) {
        await Area.updateMany(
          { _id: { $in: partner.areas } },
          { $set: { partner: "" } },
        );
      }

      // 🔹 Free cities — remove partner from city's partners array
      if (partner.city && partner.city.length > 0) {
        await City.updateMany(
          { _id: { $in: partner.city } },
          { $pull: { partners: partner._id } },
        );
      }

      // 🔹 Free companyPersonal users — remove partner from their partners array
      if (partner.companyPersonal && partner.companyPersonal.length > 0) {
        await User.updateMany(
          { _id: { $in: partner.companyPersonal } },
          { $pull: { partners: partner._id } },
        );
      }

      // 🔹 Clear partner's city, areas and companyPersonal
      partner.city = [];
      partner.city_name = [];
      partner.areas = [];
      partner.areas_name = [];
      partner.companyPersonal = [];

      // 🔹 Set random hashed password
      const randomPassword = crypto.randomBytes(32).toString("hex");
      partner.password = await bcrypt.hash(randomPassword, 10);
    }

    // 🔹 Update active status
    partner.active = active;
    await partner.save();

    res.status(200).json({
      message: `Partner ${active ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
};

// Assign partner
const partnerAssignment = async (req, res) => {
  try {
    const { id } = req.params; // partner id
    const { usersId } = req.body;

    if (!usersId || !Array.isArray(usersId) || usersId.length === 0) {
      return res
        .status(400)
        .json({ message: "usersId must be a non-empty array" });
    }

    // 🔹 Find partner
    const partner = await User.findOne({
      _id: id,
      dept_name: "Partners",
    }).select("_id companyPersonal city_name active");
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    // 🔹 Partner must be active
    if (!partner.active) {
      return res
        .status(400)
        .json({ message: "Cannot assign users to an inactive partner" });
    }

    // 🔹 Sales restriction
    await checkPartnerAccess(req.user, partner);

    // 🔹 Find all users to assign
    const users = await User.find({ _id: { $in: usersId } }).select(
      "_id dept_name city_name partners subordinates",
    );
    if (users.length !== usersId.length) {
      return res.status(404).json({ message: "One or more users not found" });
    }

    // 🔹 All users must be from Sales department
    for (let user of users) {
      if (user.dept_name !== "Sales") {
        return res
          .status(400)
          .json({ message: `User ${user._id} is not from Sales department` });
      }
    }

    // 🔹 Sales restriction — all usersId must be in logged in user's subordinates
   if (!["HR", "Admin"].includes(req.user.dept_name)) {
      const reqUser = await User.findById(req.user._id).select("subordinates");
      const subordinateIds = reqUser.subordinates.map((s) => s.toString());
      for (let user of users) {
        if (!subordinateIds.includes(user._id.toString())) {
          return res
            .status(403)
            .json({ message: `User ${user._id} is not in your hierarchy` });
        }
      }
    }

    // 🔹 All users must share at least one city with partner
    for (let user of users) {
      const hasCommonCity = user.city_name.some((c) =>
        partner.city_name.includes(c),
      );
      if (!hasCommonCity) {
        return res.status(400).json({
          message: `User ${user._id} does not share a city with this partner`,
        });
      }
    }

    // ============================================================
    // 🔹 UPDATE PHASE
    // ============================================================

    const existingCompanyPersonal = partner.companyPersonal.map((c) =>
      c.toString(),
    );
    const newUsersId = usersId.map((u) => u.toString());

    // Users to remove — in old list but not in new list
    const toRemove = existingCompanyPersonal.filter(
      (u) => !newUsersId.includes(u),
    );

    // Users to add — in new list but not in old list
    const toAdd = newUsersId.filter(
      (u) => !existingCompanyPersonal.includes(u),
    );

    // 🔹 Remove partner from old users' partners array
    if (toRemove.length > 0) {
      await User.updateMany(
        { _id: { $in: toRemove } },
        {
          $pull: { partners: partner._id },
          $set: {
            assignedPartnerBy: req.user.username,
            assignedPartnerAt: Date.now(),
          },
        },
      );
    }

    // 🔹 Add partner to new users' partners array
    if (toAdd.length > 0) {
      await User.updateMany(
        { _id: { $in: toAdd } },
        {
          $addToSet: { partners: partner._id },
          $set: {
            assignedPartnerBy: req.user.username,
            assignedPartnerAt: Date.now(),
          },
        },
      );
    }

    // 🔹 Override partner's companyPersonal
    await User.findByIdAndUpdate(id, {
      $set: {
        companyPersonal: usersId,
        assignedPartnerBy: req.user.username,
        assignedPartnerAt: Date.now(),
      },
    });

    res
      .status(200)
      .json({ message: "Partner assignment updated successfully" });
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
};

// Get sales users
const getUsersDrop = async (req, res) => {
  try {
    const { role } = req.body;

    let query = { active: true };

    if (role) {
      query["role_name"] = role;
    }

    // 🔹 Sales restriction — only show subordinates
    if (!["HR", "Admin"].includes(req.user.dept_name)) {
      const reqUser = await User.findById(req.user._id).select("subordinates");
      query._id = { $in: reqUser.subordinates };
    }

    const users = await User.find(query).select("_id username");

    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  getUsersDrop,
  createUser,
  editUser,
  assignAreas,
  getUsers,
  setDepartmentRole,
  assignUsers,
  assignUsersWithoutSub,
  assignOrphans,
  promoteUser,
  demoteUser,
  createPartner,
  editPartner,
  assignAreasToPartner,
  getPartner,
  statusPartner,
  partnerAssignment,
  getUserAreas,
  updateUserCity
};
