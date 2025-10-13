"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("demo-user");

  async function handleUpload() {
    try {
      if (!file) return;

      setStatus("Uploading to R2…");

      // Set user ID (later this will come from auth)
      apiClient.setUserId(userId);

      // Determine prefix based on file type
      const prefix = file.type.startsWith("image/")
        ? "images"
        : file.type.startsWith("video/")
        ? "videos"
        : file.type.startsWith("audio/")
        ? "audio"
        : "files";

      // Upload directly through Hono API
      const result = await apiClient.uploadFile(file, { prefix });

      setUploadedKey(result.key);
      setPublicUrl(result.publicUrl);
      setStatus("Upload complete ✅");

      console.log("Upload result:", result);

    } catch (e: any) {
      console.error("Upload error:", e);
      setStatus(`Error: ${e.message || "Upload failed"}`);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Upload to R2</h1>

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          User ID (for testing - will use auth later)
        </label>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter user ID"
          className="block w-full px-3 py-2 border rounded-lg text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Select File</label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={!file}
        className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Upload to R2
      </button>

      {status && (
        <div className={`p-3 rounded-lg text-sm ${
          status.includes("Error") 
            ? "bg-red-50 text-red-700 border border-red-200" 
            : status.includes("✅")
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-blue-50 text-blue-700 border border-blue-200"
        }`}>
          {status}
        </div>
      )}

      {uploadedKey && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
          <div>
            <span className="font-medium">Key:</span>{" "}
            <code className="break-all text-xs bg-gray-200 px-1 py-0.5 rounded">
              {uploadedKey}
            </code>
          </div>
          {publicUrl && (
            <div>
              <span className="font-medium">Public URL:</span>{" "}
              <a 
                className="text-blue-600 hover:underline break-all" 
                href={publicUrl} 
                target="_blank" 
                rel="noreferrer"
              >
                {publicUrl}
              </a>
            </div>
          )}
        </div>
      )}

      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800">
          <strong>Note:</strong> Uploads are now handled by the Hono API backend. 
          Make sure <code className="bg-yellow-100 px-1 py-0.5 rounded">apps/api</code> is running on port 8787.
        </p>
      </div>
    </div>
  );
}
