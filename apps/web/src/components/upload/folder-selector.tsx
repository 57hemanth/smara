"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Folder, Plus } from "lucide-react"
import { apiClient, type Folder as ApiFolder } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"

interface FolderSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function FolderSelector({ value, onChange }: FolderSelectorProps) {
  const { userId } = useAuth()
  const [folders, setFolders] = useState<ApiFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

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

      // Set default folder if none selected and there are folders
      if (!value && foldersList.length > 0) {
        const myFolder = foldersList.find(f => f.name === "My Folder")
        if (myFolder) {
          onChange(myFolder.name)
        } else {
          onChange(foldersList[0].name)
        }
      }
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
      setCreating(true)
      setError('')

      const folder = await apiClient.createFolder({ 
        name: newFolderName.trim() 
      })

      // Add new folder to list and select it
      setFolders(prev => [...prev, folder])
      onChange(folder.name)
      setNewFolderName('')
      setCreateDialogOpen(false)
    } catch (err: any) {
      console.error('Error creating folder:', err)
      setError(err.message || 'Failed to create folder')
    } finally {
      setCreating(false)
    }
  }

  const handleFolderSelect = (folderName: string) => {
    onChange(folderName)
  }

  const selectedFolder = folders.find(f => f.name === value)

  return (
    <Card className="p-6 space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Folder
        </label>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-11 w-full justify-between"
              disabled={loading}
            >
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4" />
                <span>{loading ? "Loading..." : (selectedFolder?.name || value || "Select a folder")}</span>
              </div>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent className="w-full min-w-[var(--radix-dropdown-menu-trigger-width)]">
            {folders.length > 0 && (
              <>
                {folders.map((folder) => (
                  <DropdownMenuItem
                    key={folder.id}
                    onClick={() => handleFolderSelect(folder.name)}
                    className="cursor-pointer"
                  >
                    <Folder className="w-4 h-4 mr-2" />
                    {folder.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )}
            
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Folder
                </DropdownMenuItem>
              </DialogTrigger>
              
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Folder</DialogTitle>
                  <DialogDescription>
                    Enter a name for your new folder.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="folder-name">Folder Name</Label>
                    <Input
                      id="folder-name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="My New Folder"
                      className="mt-2"
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setCreateDialogOpen(false)}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={createFolder}
                    disabled={!newFolderName.trim() || creating}
                  >
                    {creating ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <p className="text-xs text-gray-500 mt-2">
          Files will be organized in this folder. You can select an existing folder or create a new one.
        </p>
      </div>
    </Card>
  )
}

