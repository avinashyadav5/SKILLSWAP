const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const User = require("../models/userModel");

// ✅ Upload avatar
router.post("/avatar/:id", upload.single("avatar"), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // save only filename
    user.avatar = req.file.filename;
    await user.save();

    res.json({
      success: true,
      avatar: `http://localhost:5000/uploads/${req.file.filename}`,
    });
  } catch (err) {
    console.error("Avatar upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

module.exports = router;
