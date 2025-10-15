const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const User = require("../models/userModel");

// ================= REGISTER =================
exports.registerUser = async (req, res) => {
  const { name, email, password, teach, learn } = req.body;
  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      teach: teach || [],
      learn: learn || [],
      avatar: "",
      bio: "",
      social: "",
      isAdmin: false,
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(201).json({
      message: "User registered",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        teach: user.teach,
        learn: user.learn,
        avatar: user.avatar,
        bio: user.bio,
        social: user.social,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
};

// ================= LOGIN =================
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        teach: user.teach,
        learn: user.learn,
        avatar: user.avatar,
        bio: user.bio,
        social: user.social,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Login failed" });
  }
};

// ================= GET USER BY ID =================
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] }, // hide password
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Get User Error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// ================= UPDATE PROFILE =================
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { name, email, bio, social } = req.body;

    user.name = name || user.name;
    user.email = email || user.email;
    user.bio = bio || user.bio;
    user.social = social || user.social;

    await user.save();

    res.json(user);
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ error: "Profile update failed" });
  }
};

// ================= AVATAR UPLOAD =================
exports.uploadAvatar = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const avatarPath = `/uploads/${req.file.filename}`;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // delete old avatar if exists
    if (user.avatar && fs.existsSync(path.join(__dirname, "..", user.avatar))) {
      fs.unlinkSync(path.join(__dirname, "..", user.avatar));
    }

    user.avatar = avatarPath;
    await user.save();

    res.json({ message: "✅ Avatar uploaded!", avatar: avatarPath, user });
  } catch (err) {
    console.error("Upload Avatar Error:", err);
    res.status(500).json({ error: "Failed to upload avatar" });
  }
};

// ================= REMOVE AVATAR =================
exports.removeAvatar = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.avatar && fs.existsSync(path.join(__dirname, "..", user.avatar))) {
      fs.unlinkSync(path.join(__dirname, "..", user.avatar));
    }

    user.avatar = "";
    await user.save();

    res.json({ message: "🗑️ Avatar removed!", user });
  } catch (err) {
    console.error("Remove Avatar Error:", err);
    res.status(500).json({ error: "Failed to remove avatar" });
  }
};

// ================= GET USER SUBJECTS =================
exports.getUserSubjects = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      teachSubjects: user.teach || [],
      learnSubjects: user.learn || [],
    });
  } catch (err) {
    console.error("Get Subjects Error:", err);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
};

// ================= ADD TEACH SUBJECT =================
exports.addTeachSubject = async (req, res) => {
  try {
    const { subjectName } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.teach.includes(subjectName)) {
      user.teach = [...user.teach, subjectName];
      await user.save();
    }

    res.json({ message: "Teach subject added", teachSubjects: user.teach });
  } catch (err) {
    console.error("Add Teach Error:", err);
    res.status(500).json({ error: "Failed to add teach subject" });
  }
};

// ================= REMOVE TEACH SUBJECT =================
exports.removeTeachSubject = async (req, res) => {
  try {
    const { subjectName } = req.params;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.teach = user.teach.filter((s) => s !== subjectName);
    await user.save();

    res.json({ message: "Teach subject removed", teachSubjects: user.teach });
  } catch (err) {
    console.error("Remove Teach Error:", err);
    res.status(500).json({ error: "Failed to remove teach subject" });
  }
};

// ================= ADD LEARN SUBJECT =================
exports.addLearnSubject = async (req, res) => {
  try {
    const { subjectName } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.learn.includes(subjectName)) {
      user.learn = [...user.learn, subjectName];
      await user.save();
    }

    res.json({ message: "Learn subject added", learnSubjects: user.learn });
  } catch (err) {
    console.error("Add Learn Error:", err);
    res.status(500).json({ error: "Failed to add learn subject" });
  }
};

// ================= REMOVE LEARN SUBJECT =================
exports.removeLearnSubject = async (req, res) => {
  try {
    const { subjectName } = req.params;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.learn = user.learn.filter((s) => s !== subjectName);
    await user.save();

    res.json({ message: "Learn subject removed", learnSubjects: user.learn });
  } catch (err) {
    console.error("Remove Learn Error:", err);
    res.status(500).json({ error: "Failed to remove learn subject" });
  }
};
