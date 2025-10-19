"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { isYoutubeUrl, getYoutubeVideoId } from "@/lib/youtube";

type UploadMode = 'file' | 'url';

export default function UploadPage() {
  const router = useRouter();
  const [mode, setMode] = useState<UploadMode>('file');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>("");
  const [urlError, setUrlError] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [workspaceName, setWorkspaceName] = useState<string>("My Workspace");

  // Check authentication on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem("smara_user_id");
    const storedToken = localStorage.getItem("smara_token");
    
    if (storedUserId && storedToken) {
      setUserId(storedUserId);
      setIsAuthenticated(true);
      apiClient.setUserId(storedUserId);
    } else {
      // Redirect to login if not authenticated
      router.push("/login");
    }
  }, [router]);

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

    const videoId = getYoutubeVideoId(url);
    if (!videoId) {
      setUrlError("Invalid YouTube URL format");
      return false;
    }

    return true;
  }

  async function handleFileUpload() {
    try {
      if (!file || !userId) return;

      setStatus("Uploading to R2…");

      // Determine prefix based on file type
      const prefix = file.type.startsWith("image/")
        ? "images"
        : file.type.startsWith("video/")
        ? "videos"
        : file.type.startsWith("audio/")
        ? "audio"
        : "files";

      // Upload directly through Hono API with workspace
      const result = await apiClient.uploadFile(file, { 
        prefix, 
        workspace: workspaceName 
      });

      setUploadedKey(result.key);
      setPublicUrl(result.publicUrl);
      setStatus("Upload complete ✅");

      console.log("Upload result:", result);

    } catch (e: any) {
      console.error("Upload error:", e);
      setStatus(`Error: ${e.message || "Upload failed"}`);
    }
  }

  async function handleUrlUpload() {
    try {
      if (!validateUrl(url) || !userId) return;

      setStatus("Processing YouTube URL…");

      // Upload URL through API with workspace
      const result = await apiClient.uploadUrl(url, { 
        workspace: workspaceName 
      });

      setUploadedKey(result.key);
      setPublicUrl(url); // For links, show original YouTube URL
      setStatus("YouTube video queued for processing ✅");

      console.log("URL upload result:", result);

    } catch (e: any) {
      console.error("URL upload error:", e);
      setStatus(`Error: ${e.message || "URL upload failed"}`);
    }
  }

  function handleModeChange(newMode: UploadMode) {
    setMode(newMode);
    setStatus("");
    setUrlError("");
    setUploadedKey(null);
    setPublicUrl(null);
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Upload Content</h1>

      {/* Workspace Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Workspace
        </label>
        <input
          type="text"
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          placeholder="My Workspace"
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-xs text-gray-500">
          Files will be organized in this workspace. Default: "My Workspace"
        </p>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => handleModeChange('file')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === 'file'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📁 Upload File
        </button>
        <button
          onClick={() => handleModeChange('url')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === 'url'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🔗 YouTube URL
        </button>
      </div>

      {/* File Upload Mode */}
      {mode === 'file' && (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Select File</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <button
            onClick={handleFileUpload}
            disabled={!file}
            className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Upload File
          </button>
        </>
      )}

      {/* URL Upload Mode */}
      {mode === 'url' && (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium">YouTube URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUrlError("");
              }}
              placeholder="https://www.youtube.com/watch?v=..."
              className={`block w-full px-3 py-2 border rounded-lg text-sm ${
                urlError ? 'border-red-300 focus:border-red-500' : ''
              }`}
            />
            {urlError && (
              <p className="text-sm text-red-600">{urlError}</p>
            )}
            <p className="text-xs text-gray-500">
              Paste a YouTube video URL. The transcript will be extracted and made searchable.
            </p>
          </div>

          <button
            onClick={handleUrlUpload}
            disabled={!url.trim()}
            className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Process YouTube URL
          </button>
        </>
      )}

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
          <strong>Note:</strong> {mode === 'file' ? 'File uploads' : 'YouTube URLs'} are handled by the Hono API backend. 
          Make sure <code className="bg-yellow-100 px-1 py-0.5 rounded">apps/api</code> is running on port 8787.
        </p>
      </div>
    </div>
  );
}
