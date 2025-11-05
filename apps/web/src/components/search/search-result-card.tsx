"use client"

import { FileText, Image as ImageIcon, Music, Video, Link as LinkIcon, Download, Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function SearchResultCard({ result, index }: SearchResultCardProps) {
  return (
    <Card
      className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600 animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Preview */}
      {(result.preview || (result.modality === 'link' && result.metadata?.url)) && (
        <div className="aspect-video bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden mb-3">
          <MediaPreview 
            url={result.modality === 'link' && result.metadata?.url ? result.metadata.url : result.preview!} 
            modality={result.modality}
            maxHeight="120px"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      {result.metadata?.text && (
        <div className="mb-3">
          <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed line-clamp-2">
            {result.metadata.text}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="space-y-2">
        {result.metadata?.date && (
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(result.metadata.date)}</span>
          </div>
        )}
        
        {/* Show download button only for non-link results that have preview URLs */}
        {result.preview && result.modality !== 'link' && (
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs h-8"
            onClick={() => {
              const link = document.createElement('a');
              link.href = result.preview!;
              link.download = `asset-${result.assetId}`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            <Download className="w-3 h-3 mr-1" />
            Download
          </Button>
        )}
      </div>
    </Card>
  )
}

