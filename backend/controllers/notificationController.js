// controllers/notificationController.js

const Notification = require("../models/Notification");

exports.getDepartmentNotifications = async (req, res) => {
  try {
    const department = req.user.department.toLowerCase();

    const notifications = await Notification.find({
      department
    }).sort({ createdAt: -1 });

    res.json({
      total: notifications.length,
      notifications
    });

  } catch (err) {
    res.status(500).json({
      msg: err.message
    });
  }
};