"use client"

import { Search } from "lucide-react"

export function SearchEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
        <Search className="w-10 h-10 text-gray-400" />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
        <p className="text-gray-600">
          Try adjusting your search query or upload some content first
        </p>
      </div>
    </div>
  )
}

