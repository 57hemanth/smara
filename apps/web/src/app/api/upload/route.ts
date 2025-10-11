import { NextRequest } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

// Validate environment variables at module load
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL;

const endpoint = R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : "";

const s3 = endpoint ? new S3Client({
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
}) : null;

export async function POST(req: NextRequest) {
  // Check for missing environment variables
  if (!R2_ACCOUNT_ID || !R2_BUCKET || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.error("Missing R2 environment variables. Please set: R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
    return new Response(
      JSON.stringify({ 
        error: "Server configuration error: R2 credentials not configured",
        details: "Please check server logs for missing environment variables"
      }), 
      { status: 500 }
    );
  }

  if (!s3) {
    return new Response(
      JSON.stringify({ error: "Server configuration error: S3 client not initialized" }), 
      { status: 500 }
    );
  }
  try {
    console.log("Upload request received");
    const { filename, contentType, prefix } = await req.json();

    // Very light validation
    if (!filename || !contentType) {
      return new Response(JSON.stringify({ error: "filename and contentType are required" }), { status: 400 });
    }

    // Derive file extension (fallback safe)
    const ext = filename.includes(".") ? filename.split(".").pop() : "bin";

    // Example key: uploads/{yyyy-mm}/{uuid}.{ext}
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const safePrefix = typeof prefix === "string" && prefix.length ? prefix.replace(/[^a-zA-Z0-9/_-]/g, "") : "uploads";
    const key = `${safePrefix}/${y}-${m}/${randomUUID()}.${ext}`;

    const putCmd = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    // URL valid for 10 minutes
    const url = await getSignedUrl(s3, putCmd, { expiresIn: 600 });
    
    const publicUrl = R2_PUBLIC_BASE_URL ? `${R2_PUBLIC_BASE_URL}/${key}` : null;

    return new Response(JSON.stringify({ url, key, publicUrl }), { status: 200 });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Failed to create presigned URL" }), { status: 500 });
  }
}
