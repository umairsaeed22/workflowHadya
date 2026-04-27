const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  uploadToEjar
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

module.exports = router;