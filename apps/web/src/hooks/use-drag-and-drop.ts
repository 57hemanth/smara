/**
 * Custom hook for drag and drop file handling
 */

import { useState, useCallback, useRef } from 'react'
import { isValidFileType, isValidFileSize } from '@/lib/file-utils'

interface UseDragAndDropOptions {
  onFilesDropped: (files: FileList) => void
  onError?: (error: string) => void
}

export const useDragAndDrop = ({ onFilesDropped, onError }: UseDragAndDropOptions) => {
  const [isDragging, setIsDragging] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  const validateFiles = useCallback((files: FileList): string | null => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      if (!isValidFileType(file)) {
        return `File type not supported: ${file.name}`
      }
      
      if (!isValidFileSize(file)) {
        return `File too large: ${file.name} (max 5GB)`
      }
    }
    return null
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Only set dragging to false if we're leaving the drop area entirely
    if (dropRef.current && !dropRef.current.contains(e.relatedTarget as Element)) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    // Validate files
    const validationError = validateFiles(files)
    if (validationError) {
      onError?.(validationError)
      return
    }

    onFilesDropped(files)
  }, [onFilesDropped, onError, validateFiles])

  const dragHandlers = {
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
  }

  return {
    isDragging,
    dropRef,
    dragHandlers,
  }
}
