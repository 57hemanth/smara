import { useState } from "react"

interface SearchResult {
  assetId: string
  userId: string
  modality: string
  score: number
  metadata: Record<string, any>
  preview?: string
}

interface SearchComponentProps {
  userId: string
  onSearch: (query: string) => Promise<SearchResult[]>
}

export function SearchComponent({ userId, onSearch }: SearchComponentProps) {
  const [query, setQuery] = useState<string>("")
  const [status, setStatus] = useState<string>("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  async function handleSearch() {
    try {
      if (!query.trim() || !userId.trim()) return

      setLoading(true)
      setStatus("Searching...")
      setResults([])

      const searchResults = await onSearch(query)

      setResults(searchResults)
      setStatus(`Found ${searchResults.length} results ✅`)

    } catch (e: any) {
      console.error("Search error:", e)
      setStatus(`Error: ${e.message || "Search failed"}`)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const getModalityEmoji = (modality: string) => {
    switch (modality) {
      case 'image': return '🖼️'
      case 'audio': return '🎵'
      case 'video': return '🎥'
      case 'link': return '🔗'
      case 'text': return '📝'
      default: return '📄'
    }
  }

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !loading && handleSearch()}
          placeholder="Search your memories..."
        disabled={loading}
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all disabled:opacity-50 disabled:bg-slate-50"
        />
        <svg className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        disabled={!query.trim() || !userId.trim() || loading}
        className="w-full px-4 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Searching...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search</span>
          </>
        )}
      </button>

      {/* Status Message */}
      {status && (
        <div className={`px-3 py-2 rounded-lg text-xs font-medium ${
              status.includes("Error") 
            ? 'bg-red-50 text-red-700 border border-red-200' 
                : status.includes("✅")
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {status}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Results ({results.length})
          </h4>
          {results.map((result, index) => (
            <div 
              key={result.assetId + index} 
              className="bg-white rounded-lg overflow-hidden border border-slate-200 hover:border-primary/30 hover:shadow-sm transition-all duration-200 cursor-pointer"
            >
              {/* Preview Image/Video */}
              {(result.modality === 'image' || result.modality === 'video') && (
                <div className="relative w-full h-32 bg-gradient-to-br from-slate-100 to-slate-200">
                  {result.preview ? (
                    <>
                      <img 
                        src={result.preview} 
                        alt={result.modality}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                          const placeholder = img.nextElementSibling as HTMLElement;
                          if (placeholder) placeholder.style.display = 'flex';
                        }}
                      />
                      <div className="absolute inset-0 hidden items-center justify-center">
                        {result.modality === 'video' ? (
                          <svg className="w-12 h-12 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                          </svg>
                        ) : (
                          <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      {result.modality === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                          <svg className="w-10 h-10 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      {result.modality === 'video' ? (
                        <svg className="w-12 h-12 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                      ) : (
                        <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-base">
                      {getModalityEmoji(result.modality)}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                  {result.modality}
                </span>
                  </div>
                  {/* <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-xs text-slate-600 font-medium">
                      {(result.score * 100).toFixed(0)}%
                </span>
                  </div> */}
              </div>
              
              {result.metadata?.text && (
                  <div className="bg-slate-50 rounded-md px-2.5 py-2 text-[11px] text-slate-700 leading-relaxed max-h-16 overflow-auto border border-slate-100">
                    {result.metadata.text.length > 100 
                      ? result.metadata.text.substring(0, 100) + "..."
                    : result.metadata.text
                  }
                </div>
              )}

              {result.modality === 'link' && result.metadata?.url && (
                  <a 
                    href={result.metadata.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center space-x-1.5 text-primary hover:text-primary/80 text-xs font-medium transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span>Open Link</span>
                  </a>
                )}
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

