const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({
        msg: "No token provided"
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded; // VERY IMPORTANT

    next();
  } catch (err) {
    return res.status(401).json({
      msg: "Invalid token"
    });
  }
};