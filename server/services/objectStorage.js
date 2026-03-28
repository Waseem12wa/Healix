import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const bucket = process.env.OBJECT_STORAGE_BUCKET || '';
const region = process.env.OBJECT_STORAGE_REGION || 'us-east-1';
const endpoint = process.env.OBJECT_STORAGE_ENDPOINT || '';
const accessKeyId = process.env.OBJECT_STORAGE_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY || '';
const publicBaseUrl = process.env.OBJECT_STORAGE_PUBLIC_BASE_URL || '';

const hasObjectStorageConfig = Boolean(bucket && accessKeyId && secretAccessKey);

const s3Client = hasObjectStorageConfig
  ? new S3Client({
      region,
      endpoint: endpoint || undefined,
      forcePathStyle: Boolean(endpoint),
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  : null;

const sanitizeFileExtension = (originalName = '', mimeType = '') => {
  const fromName = path.extname(originalName).toLowerCase();
  if (fromName && ['.png', '.jpg', '.jpeg', '.webp'].includes(fromName)) {
    return fromName;
  }

  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/webp') return '.webp';
  return '.jpg';
};

const contentTypeForExt = (ext) => {
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
};

const buildPublicUrl = (key) => {
  if (publicBaseUrl) {
    return `${publicBaseUrl.replace(/\/$/, '')}/${key}`;
  }
  if (endpoint) {
    return `${endpoint.replace(/\/$/, '')}/${bucket}/${key}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};

export const uploadProfileImageObject = async ({ userId, fileBuffer, originalName, mimeType }) => {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    throw new Error('Invalid image buffer');
  }

  const ext = sanitizeFileExtension(originalName, mimeType);
  const key = `profile-images/${userId}/${Date.now()}-${randomUUID()}${ext}`;

  if (hasObjectStorageConfig && s3Client) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: contentTypeForExt(ext),
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );

    return {
      provider: 'object-storage',
      key,
      url: buildPublicUrl(key),
    };
  }

  const uploadsRoot = path.resolve(process.cwd(), 'uploads');
  const fullPath = path.join(uploadsRoot, key);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, fileBuffer);

  return {
    provider: 'local-fallback',
    key,
    url: `/uploads/${key}`,
  };
};
