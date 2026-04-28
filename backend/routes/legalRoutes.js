// routes/legalRoutes.js

const express = require("express");
const router = express.Router();

const authMiddleware =
  require("../middleware/authMiddleware");

const {
  sendLegalConfirmationEmail
} = require("../controllers/legalController");

/*
  LEGAL:
  Send confirmation email after
  standard court case is filed
*/

router.post(
  "/contracts/:id/legal-confirmation-email",
  authMiddleware,
  sendLegalConfirmationEmail
);

module.exports = router;