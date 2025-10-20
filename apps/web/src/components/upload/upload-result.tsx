"use client"

import { Card } from "@/components/ui/card"

interface UploadResultProps {
  uploadedKey: string
  publicUrl?: string | null
}

export function UploadResult({ uploadedKey, publicUrl }: UploadResultProps) {
  return (
    <Card className="p-4 bg-gray-50 space-y-3 text-sm animate-in fade-in slide-in-from-bottom-2">
      <div>
        <span className="font-medium text-gray-900">Key:</span>{" "}
        <code className="break-all text-xs bg-gray-200 px-2 py-1 rounded">
          {uploadedKey}
        </code>
      </div>
      {publicUrl && (
        <div>
          <span className="font-medium text-gray-900">Public URL:</span>{" "}
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
    </Card>
  )
}

