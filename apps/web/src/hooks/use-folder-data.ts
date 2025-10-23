/**
 * Custom hook for fetching and managing folder data
 */

import { useState, useCallback, useEffect } from 'react'
import { apiClient, type Asset, type Folder } from '@/lib/api'

interface UseFolderDataOptions {
  folderId: string | undefined
  userId: string | null | undefined
}

export const useFolderData = ({ folderId, userId }: UseFolderDataOptions) => {
  const [folder, setFolder] = useState<Folder | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchFolderData = useCallback(async () => {
    // Wait until both userId and folderId are available
    if (!userId || !folderId) {
      setLoading(true)
      return
    }

    try {
      setLoading(true)
      setError('')

      // Fetch folder info and assets in parallel
      const [folders, folderAssets] = await Promise.all([
        apiClient.getFolders(),
        apiClient.getFolderAssets(folderId)
      ])

      // Find the current folder
      const currentFolder = folders.find(f => f.id === folderId)
      if (!currentFolder) {
        setError('Folder not found')
        return
      }

      setFolder(currentFolder)
      setAssets(folderAssets)
      
    } catch (err: any) {
      console.error('Error fetching folder data:', err)
      setError(err.message || 'Failed to load folder')
    } finally {
      setLoading(false)
    }
  }, [userId, folderId])

  const refreshAssets = useCallback(() => {
    if (folderId && userId) {
      // Just refresh the assets, not the full folder data
      apiClient.getFolderAssets(folderId)
        .then(folderAssets => setAssets(folderAssets))
        .catch(err => console.error('Error refreshing assets:', err))
    }
  }, [folderId, userId])

  useEffect(() => {
    fetchFolderData()
  }, [fetchFolderData])

  return {
    folder,
    assets,
    loading,
    error,
    refreshAssets,
    refetch: fetchFolderData,
  }
}
