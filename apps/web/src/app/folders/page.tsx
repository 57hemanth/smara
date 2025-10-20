"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Folder, Plus, Edit2, Trash2, Calendar, ExternalLink } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { PageLayout } from "@/components/layout"
import { apiClient, type Folder as ApiFolder } from "@/lib/api"
import Link from "next/link"
import { useRouter } from "next/navigation"
// Date formatting helper
const formatRelativeDate = (date: string) => {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return '1 day ago'
  if (diffDays < 30) return `${diffDays} days ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

type Folder = ApiFolder

export default function FoldersPage() {
  const { userId } = useAuth()
  const router = useRouter()
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [editFolderName, setEditFolderName] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Set API client user ID when userId changes
  if (userId && apiClient.getUserId() !== userId) {
    apiClient.setUserId(userId)
  }

  // Fetch folders on component mount
  useEffect(() => {
    fetchFolders()
  }, [userId])

  const fetchFolders = async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError('')

      const foldersList = await apiClient.getFolders()
      setFolders(foldersList)
    } catch (err: any) {
      console.error('Error fetching folders:', err)
      setError(err.message || 'Failed to load folders')
    } finally {
      setLoading(false)
    }
  }

  const createFolder = async () => {
    if (!userId || !newFolderName.trim()) return

    try {
      setActionLoading(true)
      setError('')

      const folder = await apiClient.createFolder({ 
        name: newFolderName.trim() 
      })

      // Add new folder to list
      setFolders(prev => [...prev, folder])
      setNewFolderName('')
      setCreateDialogOpen(false)
    } catch (err: any) {
      console.error('Error creating folder:', err)
      setError(err.message || 'Failed to create folder')
    } finally {
      setActionLoading(false)
    }
  }

  const editFolder = async () => {
    if (!userId || !editingFolder || !editFolderName.trim()) return

    try {
      setActionLoading(true)
      setError('')

      const updatedFolder = await apiClient.updateFolder(editingFolder.id, {
        name: editFolderName.trim()
      })

      // Update folder in list
      setFolders(prev => prev.map(folder => 
        folder.id === editingFolder.id ? updatedFolder : folder
      ))
      setEditingFolder(null)
      setEditFolderName('')
      setEditDialogOpen(false)
    } catch (err: any) {
      console.error('Error updating folder:', err)
      setError(err.message || 'Failed to update folder')
    } finally {
      setActionLoading(false)
    }
  }

  const deleteFolder = async (folder: Folder) => {
    if (!userId || !confirm(`Are you sure you want to delete "${folder.name}"? This will also delete all files in this folder.`)) return

    try {
      setActionLoading(true)
      setError('')

      await apiClient.deleteFolder(folder.id)

      // Remove folder from list
      setFolders(prev => prev.filter(f => f.id !== folder.id))
    } catch (err: any) {
      console.error('Error deleting folder:', err)
      setError(err.message || 'Failed to delete folder')
    } finally {
      setActionLoading(false)
    }
  }

  const openEditDialog = (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent folder click
    setEditingFolder(folder)
    setEditFolderName(folder.name)
    setEditDialogOpen(true)
  }

  const handleDeleteFolder = (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent folder click
    deleteFolder(folder)
  }

  const handleFolderClick = (folder: Folder) => {
    router.push(`/folders/view?id=${folder.id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading folders...</p>
        </div>
      </div>
    )
  }

  return (
    <PageLayout title="My Folders" icon={Folder}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <p className="text-gray-600">Organize your files into folders</p>
            </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>
                  Enter a name for your new folder. You can organize your files by creating folders.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="folder-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="folder-name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                    className="col-span-3"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newFolderName.trim()) {
                        createFolder()
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  onClick={createFolder}
                  disabled={!newFolderName.trim() || actionLoading}
                >
                  {actionLoading ? 'Creating...' : 'Create Folder'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Folders Grid */}
        {folders.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No folders yet</h3>
            <p className="text-gray-600 mb-6">Create your first folder to organize your files</p>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create Folder
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {folders.map((folder) => (
              <Card 
                key={folder.id} 
                className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:border-blue-300"
                onClick={() => handleFolderClick(folder)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Folder className="w-8 h-8 text-blue-600" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{folder.name}</CardTitle>
                          <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          Created {formatRelativeDate(folder.created_at)}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => openEditDialog(folder, e)}
                        disabled={actionLoading}
                        title="Edit folder"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteFolder(folder, e)}
                        disabled={actionLoading}
                        className="text-red-600 hover:text-red-700"
                        title="Delete folder"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    {/* <p className="text-sm text-gray-600">
                      Folder ID: {folder.id.substring(0, 8)}...
                    </p> */}
                    <div className="flex items-center text-xs text-blue-600 font-medium">
                      <span>View Assets</span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </div>
                  </div>
                  {folder.updated_at !== folder.created_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Updated {formatRelativeDate(folder.updated_at)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Folder</DialogTitle>
              <DialogDescription>
                Change the name of your folder.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-folder-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-folder-name"
                  value={editFolderName}
                  onChange={(e) => setEditFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  className="col-span-3"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editFolderName.trim()) {
                      editFolder()
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={editFolder}
                disabled={!editFolderName.trim() || actionLoading}
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </PageLayout>
  )
}
