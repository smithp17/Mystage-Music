require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const admin = require("firebase-admin");
const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Load Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, "firebaseAdminKey.json");
if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ Firebase Admin Key is missing! Please add firebaseAdminKey.json to the backend folder.");
  process.exit(1);
}
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "mystage-music.appspot.com", // Can be updated for cloud storage
});

// ✅ PostgreSQL Connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASS), // Ensure password is a string
  port: process.env.DB_PORT,
});

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve uploaded images

// ✅ Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ Multer Storage for Profile Picture Uploads (Local Storage)
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// 📌 **Middleware: Validate Firebase Token**
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ error: "Unauthorized: No token provided" });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Firebase Auth Error:", error);
    res.status(403).json({ error: "Unauthorized: Invalid token" });
  }
};

// 📌 **POST /api/profile - Create User Profile**
app.post("/api/profile", verifyToken, upload.single("profilePic"), async (req, res) => {
  const { uid: firebase_uid } = req.user; // Ensure correct user ID
  const profilePicUrl = req.file ? `/uploads/${req.file.filename}` : null;

  if (!profilePicUrl) return res.status(400).json({ error: "Profile picture is required" });

  try {
    const result = await pool.query(
      `INSERT INTO user_profiles (firebase_uid, profile_pic_url) 
       VALUES ($1, $2) 
       ON CONFLICT (firebase_uid) 
       DO UPDATE SET profile_pic_url = EXCLUDED.profile_pic_url 
       RETURNING *`,
      [firebase_uid, profilePicUrl]
    );

    res.json({ message: "Profile created successfully", user: result.rows[0] });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 📌 **GET /api/profile - Retrieve User Profile**
app.get("/api/profile", verifyToken, async (req, res) => {
  const { uid: firebase_uid } = req.user;

  try {
    const result = await pool.query(
      `SELECT * FROM user_profiles WHERE firebase_uid = $1`,
      [firebase_uid]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 📌 **PUT /api/profile - Update Profile Picture**
app.put("/api/profile", verifyToken, upload.single("profilePic"), async (req, res) => {
  const { uid: firebase_uid } = req.user;
  const profilePicUrl = req.file ? `/uploads/${req.file.filename}` : null;

  if (!profilePicUrl) return res.status(400).json({ error: "New profile picture is required" });

  try {
    const result = await pool.query(
      `UPDATE user_profiles SET profile_pic_url = $1 WHERE firebase_uid = $2 RETURNING *`,
      [profilePicUrl, firebase_uid]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });

    res.json({ message: "Profile updated successfully", user: result.rows[0] });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 📌 **DELETE /api/profile - Delete User Profile**
app.delete("/api/profile", verifyToken, async (req, res) => {
  const { uid: firebase_uid } = req.user;

  try {
    const result = await pool.query(
      `DELETE FROM user_profiles WHERE firebase_uid = $1 RETURNING *`,
      [firebase_uid]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });

    res.json({ message: "Profile deleted successfully" });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
