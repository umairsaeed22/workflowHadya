const express = require("express");
const router = express.Router();

const {
  deactivateGuarantee
} = require("../controllers/najizController");

const authMiddleware = require("../middleware/authMiddleware"); // IMPORT

router.post(
  "/contracts/:id/deactivate-guarantee",
  authMiddleware, // ADD THIS
  deactivateGuarantee
);

module.exports = router;