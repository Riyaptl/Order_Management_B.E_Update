const authorizeDepartment = (...departments) => {
  return (req, res, next) => {
    if (!req.user || !req.user.department) {
      return res.status(401).json("Unauthorized: No department info");
    }

    // if department stored as ObjectId → convert to string
    const userDept = req.user.department.toString();

    if (!departments.includes(userDept)) {
      return res.status(403).json("Forbidden: Department access denied");
    }

    next();
  };
};

module.exports = authorizeDepartment;