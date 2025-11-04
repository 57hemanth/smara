"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api";
import { isYoutubeUrl, getYoutubeVideoId } from "@/lib/youtube";
import { Upload as UploadIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageLayout } from "@/components/layout";
import { StatusMessage } from "@/components/common/status-message";
import { 
  FolderSelector, 
  FileUploadForm, 
  UrlUploadForm, 
  UploadResult 
} from "@/components/upload";
import { useAuth } from "@/hooks/use-auth";

type UploadMode = 'file' | 'url';

export default function UploadPage() {
  const { userId } = useAuth();
  const [mode, setMode] = useState<UploadMode>('file');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>("");
  const [urlError, setUrlError] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [folderName, setFolderName] = useState<string>("");
  
  const [uploading, setUploading] = useState(false);


  function validateUrl(url: string): boolean {
    setUrlError("");
    
    if (!url.trim()) {
      setUrlError("Please enter a URL");
      return false;
    }

    if (!isYoutubeUrl(url)) {
      setUrlError("Only YouTube URLs are supported for now.");
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

      setUploading(true);
      setStatus("Uploading to R2…");

      const prefix = file.type.startsWith("image/")
        ? "images"
        : file.type.startsWith("video/")
        ? "videos"
        : file.type.startsWith("audio/")
        ? "audio"
        : "files";

      const result = await apiClient.uploadFile(file, { 
        prefix, 
        folder: folderName 
      });

      setUploadedKey(result.key);
      setPublicUrl(result.publicUrl);
      setStatus("Upload complete ✅");

      console.log("Upload result:", result);
    } catch (e: any) {
      console.error("Upload error:", e);
      setStatus(`Error: ${e.message || "Upload failed"}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleUrlUpload() {
    try {
      if (!validateUrl(url) || !userId) return;

      setUploading(true);
      setStatus("Processing YouTube URL…");

      const result = await apiClient.uploadUrl(url, { 
        folder: folderName 
      });

      setUploadedKey(result.key);
      setPublicUrl(url);
      setStatus("YouTube video queued for processing ✅");

      console.log("URL upload result:", result);
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
    setUploadedKey(null);
    setPublicUrl(null);
  }

  return (
    <PageLayout title="Upload Content" icon={UploadIcon}>
      <div className="p-6">
        <div className="max-w-2xl mx-auto w-full space-y-6">
          {/* Folder Selector */}
          <FolderSelector value={folderName} onChange={setFolderName} />
          
          {/* Mode Selector */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => handleModeChange('file')}
              className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all ${
                mode === 'file'
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              📁 Upload File
            </button>
            <button
              onClick={() => handleModeChange('url')}
              className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all ${
                mode === 'url'
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🔗 URL
            </button>
          </div>

          {/* Upload Form */}
          <Card className="p-6 space-y-4">
            {mode === 'file' ? (
              <FileUploadForm 
                file={file}
                setFile={setFile}
                uploading={uploading}
                onUpload={handleFileUpload}
              />
            ) : (
              <UrlUploadForm
                url={url}
                setUrl={setUrl}
                urlError={urlError}
                setUrlError={setUrlError}
                uploading={uploading}
                onUpload={handleUrlUpload}
              />
            )}
          </Card>

          {/* Status Message */}
          {status && <StatusMessage message={status} />}

          {/* Upload Result */}
          {uploadedKey && (
            <UploadResult 
              uploadedKey={uploadedKey} 
              publicUrl={publicUrl} 
            />
          )}
        </div>
      </div>
    </PageLayout>
  );
}