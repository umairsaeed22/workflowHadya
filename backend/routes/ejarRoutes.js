const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  uploadToEjar
} = require("../controllers/ejarController");

const {
  uploadToEjarNegativeFlow
} = require("../controllers/ejarController");

const authMiddleware = require("../middleware/authMiddleware"); // IMPORT THIS

const upload = multer({
  dest: "uploads/"
});

router.post(
  "/contracts/:id/upload-ejar",
  authMiddleware, // ADD THIS
  upload.single("hoFile"),
  uploadToEjar
);

/*
  NEGATIVE FLOW
  Leasing -> Upload HO -> Route by Guarantee Matrix
*/

router.post(
  "/contracts/:id/upload-ejar-negative",
  authMiddleware,
  upload.single("hoFile"),
  uploadToEjarNegativeFlow
);

module.exports = router;