"use client"

import { FileText, Image as ImageIcon, Music, Video, Link as LinkIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { MediaPreview } from "@/components"

interface SearchResult {
  assetId: string
  userId: string
  modality: string
  score: number
  metadata: Record<string, any>
  preview?: string
}

interface SearchResultCardProps {
  result: SearchResult
  index: number
}

const getModalityIcon = (modality: string) => {
  switch (modality) {
    case 'image':
      return <ImageIcon className="w-4 h-4" />
    case 'audio':
      return <Music className="w-4 h-4" />
    case 'video':
      return <Video className="w-4 h-4" />
    case 'link':
      return <LinkIcon className="w-4 h-4" />
    default:
      return <FileText className="w-4 h-4" />
  }
}

export function SearchResultCard({ result, index }: SearchResultCardProps) {
  return (
    <Card
      className="p-6 hover:shadow-lg transition-all duration-300 border border-border hover:border-accent animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium">
            {getModalityIcon(result.modality)}
            <span className="capitalize">{result.modality}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium">
            {(result.score * 100).toFixed(0)}% match
          </div>
        </div>
      </div>

      {/* Preview */}
      {result.preview && (
        <div className="mb-4 rounded-lg overflow-hidden bg-gray-50">
          <MediaPreview url={result.preview} modality={result.modality} />
        </div>
      )}

      {/* Content/Metadata */}
      <div className="space-y-3 text-sm">
        {result.metadata?.text && (
          <div>
            <p className="text-gray-700 leading-relaxed line-clamp-3">
              {result.metadata.text}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
          {result.metadata?.date && (
            <div className="flex items-center gap-1">
              <span>📅</span>
              <span>{new Date(result.metadata.date).toLocaleDateString()}</span>
            </div>
          )}
          {result.metadata?.folder_id && (
            <div className="flex items-center gap-1">
              <span>📁</span>
              <span>Folder: {result.metadata.folder_id.slice(0, 8)}</span>
            </div>
          )}
        </div>

        {/* Expandable Details */}
        <details className="group">
          <summary className="cursor-pointer text-primary hover:text-primary/80 text-xs font-medium">
            View details
          </summary>
          <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-2 text-xs">
            <div>
              <span className="font-medium text-gray-700">Asset ID:</span>{" "}
              <code className="bg-gray-200 px-2 py-1 rounded">
                {result.assetId}
              </code>
            </div>
            {result.metadata?.r2_key && (
              <div>
                <span className="font-medium text-gray-700">File:</span>{" "}
                <code className="bg-gray-200 px-2 py-1 rounded break-all">
                  {result.metadata.r2_key}
                </code>
              </div>
            )}
            {result.preview && (
              <div>
                <a 
                  className="text-primary hover:underline inline-flex items-center gap-1" 
                  href={result.preview} 
                  target="_blank" 
                  rel="noreferrer"
                >
                  <LinkIcon className="w-3 h-3" />
                  Open in new tab
                </a>
              </div>
            )}
          </div>
        </details>
      </div>
    </Card>
  )
}

