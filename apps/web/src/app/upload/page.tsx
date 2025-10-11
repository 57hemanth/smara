"use client";

import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);

  async function handleUpload() {
    try {
      if (!file) return;

      setStatus("Requesting URL…");

      const resp = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          // Optionally choose a logical prefix based on type
          prefix: file.type.startsWith("image/")
            ? "images"
            : file.type.startsWith("video/")
            ? "videos"
            : file.type.startsWith("audio/")
            ? "audio"
            : "files",
        }),
      });

      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}));
        throw new Error(e.error || "Failed to get upload URL");
      }

      const { url, key, publicUrl } = await resp.json();
      setStatus("Uploading to R2…");

      console.log("Uploading to:", url);
      console.log("File type:", file.type);
      console.log("File size:", file.size);

      // Upload straight to R2 with a single PUT
      const put = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      console.log("R2 response status:", put.status);
      console.log("R2 response headers:", Object.fromEntries(put.headers.entries()));

      if (!put.ok) {
        const errorText = await put.text();
        console.error("R2 error response:", errorText);
        throw new Error(`R2 rejected upload (${put.status}): ${errorText || 'No error message'}`);
      }

      setUploadedKey(key);
      setPublicUrl(publicUrl);
      setStatus("Upload complete ✅");

    } catch (e: any) {
      console.error("Upload error:", e);
      setStatus(`Error: ${e.message || "Upload failed"}`);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Upload to R2</h1>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="block w-full text-sm"
      />

      <button
        onClick={handleUpload}
        disabled={!file}
        className="px-4 py-2 rounded-xl shadow border disabled:opacity-50"
      >
        Upload
      </button>

      {status && <p className="text-sm">{status}</p>}

      {uploadedKey && (
        <div className="text-sm">
          <div>Key: <code className="break-all">{uploadedKey}</code></div>
          {publicUrl && (
            <div>
              Public URL:{" "}
              <a className="underline" href={publicUrl} target="_blank" rel="noreferrer">
                {publicUrl}
              </a>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Supports images, video, and audio. Large files: consider multipart uploads later.
      </p>
    </div>
  );
}
