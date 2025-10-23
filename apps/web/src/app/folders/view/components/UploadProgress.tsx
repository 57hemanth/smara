import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, X } from "lucide-react"
import { formatFileSize, truncateFileName } from "@/lib/file-utils"
import { UploadItem } from "@/hooks/use-file-upload"

interface UploadProgressProps {
  uploads: UploadItem[]
  onRemove: (uploadId: string) => void
}

export function UploadProgress({ uploads, onRemove }: UploadProgressProps) {
  if (uploads.length === 0) return null

  return (
    <div className="absolute top-4 right-4 z-40 space-y-2 max-w-xs">
      {uploads.map((upload) => {
        const truncatedName = truncateFileName(upload.name, 20)
        const fileSize = formatFileSize(upload.size)
        
        return (
          <Card key={upload.id} className="p-3 bg-white/95 backdrop-blur-sm shadow-lg">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <UploadStatusIcon status={upload.status} />
                <div className="min-w-0 flex-1">
                  <div 
                    className="text-sm font-medium text-gray-900 truncate" 
                    title={upload.name}
                  >
                    {truncatedName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {fileSize}
                    {upload.status === 'uploading' && upload.progress > 0 && (
                      <span className="ml-2">{Math.round(upload.progress)}%</span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 flex-shrink-0 ml-2"
                onClick={() => onRemove(upload.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            
            <UploadDetails upload={upload} />
          </Card>
        )
      })}
    </div>
  )
}

function UploadStatusIcon({ status }: { status: UploadItem['status'] }) {
  switch (status) {
    case 'uploading':
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500 flex-shrink-0" />
    case 'completed':
      return <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0" />
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
    default:
      return null
  }
}

function UploadDetails({ upload }: { upload: UploadItem }) {
  switch (upload.status) {
    case 'uploading':
      return (
        <div className="space-y-1">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${upload.progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Uploading...</span>
            <span>{Math.round(upload.progress)}%</span>
          </div>
        </div>
      )
    
    case 'error':
      return upload.error ? (
        <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
          <p className="text-xs text-red-600">{upload.error}</p>
        </div>
      ) : null
    
    case 'completed':
      return (
        <div className="mt-2 flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <p className="text-xs text-green-600 font-medium">Upload complete!</p>
        </div>
      )
    
    default:
      return null
  }
}
