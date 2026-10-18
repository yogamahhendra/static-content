import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

const endpoint = process.env.S3_ENDPOINT || process.env.AWS_ENDPOINT_URL_S3;
const region = process.env.S3_REGION || process.env.AWS_REGION || "ap-southeast-1";
const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
export const BUCKET_NAME = process.env.S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME || "static-assets";
const forcePathStyle = process.env.S3_FORCE_PATH_STYLE !== "false";

let s3ClientInstance: S3Client | null = null;

export function getS3Client(): S3Client {
  if (s3ClientInstance) return s3ClientInstance;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "S3 storage credentials not configured. Please set S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY in your environment."
    );
  }

  s3ClientInstance = new S3Client({
    region,
    endpoint: endpoint || undefined,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle,
  });

  return s3ClientInstance;
}

export interface UploadStorageParams {
  storageKey: string;
  buffer: Buffer;
  contentType: string;
}

export async function uploadToStorage(params: UploadStorageParams): Promise<{ storageKey: string; eTag?: string }> {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: params.storageKey,
    Body: params.buffer,
    ContentType: params.contentType,
  });

  const response = await client.send(command);
  return {
    storageKey: params.storageKey,
    eTag: response.ETag?.replace(/"/g, ""),
  };
}

export async function getFromStorage(storageKey: string) {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: storageKey,
  });

  try {
    const response = await client.send(command);
    return {
      body: response.Body,
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      eTag: response.ETag?.replace(/"/g, ""),
      lastModified: response.LastModified,
    };
  } catch (error: any) {
    if (error.name === "NoSuchKey" || error.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw error;
  }
}

export async function deleteFromStorage(storageKey: string): Promise<boolean> {
  const client = getS3Client();
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: storageKey,
  });

  try {
    await client.send(command);
    return true;
  } catch (error) {
    console.error(`⚠️ Failed to delete storage key "${storageKey}":`, error);
    return false;
  }
}

export async function existsInStorage(storageKey: string): Promise<boolean> {
  const client = getS3Client();
  const command = new HeadObjectCommand({
    Bucket: BUCKET_NAME,
    Key: storageKey,
  });

  try {
    await client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}
