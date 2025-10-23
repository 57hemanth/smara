"use client"

import { useCallback, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  addEdge,
  Node,
  Connection,
  BackgroundVariant
} from 'reactflow'
import 'reactflow/dist/style.css'

import { PageLayout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, Folder as FolderIcon, Image, Video, Music, FileText, Link as LinkIcon, Upload, AlertCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useFolderData } from "@/hooks/use-folder-data"
import { useFileUpload } from "@/hooks/use-file-upload"
import { useDragAndDrop } from "@/hooks/use-drag-and-drop"
import { apiClient, type Asset } from "@/lib/api"
import Link from "next/link"

// Components
import { AssetNode } from "./AssetNode"
import { UploadProgress } from "./UploadProgress"

// Custom node types
const nodeTypes = {
  assetNode: AssetNode,
}

// Helper function to get icon for asset modality
const getModalityIcon = (modality: string, className = "w-4 h-4") => {
  switch (modality) {
    case 'image': return <Image className={className} />
    case 'video': return <Video className={className} />
    case 'audio': return <Music className={className} />
    case 'text': return <FileText className={className} />
    case 'link': return <LinkIcon className={className} />
    default: return <FileText className={className} />
  }
}

// Helper function to get color for asset status
const getStatusColor = (status: string) => {
  switch (status) {
    case 'ready': return 'bg-green-100 text-green-800'
    case 'processing': return 'bg-yellow-100 text-yellow-800'
    case 'pending': return 'bg-accent text-accent-foreground'
    case 'error': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// Generate automatic layout positions for assets with comfortable spacing
const generateNodePositions = (assets: Asset[]): Node[] => {
  // Node card width ~256px; add generous and equal gaps
  const GRID_X = 360 // horizontal spacing
  const GRID_Y = 360 // vertical spacing (match X for uniform grid)
  const PADDING = 80
  // Use fixed columns per row for consistent layout
  const COLS = Math.min(4, Math.max(1, assets.length))

  return assets.map((asset, index) => {
    const row = Math.floor(index / COLS)
    const col = index % COLS
    const x = col * GRID_X + PADDING
    const y = row * GRID_Y + PADDING

    return {
      id: asset.id,
      type: 'assetNode',
      position: { x, y },
      data: { asset },
      draggable: true,
    }
  })
}

export function FolderCanvas() {
  const searchParams = useSearchParams()
  const folderId = searchParams.get('id') || undefined
  const { userId } = useAuth()
  
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Set API client user ID when userId changes
  if (userId && apiClient.getUserId() !== userId) {
    apiClient.setUserId(userId)
  }

  // Fetch folder data
  const { folder, assets, loading, error, refreshAssets } = useFolderData({
    folderId,
    userId: userId || undefined
  })

  // File upload handling
  const { uploadingFiles, uploadFiles, removeUpload } = useFileUpload({
    userId: userId || undefined,
    folderName: folder?.name,
    onUploadComplete: () => {
      // Refresh assets when uploads complete
      setTimeout(refreshAssets, 1000)
    }
  })

  // Drag and drop handling
  const { isDragging, dropRef, dragHandlers } = useDragAndDrop({
    onFilesDropped: uploadFiles
  })

  // Handle connection creation for ReactFlow
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  // Update nodes when assets change
  useEffect(() => {
    const flowNodes = generateNodePositions(assets)
    setNodes(flowNodes)
  }, [assets, setNodes])

  if (loading) {
    return (
      <PageLayout title="Loading..." icon={FolderIcon}>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p>Loading assets...</p>
          </div>
        </div>
      </PageLayout>
    )
  }

  // Only show error if we actually have an error message;
  // avoid flashing error UI while identifiers are still initializing
  if (error) {
    return (
      <PageLayout title="Error" icon={AlertCircle}>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] gap-4">
          <AlertCircle className="w-16 h-16 text-red-500" />
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error}
            </h2>
            <p className="text-gray-600 mb-6">
              Please try again or go back to folders.
            </p>
            <Link href="/folders">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Folders
              </Button>
            </Link>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title={folder?.name ?? 'Folder'} icon={FolderIcon}>
      <div className="h-screen w-full flex flex-col">
        {/* Header with folder info and controls */}
        <div className="flex items-center justify-between p-2 border-b bg-white">
          <div className="flex items-center gap-3">
            <Link href="/folders">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <div>
              {/* <h2 className="text-lg font-semibold text-gray-900">{folder.name}</h2> */}
              <p className="text-sm text-gray-500">
                {assets.length} {assets.length === 1 ? 'asset' : 'assets'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Asset type summary */}
            {Object.entries(
              assets.reduce((acc, asset) => {
                acc[asset.modality] = (acc[asset.modality] || 0) + 1
                return acc
              }, {} as Record<string, number>)
            ).map(([modality, count]) => (
              <Badge key={modality} variant="secondary" className="flex items-center gap-1">
                {getModalityIcon(modality, "w-3 h-3")}
                {count}
              </Badge>
            ))}
          </div>
        </div>

        {/* Canvas Area with Drag & Drop */}
        <div 
          ref={dropRef}
          className="relative flex-1 bg-gray-50 min-h-0"
          style={{ height: 'calc(100vh - 180px)' }}
          {...dragHandlers}
        >
          {/* Drag overlay */}
          {isDragging && (
            <div className="absolute inset-0 z-50 bg-blue-50/90 border-2 border-dashed border-blue-300 flex items-center justify-center">
              <div className="text-center">
                <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-blue-700 mb-2">Drop files to upload</h3>
                <p className="text-blue-600">Supported: Images, Videos, Audio, Documents</p>
              </div>
            </div>
          )}

          {/* Upload Progress Component */}
          <UploadProgress uploads={uploadingFiles} onRemove={removeUpload} />

          {/* Main Canvas Content */}
          {assets.length === 0 && uploadingFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <FolderIcon className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Empty Folder</h3>
              <p className="text-gray-500 mb-6">Drag & drop files here or upload files to get started.</p>
              <Link href="/upload">
                <Button>Upload Files</Button>
              </Link>
            </div>
          ) : (
            <div className="w-full h-full">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                snapToGrid
                snapGrid={[20, 20]}
                className="bg-gray-50 w-full h-full"
                style={{ width: '100%', height: '100%' }}
              >
                <Controls />
                <MiniMap 
                  className="!bg-white !border !border-gray-200"
                  nodeColor={(node) => {
                    const asset = node.data?.asset as Asset
                    if (!asset) return '#94a3b8'
                    
                    switch (asset.status) {
                      case 'ready': return '#10b981'
                      case 'processing': return '#f59e0b'
                      case 'pending': return '#3b82f6'
                      case 'error': return '#ef4444'
                      default: return '#94a3b8'
                    }
                  }}
                />
                <Background 
                  variant={BackgroundVariant.Dots} 
                  gap={12} 
                  size={1} 
                  color="#e5e7eb"
                />
              </ReactFlow>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
