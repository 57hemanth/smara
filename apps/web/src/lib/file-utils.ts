/**
 * File utility functions for upload and display
 */

/**
 * Format file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * Truncate filename smartly while preserving extension
 */
export const truncateFileName = (fileName: string, maxLength: number = 25): string => {
  if (fileName.length <= maxLength) return fileName
  
  const extension = fileName.split('.').pop() || ''
  const nameWithoutExt = fileName.slice(0, fileName.lastIndexOf('.')) || fileName
  const truncatedName = nameWithoutExt.slice(0, maxLength - extension.length - 4) + '...'
  
  return extension ? `${truncatedName}.${extension}` : truncatedName
}

/**
 * Get file prefix based on MIME type
 */
export const getFilePrefix = (mimeType: string): string => {
  if (mimeType.startsWith("image/")) return "images"
  if (mimeType.startsWith("video/")) return "videos"
  if (mimeType.startsWith("audio/")) return "audio"
  return "files"
}

/**
 * Generate unique upload ID
 */
export const generateUploadId = (): string => 
  `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

/**
 * Validate file types for upload
 */
export const isValidFileType = (file: File): boolean => {
  const allowedTypes = [
    'image/', 'video/', 'audio/', 
    'application/pdf', 'text/plain', 
    'application/msword',
    'application/vnd.openxmlformats-officedocument'
  ]
  return allowedTypes.some(type => file.type.startsWith(type))
}

/**
 * Get maximum file size (5GB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024

/**
 * Validate file size
 */
export const isValidFileSize = (file: File): boolean => {
  return file.size <= MAX_FILE_SIZE
}
