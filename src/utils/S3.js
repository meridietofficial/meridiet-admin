import AWS from "aws-sdk";

AWS.config.update({
  accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY,
  secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_KEY,
  region: process.env.NEXT_PUBLIC_AWS_REGION,
});

const s3 = new AWS.S3({
  signatureVersion: 'v4',
});

export const uploadFileToS3 = async (file, fileName) => {
  // Validate file size (max 15MB as per UI)
  const maxSizeInBytes = 15 * 1024 * 1024; // 15MB
  if (file.size > maxSizeInBytes) {
    throw new Error("File size exceeds 15MB limit");
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image");
  }

  const params = {
    Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET,
    Key: fileName,
    Body: file,
    ContentDisposition: "inline",
    ContentType: file.type,
    // Note: ACL removed because bucket does not allow ACLs
    // Files will inherit bucket's public access settings
  };

  try {
    const data = await s3.upload(params).promise();
    return data.Location;
  } catch (error) {

    // Provide more specific error messages
    if (error.code === "NetworkingError") {
      throw new Error("Network error. Please check your internet connection.");
    } else if (error.code === "InvalidAccessKeyId") {
      throw new Error("Invalid AWS credentials. Please contact support.");
    } else if (error.code === "SignatureDoesNotMatch") {
      throw new Error("AWS signature error. Please contact support.");
    } else if (error.code === "AccessDenied") {
      throw new Error("Access denied to S3 bucket. Please contact support.");
    } else if (error.code === "NoSuchBucket") {
      throw new Error("S3 bucket not found. Please contact support.");
    } else {
      throw new Error(error.message || "Failed to upload image to S3");
    }
  }
};
