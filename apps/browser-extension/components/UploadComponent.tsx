import { useState } from "react"

interface UploadResult {
  success: boolean
  key: string
  assetId: string
  size: number
  contentType: string
  publicUrl: string | null
}

interface UploadComponentProps {
  userId: string
  currentUrl?: string
  onUpload: (file: File) => Promise<UploadResult>
  onUploadUrl: (url: string) => Promise<UploadResult>
}

function isYoutubeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.includes('youtube.com') || urlObj.hostname === 'youtu.be'
  } catch {
    return false
  }
}

export function UploadComponent({ userId, currentUrl, onUpload, onUploadUrl }: UploadComponentProps) {
  const [mode, setMode] = useState<'file' | 'url'>(() => {
    return currentUrl && isYoutubeUrl(currentUrl) ? 'url' : 'file'
  })
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState<string>(currentUrl && isYoutubeUrl(currentUrl) ? currentUrl : "")
  const [urlError, setUrlError] = useState<string>("")
  const [status, setStatus] = useState<string>("")
  const [uploading, setUploading] = useState(false)

  function validateUrl(url: string): boolean {
    setUrlError("")
    
    if (!url.trim()) {
      setUrlError("Please enter a URL")
      return false
    }

    if (!isYoutubeUrl(url)) {
      setUrlError("Only YouTube URLs are supported")
      return false
    }

    return true
  }

  async function handleFileUpload() {
    try {
      if (!file || !userId.trim()) return

      setUploading(true)
      setStatus("Uploading...")

      const result = await onUpload(file)

      setStatus("Upload complete ✅")
      setFile(null)

    } catch (e: any) {
      console.error("Upload error:", e)
      setStatus(`Error: ${e.message || "Upload failed"}`)
    } finally {
      setUploading(false)
    }
  }

  async function handleUrlUpload() {
    try {
      if (!validateUrl(url) || !userId.trim()) return

      setUploading(true)
      setStatus("Processing YouTube URL...")

      const result = await onUploadUrl(url)

      setStatus("YouTube video queued ✅")
      setUrl("")

    } catch (e: any) {
      console.error("URL upload error:", e)
      setStatus(`Error: ${e.message || "URL upload failed"}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>
        Capture Content
      </h3>

      {/* Mode Selector */}
      <div style={{ display: 'flex', gap: '4px', padding: '2px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
        <button
          onClick={() => setMode('file')}
          style={{
            flex: 1,
            padding: '4px 8px',
            fontSize: '12px',
            fontWeight: 500,
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: mode === 'file' ? '#fff' : 'transparent',
            color: mode === 'file' ? '#111827' : '#6b7280',
            boxShadow: mode === 'file' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
          }}
        >
          📁 File
        </button>
        <button
          onClick={() => setMode('url')}
          style={{
            flex: 1,
            padding: '4px 8px',
            fontSize: '12px',
            fontWeight: 500,
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: mode === 'url' ? '#fff' : 'transparent',
            color: mode === 'url' ? '#111827' : '#6b7280',
            boxShadow: mode === 'url' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
          }}
        >
          🔗 URL
        </button>
      </div>

      {/* File Upload Mode */}
      {mode === 'file' && (
        <>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={uploading}
            style={{
              fontSize: '12px',
              padding: '4px'
            }}
          />
          <button
            onClick={handleFileUpload}
            disabled={!file || !userId.trim() || uploading}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: !file || !userId.trim() || uploading ? 'not-allowed' : 'pointer',
              opacity: !file || !userId.trim() || uploading ? 0.5 : 1
            }}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </>
      )}

      {/* URL Upload Mode */}
      {mode === 'url' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                setUrlError("")
              }}
              placeholder="YouTube URL..."
              disabled={uploading}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '12px',
                border: `1px solid ${urlError ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '6px',
                boxSizing: 'border-box'
              }}
            />
            {urlError && (
              <p style={{ margin: 0, fontSize: '11px', color: '#ef4444' }}>{urlError}</p>
            )}
            {currentUrl && isYoutubeUrl(currentUrl) && url !== currentUrl && (
              <button
                onClick={() => setUrl(currentUrl)}
                style={{
                  fontSize: '11px',
                  color: '#2563eb',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  textAlign: 'left',
                  textDecoration: 'underline'
                }}
              >
                Use current page URL
              </button>
            )}
          </div>

          <button
            onClick={handleUrlUpload}
            disabled={!url.trim() || !userId.trim() || uploading}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: !url.trim() || !userId.trim() || uploading ? 'not-allowed' : 'pointer',
              opacity: !url.trim() || !userId.trim() || uploading ? 0.5 : 1
            }}
          >
            {uploading ? "Processing..." : "Capture YouTube"}
          </button>
        </>
      )}

      {status && (
        <div
          style={{
            padding: '8px',
            fontSize: '11px',
            borderRadius: '6px',
            backgroundColor: status.includes("Error") 
              ? '#fef2f2' 
              : status.includes("✅")
              ? '#f0fdf4'
              : '#eff6ff',
            color: status.includes("Error") 
              ? '#991b1b' 
              : status.includes("✅")
              ? '#166534'
              : '#1e40af',
            border: `1px solid ${
              status.includes("Error") 
                ? '#fecaca' 
                : status.includes("✅")
                ? '#bbf7d0'
                : '#bfdbfe'
            }`
          }}
        >
          {status}
        </div>
      )}
    </div>
  )
}

