import { useState } from "react"

interface SearchResult {
  assetId: string
  userId: string
  modality: string
  score: number
  metadata: Record<string, any>
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Search</h3>
      
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !loading && handleSearch()}
        placeholder="Search for content..."
        disabled={loading}
        style={{
          width: '100%',
          padding: '6px 8px',
          fontSize: '12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          boxSizing: 'border-box'
        }}
      />

      <button
        onClick={handleSearch}
        disabled={!query.trim() || !userId.trim() || loading}
        style={{
          width: '100%',
          padding: '8px 12px',
          fontSize: '12px',
          fontWeight: 500,
          backgroundColor: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: !query.trim() || !userId.trim() || loading ? 'not-allowed' : 'pointer',
          opacity: !query.trim() || !userId.trim() || loading ? 0.5 : 1
        }}
      >
        {loading ? "Searching..." : "Search"}
      </button>

      {status && (
        <div
          style={{
            padding: '8px',
            fontSize: '11px',
            borderRadius: '6px',
            backgroundColor: status.includes("Error") 
              ? '#fef2f2' 
              : status.includes("✅")
              ? '#f0fdf4'
              : '#eff6ff',
            color: status.includes("Error") 
              ? '#991b1b' 
              : status.includes("✅")
              ? '#166534'
              : '#1e40af',
            border: `1px solid ${
              status.includes("Error") 
                ? '#fecaca' 
                : status.includes("✅")
                ? '#bbf7d0'
                : '#bfdbfe'
            }`
          }}
        >
          {status}
        </div>
      )}

      {results.length > 0 && (
        <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h4 style={{ fontSize: '12px', fontWeight: 500, margin: 0 }}>Results</h4>
          {results.map((result, index) => (
            <div 
              key={result.assetId + index} 
              style={{
                padding: '8px',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '11px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '2px 6px',
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 500
                }}>
                  {result.modality}
                </span>
                <span style={{ color: '#6b7280' }}>
                  {(result.score * 100).toFixed(1)}%
                </span>
              </div>
              
              {result.metadata?.text && (
                <div style={{
                  marginTop: '4px',
                  padding: '6px',
                  backgroundColor: '#fff',
                  borderRadius: '4px',
                  maxHeight: '60px',
                  overflow: 'auto',
                  fontSize: '11px',
                  color: '#374151'
                }}>
                  {result.metadata.text.length > 150 
                    ? result.metadata.text.substring(0, 150) + "..."
                    : result.metadata.text
                  }
                </div>
              )}

              {result.modality === 'link' && result.metadata?.url && (
                <div style={{ marginTop: '4px' }}>
                  <a 
                    href={result.metadata.url} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{
                      color: '#2563eb',
                      fontSize: '11px',
                      textDecoration: 'none'
                    }}
                  >
                    🔗 Open YouTube Video
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

