import { useState } from "react";
import { MediaPreview } from "./MediaPreview";

interface SearchResult {
  assetId: string;
  userId: string;
  modality: string;
  score: number;
  metadata: Record<string, any>;
  preview?: string;
}

interface SearchComponentProps {
  userId: string;
  onSearch: (query: string, options?: { modality?: string; limit?: number }) => Promise<SearchResult[]>;
}

/**
 * SearchComponent for querying uploaded files
 * 
 * Accepts a search callback function to allow different API implementations
 * (e.g., web app API client vs extension API client)
 */
export function SearchComponent({ userId, onSearch }: SearchComponentProps) {
  const [query, setQuery] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    try {
      if (!query.trim() || !userId.trim()) return;

      setLoading(true);
      setStatus("Searching...");
      setResults([]);

      const searchResults = await onSearch(query);

      setResults(searchResults);
      setStatus(`Found ${searchResults.length} results ✅`);

    } catch (e: any) {
      console.error("Search error:", e);
      setStatus(`Error: ${e.message || "Search failed"}`);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">Search</h3>
      
      <div className="space-y-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && handleSearch()}
          placeholder="Search for files..."
          className="block w-full px-3 py-2 text-xs border rounded"
          disabled={loading}
        />
      </div>

      <button
        onClick={handleSearch}
        disabled={!query.trim() || !userId.trim() || loading}
        className="w-full px-3 py-2 text-xs rounded bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Searching..." : "Search"}
      </button>

      {status && (
        <div className={`p-2 rounded text-xs ${
          status.includes("Error") 
            ? "bg-red-50 text-red-700 border border-red-200" 
            : status.includes("✅")
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-accent text-accent-foreground border border-accent"
        }`}>
          {status}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <h4 className="text-xs font-medium text-gray-700">Results</h4>
          {results.map((result, index) => (
            <div key={result.assetId + index} className="p-2 bg-gray-50 rounded border space-y-1">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-accent text-accent-foreground">
                  {result.modality}
                </span>
                <span className="text-xs text-gray-600">
                  {(result.score * 100).toFixed(1)}%
                </span>
              </div>
              
              {result.metadata?.text && (
                <div className="text-xs text-gray-700 bg-white rounded p-1.5 max-h-16 overflow-y-auto">
                  {result.metadata.text.length > 100 
                    ? result.metadata.text.substring(0, 100) + "..."
                    : result.metadata.text
                  }
                </div>
              )}

              {(result.preview || (result.modality === 'link' && result.metadata?.url)) && (
                <div className="space-y-1">
                  <div className="text-xs text-gray-600">Preview:</div>
                  <MediaPreview 
                    url={result.preview || result.metadata?.url} 
                    modality={result.modality}
                    maxHeight="120px"
                    metadata={result.metadata}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

