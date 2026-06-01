import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_KEY,
  },
  region: process.env.NEXT_PUBLIC_AWS_REGION,
});

export const uploadFileToS3 = async (file, fileName) => {
  const maxSizeInBytes = 15 * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    throw new Error("File size exceeds 15MB limit");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image");
  }

  const params = {
    Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET,
    Key: fileName,
    Body: file,
    ContentDisposition: "inline",
    ContentType: file.type,
  };

  try {
    await s3.send(new PutObjectCommand(params));
    return `https://${params.Bucket}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${fileName}`;
  } catch (error) {
    if (error.name === "NetworkingError") {
      throw new Error("Network error. Please check your internet connection.");
    } else if (error.name === "InvalidAccessKeyId") {
      throw new Error("Invalid AWS credentials. Please contact support.");
    } else if (error.name === "SignatureDoesNotMatch") {
      throw new Error("AWS signature error. Please contact support.");
    } else if (error.name === "AccessDenied") {
      throw new Error("Access denied to S3 bucket. Please contact support.");
    } else if (error.name === "NoSuchBucket") {
      throw new Error("S3 bucket not found. Please contact support.");
    } else {
      throw new Error(error.message || "Failed to upload image to S3");
    }
  }
};
