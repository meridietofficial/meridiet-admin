import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "16mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
}
