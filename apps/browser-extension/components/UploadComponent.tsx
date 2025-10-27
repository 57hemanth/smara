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

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function UploadComponent({ userId, currentUrl, onUpload, onUploadUrl }: UploadComponentProps) {
  const [mode, setMode] = useState<'file' | 'url'>('file')
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState<string>("")
  const [urlError, setUrlError] = useState<string>("")
  const [status, setStatus] = useState<string>("")
  const [uploading, setUploading] = useState(false)

  function validateUrl(url: string): boolean {
    setUrlError("")
    
    if (!url.trim()) {
      setUrlError("Please enter a URL")
      return false
    }

    if (!isValidUrl(url)) {
      setUrlError("Please enter a valid URL")
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

      // Clear file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      if (fileInput) fileInput.value = ''

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
      setStatus("Processing URL...")

      const result = await onUploadUrl(url)

      setStatus("URL captured ✅")
      setUrl("")

    } catch (e: any) {
      console.error("URL upload error:", e)
      setStatus(`Error: ${e.message || "URL upload failed"}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Mode Selector */}
      <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
        <button
          onClick={() => setMode('file')}
          disabled={uploading}
          className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 disabled:cursor-not-allowed ${
            mode === 'file'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          📁 File
        </button>
        <button
          onClick={() => setMode('url')}
          disabled={uploading}
          className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 disabled:cursor-not-allowed ${
            mode === 'url'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🔗 URL
        </button>
      </div>

      {/* File Upload Mode */}
      {mode === 'file' && (
        <>
          <div className="bg-white rounded-xl p-4 space-y-3 border border-slate-200 shadow-sm">
            <label className="block">
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-primary/40 transition-colors cursor-pointer bg-slate-50 hover:bg-slate-100/50">
                <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-xs text-slate-700 font-medium mb-1">
                  {file ? file.name : 'Click to select file'}
                </p>
                <p className="text-[10px] text-slate-500">
                  or drag and drop
                </p>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  disabled={uploading}
                  className="hidden"
                />
              </div>
            </label>

            {file && (
              <div className="flex items-center justify-between bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-900 font-medium truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFile(null)
                    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
                    if (fileInput) fileInput.value = ''
                  }}
                  disabled={uploading}
                  className="ml-2 p-1 hover:bg-slate-200 rounded transition-colors disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-slate-500 hover:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleFileUpload}
            disabled={!file || !userId.trim() || uploading}
            className="w-full px-4 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Upload File</span>
              </>
            )}
          </button>
        </>
      )}

      {/* URL Upload Mode */}
      {mode === 'url' && (
        <>
          <div className="bg-white rounded-xl p-4 space-y-3 border border-slate-200 shadow-sm">
            <div className="space-y-2">
              <label className="text-xs text-slate-700 font-medium">URL</label>
              <div className="relative">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value)
                    setUrlError("")
                  }}
                  placeholder="https://example.com/..."
                  disabled={uploading}
                  className={`w-full px-4 py-3 bg-white border ${
                    urlError ? 'border-red-300' : 'border-slate-200'
                  } rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 ${
                    urlError ? 'focus:ring-red-200' : 'focus:ring-primary/20'
                  } focus:border-primary transition-all disabled:opacity-50 disabled:bg-slate-50`}
                />
                <svg className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              {urlError && (
                <p className="text-xs text-red-600 flex items-center space-x-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{urlError}</span>
                </p>
              )}
            </div>

            {currentUrl && isValidUrl(currentUrl) && url !== currentUrl && (
              <button
                onClick={() => setUrl(currentUrl)}
                disabled={uploading}
                className="flex items-center space-x-1.5 text-primary hover:text-primary/80 text-xs font-medium transition-colors disabled:cursor-not-allowed"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <span>Use current tab</span>
              </button>
            )}
          </div>

          <button
            onClick={handleUrlUpload}
            disabled={!url.trim() || !userId.trim() || uploading}
            className="w-full px-4 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span>Capture URL</span>
              </>
            )}
          </button>
        </>
      )}

      {/* Status Message */}
      {status && (
        <div className={`px-3 py-2 rounded-lg text-xs font-medium ${
          status.includes("Error") 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : status.includes("✅")
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {status}
        </div>
      )}
    </div>
  )
}

