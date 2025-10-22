"use client"

import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"

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
      <form onSubmit={onSearch} className="w-full">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin" />
          )}
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your content..."
            className="pl-12 pr-12 h-12 text-base bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all placeholder:text-slate-400"
            disabled={loading}
          />
        </div>
      </form>
    )
  }

  // Centered variant (initial state)
  return (
    <form 
      onSubmit={onSearch}
      className="w-full"
    >
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin" />
        )}
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your content... (Press Enter)"
          className="pl-12 pr-12 h-14 text-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all placeholder:text-slate-400"
          disabled={loading}
          autoFocus
        />
      </div>
    </form>
  )
}

