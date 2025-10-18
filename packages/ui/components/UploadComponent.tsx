import { useState } from "react";

interface UploadResult {
  success: boolean;
  key: string;
  assetId: string;
  size: number;
  contentType: string;
  publicUrl: string | null;
}

interface UploadComponentProps {
  userId: string;
  onUpload: (file: File, options?: { prefix?: string }) => Promise<UploadResult>;
  onUploadComplete?: (result: UploadResult) => void;
}

/**
 * UploadComponent for uploading files to SMARA
 * 
 * Accepts an upload callback function to allow different API implementations
 * (e.g., web app API client vs extension API client)
 */
export function UploadComponent({ userId, onUpload, onUploadComplete }: UploadComponentProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  async function handleUpload() {
    try {
      if (!file || !userId.trim()) return;

      setUploading(true);
      setStatus("Uploading...");

      // Determine prefix based on file type
      const prefix = file.type.startsWith("image/")
        ? "images"
        : file.type.startsWith("video/")
        ? "videos"
        : file.type.startsWith("audio/")
        ? "audio"
        : "files";

      // Upload the file
      const result = await onUpload(file, { prefix });

      setStatus("Upload complete ✅");
      setFile(null);
      
      if (onUploadComplete) {
        onUploadComplete(result);
      }

    } catch (e: any) {
      console.error("Upload error:", e);
      setStatus(`Error: ${e.message || "Upload failed"}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">Upload File</h3>
      
      <div className="space-y-2">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          disabled={uploading}
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || !userId.trim() || uploading}
        className="w-full px-3 py-2 text-xs rounded bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {status && (
        <div className={`p-2 rounded text-xs ${
          status.includes("Error") 
            ? "bg-red-50 text-red-700 border border-red-200" 
            : status.includes("✅")
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-blue-50 text-blue-700 border border-blue-200"
        }`}>
          {status}
        </div>
      )}
    </div>
  );
}

