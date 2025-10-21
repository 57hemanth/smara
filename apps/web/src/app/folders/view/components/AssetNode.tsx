"use client"

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Image, 
  Video, 
  Music, 
  FileText, 
  Link, 
  Download,
  Eye,
  Calendar,
  HardDrive
} from "lucide-react"
import { type Asset } from "@/lib/api"
import { MediaPreview } from "@/components"

interface AssetNodeData {
  asset: Asset
}

// Helper functions
const getModalityIcon = (modality: string, className = "w-4 h-4") => {
  switch (modality) {
    case 'image': return <Image className={className} />
    case 'video': return <Video className={className} />
    case 'audio': return <Music className={className} />
    case 'text': return <FileText className={className} />
    case 'link': return <Link className={className} />
    default: return <FileText className={className} />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ready': return 'bg-green-100 text-green-800 border-green-200'
    case 'processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'pending': return 'bg-accent text-accent-foreground border-accent'
    case 'error': return 'bg-red-100 text-red-800 border-red-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
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

const getFileExtension = (mimeType: string) => {
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'JPG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'image/webp': 'WEBP',
    'video/mp4': 'MP4',
    'video/webm': 'WEBM',
    'video/quicktime': 'MOV',
    'audio/mpeg': 'MP3',
    'audio/wav': 'WAV',
    'audio/ogg': 'OGG',
    'text/plain': 'TXT',
    'application/pdf': 'PDF',
    'application/json': 'JSON',
  }
  return mimeMap[mimeType] || mimeType.split('/')[1]?.toUpperCase() || 'FILE'
}

// Get preview URL from asset (provided by API)
const getPreviewUrl = (asset: Asset) => {
  // Use preview URL from API if available
  if (asset.preview) {
    return asset.preview;
  }
  
  // Fallback: construct URL manually (shouldn't be needed with updated API)
  const R2_PUBLIC_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || 'https://pub-b46886bc7e3f45739fdb73b666c49d8b.r2.dev'
  
  if (asset.modality === 'link' && asset.source_url) {
    return asset.source_url // For YouTube links, use the original URL
  }
  
  return `${R2_PUBLIC_BASE}/${asset.r2_key}`
}

export const AssetNode = memo<NodeProps<AssetNodeData>>(({ data }) => {
  const { asset } = data

  const handlePreview = () => {
    const previewUrl = getPreviewUrl(asset)
    window.open(previewUrl, '_blank')
  }

  const handleDownload = () => {
    const downloadUrl = getPreviewUrl(asset)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = asset.r2_key.split('/').pop() || `asset-${asset.id}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Create a shortened display name
  const displayName = asset.r2_key.split('/').pop()?.split('.')[0] || asset.id
  const shortName = displayName.length > 20 ? displayName.substring(0, 20) + '...' : displayName

  const previewUrl = getPreviewUrl(asset)

  return (
    <div className="asset-node">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-primary !w-2 !h-2 !border-white !border-2"
      />
      
      <Card className="w-64 shadow-lg hover:shadow-xl transition-shadow duration-200 border-2 hover:border-accent">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getModalityIcon(asset.modality, "w-5 h-5 text-primary")}
              <span className="font-medium text-sm text-gray-900">{shortName}</span>
            </div>
            {/* <Badge className={`text-xs ${getStatusColor(asset.status)}`}>
              {asset.status}
            </Badge> */}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Asset Preview */}
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            <MediaPreview 
              url={previewUrl} 
              modality={asset.modality}
              maxHeight="120px"
              className="w-full h-full"
            />
          </div>

          {/* Asset Metadata */}
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <HardDrive className="w-3 h-3" />
              <span>{formatBytes(asset.bytes)}</span>
              <span className="text-gray-400">•</span>
              <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">
                {getFileExtension(asset.mime)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(asset.created_at)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {/* <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={handlePreview}
              disabled={asset.status !== 'ready'}
            >
              <Eye className="w-3 h-3 mr-1" />
              Preview
            </Button> */}
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={handleDownload}
              disabled={asset.status !== 'ready'}
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary !w-2 !h-2 !border-white !border-2"
      />
    </div>
  )
})

AssetNode.displayName = 'AssetNode'
