import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const BACKEND_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1'
const AWS_SECRET   = import.meta.env.VITE_AWS_REVEAL_SECRET ?? ''

const FOLDER_MAP = {
  profilePhoto: 'dietitians/profile-photos',
  degreeCert:   'dietitians/degree-certificates',
  regCert:      'dietitians/registration-certificates',
  idProof:      'dietitians/id-proofs',
}

const MIME_MAP = {
  jpg:  'image/jpeg',
  png:  'image/png',
  pdf:  'application/pdf',
  gif:  'image/gif',
  heic: 'image/heic',
}

async function getAwsCredentials() {
  const token = localStorage.getItem('accessToken')
  const res = await fetch(`${BACKEND_URL}/dietitian/aws-keys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {}),
    },
    body: JSON.stringify({ secret: AWS_SECRET }),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'Failed to get AWS credentials')
  return {
    accessKeyId:     data.data.access_key_id,
    secretAccessKey: data.data.secret_access_key,
    region:          data.data.region,
    bucket:          data.data.bucket,
    baseUrl:         data.data.base_url,
  }
}

async function detectExtension(file) {
  const buf  = await file.slice(0, 12).arrayBuffer()
  const u8   = new Uint8Array(buf)
  const hex  = Array.from(u8).map(b => b.toString(16).padStart(2, '0')).join('')
  const ftyp = new TextDecoder().decode(u8.slice(4, 12))

  if (hex.startsWith('ffd8ff'))   return 'jpg'
  if (hex.startsWith('89504e47')) return 'png'
  if (hex.startsWith('25504446')) return 'pdf'
  if (hex.startsWith('47494638')) return 'gif'
  if (
    ftyp.includes('heic') || ftyp.includes('heix') ||
    ftyp.includes('mif1') || ftyp.includes('msf1') || ftyp.includes('heif')
  ) return 'heic'

  if (file.type === 'image/heic' || file.type === 'image/heif') return 'heic'
  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'image/png')  return 'png'

  throw new Error(`"${file.name}" is not a valid image or PDF. Please upload a JPG, PNG, or PDF.`)
}

async function uploadFileToS3(file, folder, credentials) {
  const ext    = await detectExtension(file)
  const key    = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = await file.arrayBuffer()

  const client = new S3Client({
    region: credentials.region,
    credentials: {
      accessKeyId:     credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })

  await client.send(new PutObjectCommand({
    Bucket:      credentials.bucket,
    Key:         key,
    Body:        new Uint8Array(buffer),
    ContentType: MIME_MAP[ext] ?? 'application/octet-stream',
  }))

  return `${credentials.baseUrl}/${key}`
}

export async function uploadDocuments({ profilePhoto, degreeCert, regCert, idProof }) {
  // Fetch credentials once, reuse for all uploads
  const credentials = await getAwsCredentials()

  const tasks = [
    profilePhoto ? uploadFileToS3(profilePhoto, FOLDER_MAP.profilePhoto, credentials).then(url => ({ profilePhoto: url })) : null,
    degreeCert   ? uploadFileToS3(degreeCert,   FOLDER_MAP.degreeCert,   credentials).then(url => ({ degreeCert:   url })) : null,
    regCert      ? uploadFileToS3(regCert,       FOLDER_MAP.regCert,      credentials).then(url => ({ regCert:      url })) : null,
    idProof      ? uploadFileToS3(idProof,       FOLDER_MAP.idProof,      credentials).then(url => ({ idProof:      url })) : null,
  ].filter(Boolean)

  const results = await Promise.all(tasks)
  return Object.assign({}, ...results)
}
