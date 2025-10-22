"use client"

import { Search, Upload, RefreshCw } from "lucide-react"

export function SearchEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
      {/* Icon */}
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl flex items-center justify-center shadow-lg">
        <Search className="w-8 h-8 text-slate-600 dark:text-slate-300" />
      </div>

      {/* Main message */}
      <div className="space-y-2 max-w-md">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
          No results found
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          We couldn't find any content matching your search. Try different keywords or check your spelling.
        </p>
      </div>

      {/* Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md w-full">
        <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
          <RefreshCw className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Try different keywords</span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
          <Upload className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Upload more content</span>
        </div>
      </div>
    </div>
  )
}

