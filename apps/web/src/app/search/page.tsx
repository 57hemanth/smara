"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api";
import { MediaPreview } from "@/components";

interface SearchResult {
  assetId: string;
  userId: string;
  modality: string;
  score: number;
  metadata: Record<string, any>;
  preview?: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState<string>("");
  const [userId, setUserId] = useState<string>("demo-user");
  const [status, setStatus] = useState<string>("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    try {
      if (!query.trim()) return;

      setLoading(true);
      setStatus("Searching...");
      setResults([]);

      // Set user ID (later this will come from auth)
      apiClient.setUserId(userId);

      // Search through API
      const searchResults = await apiClient.search(query);

      setResults(searchResults);
      setStatus(`Found ${searchResults.length} results ✅`);

      console.log("Search results:", searchResults);

    } catch (e: any) {
      console.error("Search error:", e);
      setStatus(`Error: ${e.message || "Search failed"}`);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Search Your Files</h1>

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          User ID (for testing - will use auth later)
        </label>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter user ID"
          className="block w-full px-3 py-2 border rounded-lg text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Search Query</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && handleSearch()}
          placeholder="Search for images, audio, video, or text..."
          className="block w-full px-3 py-2 border rounded-lg text-sm"
        />
      </div>

      <button
        onClick={handleSearch}
        disabled={!query.trim() || loading}
        className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Searching..." : "Search"}
      </button>

      {status && (
        <div className={`p-3 rounded-lg text-sm ${
          status.includes("Error") 
            ? "bg-red-50 text-red-700 border border-red-200" 
            : status.includes("✅")
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-blue-50 text-blue-700 border border-blue-200"
        }`}>
          {status}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Search Results</h2>
          <div className="grid gap-4">
            {results.map((result, index) => (
              <div key={result.assetId + index} className="p-4 bg-gray-50 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {result.modality}
                  </span>
                  <span className="text-sm text-gray-600">
                    Score: {(result.score * 100).toFixed(1)}%
                  </span>
                </div>
                
                <div className="text-sm space-y-1">
                  <div>
                    <span className="font-medium">Asset ID:</span>{" "}
                    <code className="text-xs bg-gray-200 px-1 py-0.5 rounded">
                      {result.assetId}
                    </code>
                  </div>
                  
                  {result.metadata?.text && (
                    <div>
                      <span className="font-medium">Content:</span>
                      <div className="mt-1 p-2 bg-white rounded border text-xs text-gray-700 max-h-24 overflow-y-auto">
                        {result.metadata.text}
                      </div>
                    </div>
                  )}

                  {result.metadata?.date && (
                    <div>
                      <span className="font-medium">Date:</span>{" "}
                      <span className="text-xs text-gray-600">
                        {new Date(result.metadata.date).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {result.metadata?.r2_key && (
                    <div>
                      <span className="font-medium">File:</span>{" "}
                      <code className="text-xs bg-gray-200 px-1 py-0.5 rounded break-all">
                        {result.metadata.r2_key}
                      </code>
                    </div>
                  )}
                  
                  {result.preview && (
                    <div>
                      <span className="font-medium">Preview:</span>
                      <div className="mt-2 space-y-2">
                        <MediaPreview url={result.preview} modality={result.modality} />
                        <a 
                          className="text-blue-600 hover:underline text-xs inline-block" 
                          href={result.preview} 
                          target="_blank" 
                          rel="noreferrer"
                        >
                          Open in new tab
                        </a>
                      </div>
                    </div>
                  )}

                  {result.metadata && Object.keys(result.metadata).filter(key => !['text', 'date', 'r2_key'].includes(key)).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                        Additional metadata ({Object.keys(result.metadata).filter(key => !['text', 'date', 'r2_key'].includes(key)).length})
                      </summary>
                      <div className="mt-1 text-xs ml-4 space-y-1">
                        {Object.entries(result.metadata)
                          .filter(([key]) => !['text', 'date', 'r2_key'].includes(key))
                          .map(([key, value]) => (
                            <div key={key}>
                              <span className="font-mono text-gray-600">{key}:</span> {String(value)}
                            </div>
                          ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800">
          <strong>Note:</strong> Search is powered by vector embeddings via Vectorize. 
          Make sure the search worker and <code className="bg-yellow-100 px-1 py-0.5 rounded">apps/api</code> are running.
        </p>
      </div>
    </div>
  );
}