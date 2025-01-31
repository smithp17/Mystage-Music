require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const admin = require("firebase-admin");
const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");
const { PubSub } = require("@google-cloud/pubsub");
const { v4: uuidv4 } = require("uuid");

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
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "mystage-music.appspot.com",
});

// ✅ PostgreSQL Connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASS),
  port: process.env.DB_PORT,
});

// ✅ Set Google Cloud Authentication (Ensure Environment Variable is Set)
const googleCredentialsPath = path.join(__dirname, "service-account.json");
if (!fs.existsSync(googleCredentialsPath)) {
  console.error("❌ Google Cloud Service Account Key is missing! Please add service-account.json to the backend folder.");
  process.exit(1);
}
process.env.GOOGLE_APPLICATION_CREDENTIALS = googleCredentialsPath;

// ✅ Initialize Pub/Sub with Explicit Credentials
const pubsub = new PubSub({
  keyFilename: googleCredentialsPath,
});

const topicName = "image-processing-topic"; // ✅ Pub/Sub Topic

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Multer Storage for Profile Picture Uploads (In-Memory)
const upload = multer({ storage: multer.memoryStorage() });

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

// 📌 **POST /api/profile - Upload Image & Send to Pub/Sub**
app.post("/api/profile", verifyToken, upload.single("profilePic"), async (req, res) => {
  const { uid: firebase_uid } = req.user;
  if (!req.file) return res.status(400).json({ error: "Profile picture is required" });

  const messageData = {
    userId: firebase_uid,
    fileName: `${uuidv4()}-${req.file.originalname}`,
    mimeType: req.file.mimetype,
    imageBuffer: req.file.buffer.toString("base64"),
  };

  try {
    const messageId = await pubsub.topic(topicName).publishMessage({ json: messageData });
    res.status(200).json({ message: "Image uploaded and sent for processing!", messageId });
  } catch (error) {
    console.error("❌ Error publishing message to Pub/Sub:", error);
    res.status(500).json({ error: "Failed to process image" });
  }
});

// 📌 **GET /api/profile - Retrieve User Profile**
app.get("/api/profile", verifyToken, async (req, res) => {
  const { uid: firebase_uid } = req.user;

  try {
    const result = await pool.query(`SELECT * FROM user_profiles WHERE firebase_uid = $1`, [firebase_uid]);

    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 📌 **PUT /api/profile - Update Profile Picture (Sends to Pub/Sub)**
app.put("/api/profile", verifyToken, upload.single("profilePic"), async (req, res) => {
  const { uid: firebase_uid } = req.user;
  if (!req.file) return res.status(400).json({ error: "New profile picture is required" });

  const messageData = {
    userId: firebase_uid,
    fileName: `${uuidv4()}-${req.file.originalname}`,
    mimeType: req.file.mimetype,
    imageBuffer: req.file.buffer.toString("base64"),
  };

  try {
    const messageId = await pubsub.topic(topicName).publishMessage({ json: messageData });
    res.status(200).json({ message: "Profile picture updated and sent for processing!", messageId });
  } catch (error) {
    console.error("❌ Error publishing message to Pub/Sub:", error);
    res.status(500).json({ error: "Failed to process image" });
  }
});

// 📌 **DELETE /api/profile - Delete User Profile**
app.delete("/api/profile", verifyToken, async (req, res) => {
  const { uid: firebase_uid } = req.user;

  try {
    const result = await pool.query(`DELETE FROM user_profiles WHERE firebase_uid = $1 RETURNING *`, [firebase_uid]);

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
