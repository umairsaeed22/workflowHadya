const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  department: { 
    type: String, 
    enum: ["Management", "Legal", "Operations", "Finance", "Admin", "Leasing", "customer_service"], 
    default: "Admin" 
  },

  role: { 
    type: String, 
    enum: ["admin", "manager", "officer"], 
    default: "officer" 
  }
});

module.exports = mongoose.model("User", UserSchema);
