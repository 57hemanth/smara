"use client"

import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchInputProps {
  query: string
  setQuery: (query: string) => void
  loading: boolean
  onSearch: (e?: React.FormEvent) => void
  variant?: "centered" | "compact"
}

export function SearchInput({ 
  query, 
  setQuery, 
  loading, 
  onSearch,
  variant = "centered"
}: SearchInputProps) {
  if (variant === "compact") {
    return (
      <form onSubmit={onSearch} className="flex items-center gap-3 w-full">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your content..."
            className="pl-10 h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            disabled={loading}
          />
        </div>
        <Button 
          type="submit"
          disabled={!query.trim() || loading}
          className="h-12 px-6 bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </Button>
      </form>
    )
  }

  // Centered variant (initial state)
  return (
    <form 
      onSubmit={onSearch}
      className="space-y-4 w-full max-w-2xl"
    >
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 transition-colors group-focus-within:text-blue-600" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What are you looking for?"
          className="pl-14 h-16 text-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-2xl shadow-sm hover:shadow-md transition-all"
          disabled={loading}
          autoFocus
        />
      </div>

      <Button 
        type="submit"
        disabled={!query.trim() || loading}
        className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-lg hover:shadow-xl transition-all"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Searching...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search
          </span>
        )}
      </Button>
    </form>
  )
}

