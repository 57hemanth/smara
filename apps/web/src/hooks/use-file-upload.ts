/**
 * Custom hook for managing file uploads
 */

import { useState, useCallback } from 'react'
import { apiClient } from '@/lib/api'
import { generateUploadId, getFilePrefix } from '@/lib/file-utils'

export interface UploadItem {
  id: string
  name: string
  size: number
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
  startTime: number
}

interface UseFileUploadOptions {
  userId?: string | null
  folderName?: string
  onUploadComplete?: () => void
  onError?: (error: string) => void
}

export const useFileUpload = ({ 
  userId, 
  folderName, 
  onUploadComplete,
  onError 
}: UseFileUploadOptions) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadItem[]>([])

  const uploadFiles = useCallback(async (files: FileList) => {
    if (!userId || !folderName) {
      onError?.('User ID and folder name are required')
      return
    }

    const fileArray = Array.from(files)
    
    // Initialize upload states
    const newUploads: UploadItem[] = fileArray.map(file => ({
      id: generateUploadId(),
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'uploading' as const,
      startTime: Date.now()
    }))
    
    setUploadingFiles(prev => [...prev, ...newUploads])

    // Upload files in parallel
    const uploadPromises = fileArray.map(async (file, index) => {
      const uploadId = newUploads[index].id
      
      try {
        const prefix = getFilePrefix(file.type)

        const result = await apiClient.uploadFile(file, {
          prefix,
          folder: folderName,
          onProgress: (progress) => {
            setUploadingFiles(prev => 
              prev.map(upload => 
                upload.id === uploadId 
                  ? { ...upload, progress } 
                  : upload
              )
            )
          }
        })

        // Mark as completed
        setUploadingFiles(prev => 
          prev.map(upload => 
            upload.id === uploadId 
              ? { ...upload, status: 'completed', progress: 100 } 
              : upload
          )
        )

        return result
      } catch (error: any) {
        // Mark as error
        setUploadingFiles(prev => 
          prev.map(upload => 
            upload.id === uploadId 
              ? { 
                  ...upload, 
                  status: 'error', 
                  error: error.message || 'Upload failed' 
                } 
              : upload
          )
        )
        console.error(`Upload failed for ${file.name}:`, error)
        return null
      }
    })

    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises)
    const successCount = results.filter(Boolean).length
    
    // Notify completion if any uploads succeeded
    if (successCount > 0) {
      onUploadComplete?.()
    }

    // Auto-remove completed uploads after delay
    setTimeout(() => {
      setUploadingFiles(prev => 
        prev.filter(upload => 
          !newUploads.find(newUpload => newUpload.id === upload.id)
        )
      )
    }, 3000)

  }, [userId, folderName, onUploadComplete, onError])

  const removeUpload = useCallback((uploadId: string) => {
    setUploadingFiles(prev => prev.filter(upload => upload.id !== uploadId))
  }, [])

  const clearCompleted = useCallback(() => {
    setUploadingFiles(prev => prev.filter(upload => upload.status !== 'completed'))
  }, [])

  return {
    uploadingFiles,
    uploadFiles,
    removeUpload,
    clearCompleted,
  }
}
