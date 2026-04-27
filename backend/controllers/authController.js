const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { name, email, password, department, role } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "Email already exists" });

    const hash = await bcrypt.hash(password, 10);

    user = await User.create({
      name,
      email,
      password: hash,
      department,
      role,
    });

    res.json({ msg: "User registered", user });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, department: user.department, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
