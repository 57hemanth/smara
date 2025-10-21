"use client"

import { Loader2, Upload as UploadIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface FileUploadFormProps {
  file: File | null
  setFile: (file: File | null) => void
  uploading: boolean
  onUpload: () => void
}

export function FileUploadForm({ 
  file, 
  setFile, 
  uploading, 
  onUpload 
}: FileUploadFormProps) {
  return (
    <>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900">
          Select File
        </label>
        <Input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="h-11 cursor-pointer file:cursor-pointer"
        />
        <p className="text-xs text-gray-500">
          Supported: Images, Videos, Audio files
        </p>
      </div>

      <Button
        onClick={onUpload}
        disabled={!file || uploading}
        className="w-full h-11 bg-primary hover:bg-primary/90"
      >
        {uploading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Uploading...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <UploadIcon className="w-4 h-4" />
            Upload File
          </span>
        )}
      </Button>
    </>
  )
}

