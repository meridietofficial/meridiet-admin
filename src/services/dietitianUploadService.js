import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import API from "../helpers/api";

const FOLDER_MAP = {
  "profile-photos":            "dietitians/profile-photos",
  "degree-certificates":       "dietitians/degree-certificates",
  "registration-certificates": "dietitians/registration-certificates",
  "id-proofs":                 "dietitians/id-proofs",
};

const MIME_MAP = {
  jpg: "image/jpeg",
  png: "image/png",
  pdf: "application/pdf",
  gif: "image/gif",
};

async function detectExt(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const b = new Uint8Array(e.target.result);
      if (b[0] === 0xff && b[1] === 0xd8)                                       return resolve("jpg");
      if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47)    return resolve("png");
      if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46)    return resolve("pdf");
      if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46)                      return resolve("gif");
      // fallback to MIME type
      const m = file.type;
      if (m === "image/jpeg")      return resolve("jpg");
      if (m === "image/png")       return resolve("png");
      if (m === "application/pdf") return resolve("pdf");
      resolve("bin");
    };
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
}

async function getCredentials() {
  const res = await API.apiPost("awsKeys", {
    secret: import.meta.env.VITE_AWS_REVEAL_SECRET,
  });
  return res?.data?.data ?? res?.data ?? {};
}

export async function uploadSingleDocument(file, folderKey) {
  const { access_key_id, secret_access_key, region, bucket, base_url } =
    await getCredentials();

  const ext    = await detectExt(file);
  const rand   = Math.random().toString(36).slice(2, 8);
  const folder = FOLDER_MAP[folderKey] ?? `dietitians/${folderKey}`;
  const key    = `${folder}/${Date.now()}-${rand}.${ext}`;

  const client = new S3Client({
    region,
    credentials: { accessKeyId: access_key_id, secretAccessKey: secret_access_key },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: MIME_MAP[ext] ?? file.type,
    })
  );

  return `${base_url}/${key}`;
}

export async function uploadDocuments({ profilePhoto, degreeCert, regCert, idProof }) {
  const tasks = [
    profilePhoto ? uploadSingleDocument(profilePhoto, "profile-photos").then((u) => ({ profilePhoto: u }))           : null,
    degreeCert   ? uploadSingleDocument(degreeCert,   "degree-certificates").then((u) => ({ degreeCert: u }))        : null,
    regCert      ? uploadSingleDocument(regCert,      "registration-certificates").then((u) => ({ regCert: u }))     : null,
    idProof      ? uploadSingleDocument(idProof,      "id-proofs").then((u) => ({ idProof: u }))                     : null,
  ].filter(Boolean);

  const results = await Promise.all(tasks);
  return Object.assign({}, ...results);
}
