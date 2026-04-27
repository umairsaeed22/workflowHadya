const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  message: {
    type: String,
    required: true
  },

  department: {
    type: String,
    enum: [
      "management",
      "operations",
      "legal",
      "finance",
      "leasing",
      "customer_service"
    ],
    required: true
  },

  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contract"
  },

  isRead: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model(
  "Notification",
  NotificationSchema
);