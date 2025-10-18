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
  onUploadUrl?: (url: string) => Promise<UploadResult>;
  onUploadComplete?: (result: UploadResult) => void;
  showUrlUpload?: boolean;  // Whether to show URL upload option
  currentUrl?: string;  // Current tab URL (for extension)
}

type UploadMode = 'file' | 'url';

/**
 * Validate YouTube URL
 */
function isYoutubeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('youtube.com') || urlObj.hostname === 'youtu.be';
  } catch {
    return false;
  }
}

/**
 * UploadComponent for uploading files and URLs to SMARA
 * 
 * Accepts upload callback functions to allow different API implementations
 * (e.g., web app API client vs extension API client)
 */
export function UploadComponent({ 
  userId, 
  onUpload, 
  onUploadUrl,
  onUploadComplete,
  showUrlUpload = false,
  currentUrl
}: UploadComponentProps) {
  const [mode, setMode] = useState<UploadMode>(() => {
    // Auto-select URL mode if on YouTube
    if (showUrlUpload && currentUrl && isYoutubeUrl(currentUrl)) {
      return 'url';
    }
    return 'file';
  });
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>(currentUrl && isYoutubeUrl(currentUrl) ? currentUrl : "");
  const [urlError, setUrlError] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  function validateUrl(url: string): boolean {
    setUrlError("");
    
    if (!url.trim()) {
      setUrlError("Please enter a URL");
      return false;
    }

    if (!isYoutubeUrl(url)) {
      setUrlError("Only YouTube URLs are supported");
      return false;
    }

    return true;
  }

  async function handleFileUpload() {
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

  async function handleUrlUpload() {
    try {
      if (!validateUrl(url) || !userId.trim()) return;
      if (!onUploadUrl) return;

      setUploading(true);
      setStatus("Processing YouTube URL...");

      const result = await onUploadUrl(url);

      setStatus("YouTube video queued ✅");
      setUrl("");
      
      if (onUploadComplete) {
        onUploadComplete(result);
      }

    } catch (e: any) {
      console.error("URL upload error:", e);
      setStatus(`Error: ${e.message || "URL upload failed"}`);
    } finally {
      setUploading(false);
    }
  }

  function handleModeChange(newMode: UploadMode) {
    setMode(newMode);
    setStatus("");
    setUrlError("");
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">
        {showUrlUpload ? 'Capture Content' : 'Upload File'}
      </h3>

      {/* Mode Selector (only if URL upload is available) */}
      {showUrlUpload && onUploadUrl && (
        <div className="flex gap-1 p-0.5 bg-gray-100 rounded">
          <button
            onClick={() => handleModeChange('file')}
            className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
              mode === 'file'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📁 File
          </button>
          <button
            onClick={() => handleModeChange('url')}
            className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
              mode === 'url'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🔗 URL
          </button>
        </div>
      )}
      
      {/* File Upload Mode */}
      {mode === 'file' && (
        <>
          <div className="space-y-2">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={uploading}
            />
          </div>

          <button
            onClick={handleFileUpload}
            disabled={!file || !userId.trim() || uploading}
            className="w-full px-3 py-2 text-xs rounded bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </>
      )}

      {/* URL Upload Mode */}
      {mode === 'url' && onUploadUrl && (
        <>
          <div className="space-y-1">
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUrlError("");
              }}
              placeholder="YouTube URL..."
              className={`block w-full px-2 py-1.5 text-xs border rounded ${
                urlError ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={uploading}
            />
            {urlError && (
              <p className="text-xs text-red-600">{urlError}</p>
            )}
            {currentUrl && isYoutubeUrl(currentUrl) && url !== currentUrl && (
              <button
                onClick={() => setUrl(currentUrl)}
                className="text-xs text-blue-600 hover:underline"
              >
                Use current page URL
              </button>
            )}
          </div>

          <button
            onClick={handleUrlUpload}
            disabled={!url.trim() || !userId.trim() || uploading}
            className="w-full px-3 py-2 text-xs rounded bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? "Processing..." : "Capture YouTube"}
          </button>
        </>
      )}

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

