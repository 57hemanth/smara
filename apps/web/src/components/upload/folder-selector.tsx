"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ChevronDown, Folder, Plus, Check } from "lucide-react"
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
  const [isOpen, setIsOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Set API client user ID when userId changes
  if (userId && apiClient.getUserId() !== userId) {
    apiClient.setUserId(userId)
  }

  // Fetch folders on component mount
  useEffect(() => {
    fetchFolders()
  }, [userId])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchFolders = async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError('')

      let foldersList = await apiClient.getFolders()
      
      // If no folders exist, create a default "My Folder"
      if (foldersList.length === 0) {
        try {
          const defaultFolder = await apiClient.createFolder({ name: "My Folder" })
          foldersList = [defaultFolder]
        } catch (createErr: any) {
          // Continue with empty list if creation fails
        }
      }
      
      setFolders(foldersList)

      // Set default folder if none selected or current value doesn't exist in folders
      if (foldersList.length > 0) {
        const currentFolderExists = foldersList.some(f => f.name === value)
        
        if (!value || !currentFolderExists) {
          const myFolder = foldersList.find(f => f.name === "My Folder")
          if (myFolder) {
            onChange(myFolder.name)
          } else {
            onChange(foldersList[0].name)
          }
        }
      }
    } catch (err: any) {
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
      setError(err.message || 'Failed to create folder')
    } finally {
      setCreating(false)
    }
  }

  const handleFolderSelect = (folderName: string) => {
    onChange(folderName)
    setIsOpen(false)
  }

  const selectedFolder = folders.find(f => f.name === value)

  return (
    <Card className="p-6 space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Folder
        </label>
        
        <div className="relative" ref={dropdownRef}>
          {/* Custom Dropdown Button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={loading}
            className={`
              w-full h-11 px-3 py-2 
              bg-white border border-gray-300 rounded-md 
              flex items-center justify-between
              text-left text-sm
              hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              transition-colors
            `}
          >
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-gray-500" />
              <span className="text-gray-900">
                {loading ? "Loading..." : (selectedFolder?.name || value || "Select a folder")}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Custom Dropdown Menu */}
          {isOpen && !loading && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-auto">
              {folders.length > 0 && (
                <>
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => handleFolderSelect(folder.name)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                    >
                      <Folder className="w-4 h-4 text-gray-500" />
                      <span className="flex-1">{folder.name}</span>
                      {folder.name === value && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </button>
                  ))}
                  <div className="border-t border-gray-200" />
                </>
              )}
              
              {folders.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500 border-b border-gray-100">
                  No folders found
                </div>
              )}
              
              <button
                type="button"
                onClick={() => {
                  setCreateDialogOpen(true)
                  setIsOpen(false)
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 text-gray-600"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Folder</span>
              </button>
            </div>
          )}
        </div>
        
        {error ? (
          <p className="text-xs text-red-600 mt-2">
            {error}
          </p>
        ) : (
          <p className="text-xs text-gray-500 mt-2">
            Files will be organized in this folder. You can select an existing folder or create a new one.
          </p>
        )}
      </div>
      
      {/* Create Folder Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newFolderName.trim() && !creating) {
                    createFolder()
                  }
                }}
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
    </Card>
  )
}