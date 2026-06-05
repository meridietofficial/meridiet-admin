// Small Express backend that replaces the old Next.js API route
// (pages/api/upload-image.js). It performs the server-side S3 upload that
// cannot run in the browser. In dev, Vite proxies /api/upload-image here
// (see vite.config.js). Run it with `npm run server`.
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "16mb" }));

app.post("/api/upload-image", async (req, res) => {
  const { fileData, fileType, fileName } = req.body;
  if (!fileData || !fileType || !fileName) {
    return res.status(400).json({ error: "Missing file data" });
  }

  try {
    const { data: keys } = await axios.post(
      "https://api.meridiet.com/api/v1/aws-keys",
      { secret: process.env.AWS_REVEAL_SECRET }
    );

    const s3 = new S3Client({
      credentials: {
        accessKeyId: keys.access_key_id,
        secretAccessKey: keys.secret_access_key,
      },
      region: keys.region,
    });

    const buffer = Buffer.from(fileData, "base64");
    const uniqueKey = `profile/${uuidv4()}_${fileName}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: keys.bucket,
        Key: uniqueKey,
        Body: buffer,
        ContentDisposition: "inline",
        ContentType: fileType,
      })
    );

    const url = keys.base_url
      ? `${keys.base_url}/${uniqueKey}`
      : `https://${keys.bucket}.s3.${keys.region}.amazonaws.com/${uniqueKey}`;

    return res.status(200).json({ url });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Upload failed" });
  }
});

const PORT = process.env.UPLOAD_SERVER_PORT || 5050;
app.listen(PORT, () => {
  console.log(`> Upload server ready on http://localhost:${PORT}`);
});
