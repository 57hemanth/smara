"use client"

import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface FolderSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function FolderSelector({ value, onChange }: FolderSelectorProps) {
  return (
    <Card className="p-6 space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Folder
        </label>
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="My Folder"
          className="h-11"
        />
        <p className="text-xs text-gray-500 mt-2">
          Files will be organized in this folder. Default: "My Folder"
        </p>
      </div>
    </Card>
  )
}

