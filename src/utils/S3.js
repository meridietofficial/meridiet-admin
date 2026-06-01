export const uploadFileToS3 = async (file, fileName) => {
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("File size exceeds 15MB limit");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image");
  }

  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const response = await fetch("/api/upload-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileData: base64,
      fileType: file.type,
      fileName: file.name,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to upload image");
  }

  const data = await response.json();
  return data.url;
};
