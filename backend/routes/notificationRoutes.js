const router = require("express").Router();
const auth = require("../middleware/authMiddleware");

const {
  getDepartmentNotifications
} = require("../controllers/notificationController");

router.get(
  "/",
  auth,
  getDepartmentNotifications
);

module.exports = router;