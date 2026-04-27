// routes/financeRoutes.js

const express = require("express");
const router = express.Router();

const {
  confirmPaymentAndPOP
} = require("../controllers/financeController");

const authMiddleware = require("../middleware/authMiddleware");

/*
  Finance → Confirm Payment + POP

  REPORTING POINT:
  POP_ISSUED
*/

router.post(
  "/contracts/:id/confirm-payment-pop",
  authMiddleware,
  confirmPaymentAndPOP
);

module.exports = router;