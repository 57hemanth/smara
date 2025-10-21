"use client"

import { Loader2, Upload as UploadIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface UrlUploadFormProps {
  url: string
  setUrl: (url: string) => void
  urlError: string
  setUrlError: (error: string) => void
  uploading: boolean
  onUpload: () => void
}

export function UrlUploadForm({ 
  url, 
  setUrl, 
  urlError, 
  setUrlError, 
  uploading, 
  onUpload 
}: UrlUploadFormProps) {
  return (
    <>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900">
          YouTube URL
        </label>
        <Input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            setUrlError("")
          }}
          placeholder="https://www.youtube.com/watch?v=..."
          className={`h-11 ${
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

      <Button
        onClick={onUpload}
        disabled={!url.trim() || uploading}
        className="w-full h-11 bg-primary hover:bg-primary/90"
      >
        {uploading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <UploadIcon className="w-4 h-4" />
            Process YouTube URL
          </span>
        )}
      </Button>
    </>
  )
}

