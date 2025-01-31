const { Storage } = require("@google-cloud/storage");
const { Pool } = require("pg");
const sharp = require("sharp");

const storage = new Storage();
const bucketName = process.env.BUCKET_NAME;

if (!bucketName) {
  console.error("❌ BUCKET_NAME is not set in environment variables!");
  process.exit(1);
}

// ✅ PostgreSQL Connection
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "1234",
  database: process.env.DB_NAME || "postgres",
  host: process.env.DB_HOST || "34.31.165.150", // ✅ Use Public IP
  port: process.env.DB_PORT || 5432,
});

exports.processProfileImage = async (event, context) => {
  try {
    console.log("🔥 BUCKET_NAME:", bucketName);
    console.log("🔥 Connecting to PostgreSQL at:", process.env.DB_HOST);

    // ✅ Decode & Parse Pub/Sub message
    const message = event.data ? Buffer.from(event.data, "base64").toString() : "{}";

    let data;
    try {
      data = JSON.parse(message);
    } catch (error) {
      console.error("❌ Failed to parse JSON message:", message, error);
      return;
    }

    console.log("📩 Received message:", data);

    // ✅ Validate input
    if (!data.fileName || !data.imageBuffer || !data.userId) {
      console.error("❌ Missing required fields (fileName, imageBuffer, userId) in Pub/Sub message.");
      return;
    }

    // ✅ Define file path in Cloud Storage
    const fileName = `processed-${data.fileName}`;
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);

    const imageBuffer = Buffer.from(data.imageBuffer, "base64");

    // ✅ Process Image: Resize & Optimize
    const processedImage = await sharp(imageBuffer)
      .resize(300, 300)
      .jpeg({ quality: 80 })
      .toBuffer();

    console.log("📸 Image processed successfully.");

    // ✅ Upload image to Cloud Storage
    await file.save(processedImage, {
      metadata: { contentType: "image/jpeg" },
      public: true,
    });

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
    console.log(`✅ Image uploaded to Cloud Storage: ${publicUrl}`);

    // ✅ Store Processed Image URL in PostgreSQL
    const result = await pool.query(
      `INSERT INTO user_profiles (firebase_uid, profile_pic_url) VALUES ($1, $2)
       ON CONFLICT (firebase_uid) DO UPDATE SET profile_pic_url = EXCLUDED.profile_pic_url RETURNING *`,
      [data.userId, publicUrl]
    );

    if (result.rowCount === 0) {
      console.error(`❌ No user found with firebase_uid: ${data.userId}`);
    } else {
      console.log(`✅ Updated user ${data.userId} profile picture in PostgreSQL.`);
    }
  } catch (error) {
    console.error("❌ Error processing image:", error);
  }
};
