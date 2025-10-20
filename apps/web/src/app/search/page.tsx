"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { MediaPreview } from "@/components";
import { Search, Sparkles, Loader2, FileText, Image as ImageIcon, Music, Video, Link as LinkIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SearchResult {
  assetId: string;
  userId: string;
  modality: string;
  score: number;
  metadata: Record<string, any>;
  preview?: string;
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem("smara_user_id");
    const storedToken = localStorage.getItem("smara_token");
    
    if (storedUserId && storedToken) {
      setIsAuthenticated(true);
      apiClient.setUserId(storedUserId);
    } else {
      router.push("/login");
    }
  }, [router]);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    
    if (!query.trim() || loading) return;

    try {
      setLoading(true);
      setHasSearched(true);

      // Search through API
      const searchResults = await apiClient.search(query);
      setResults(searchResults);

      console.log("Search results:", searchResults);
    } catch (e: any) {
      console.error("Search error:", e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const getModalityIcon = (modality: string) => {
    switch (modality) {
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      case 'audio':
        return <Music className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'link':
        return <LinkIcon className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Search Header - Shows after first search */}
      <div 
        className={`fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50 transition-all duration-500 ${
          hasSearched ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="max-w-4xl mx-auto px-6 py-4">
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask me anything..."
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
        </div>
      </div>

      {/* Main Content */}
      <div 
        className={`transition-all duration-700 ${
          hasSearched ? 'pt-28' : 'pt-0'
        }`}
      >
        {/* Initial Centered Search Box */}
        <div 
          className={`transition-all duration-700 ${
            hasSearched 
              ? 'opacity-0 scale-95 pointer-events-none absolute' 
              : 'opacity-100 scale-100'
          }`}
        >
          <div className="flex flex-col items-center justify-center min-h-screen px-6">
            <div className="w-full max-w-2xl space-y-8">
              {/* Logo/Title */}
              <div className="text-center space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    SMARA Search
                  </h1>
                </div>
                <p className="text-gray-600 text-lg">
                  Search your images, videos, audio, and documents
                </p>
              </div>

              {/* Search Form */}
              <form 
                onSubmit={handleSearch}
                className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200"
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

              {/* Quick Tips */}
              <div className="text-center text-sm text-gray-500 animate-in fade-in duration-1000 delay-300">
                <p>Try: "mountain sunset" • "jazz music" • "project presentation"</p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {hasSearched && (
          <div className="max-w-4xl mx-auto px-6 pb-12">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                  <p className="text-gray-600">Searching through your content...</p>
                </div>
              ) : results.length > 0 ? (
                <>
                  <div className="flex items-center justify-between py-4">
                    <h2 className="text-lg text-gray-700">
                      Found <span className="font-semibold text-gray-900">{results.length}</span> results
                    </h2>
                  </div>

                  <div className="grid gap-4">
                    {results.map((result, index) => (
                      <Card
                        key={result.assetId + index}
                        className="p-6 hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-blue-300 animate-in fade-in slide-in-from-bottom-2"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                              {getModalityIcon(result.modality)}
                              <span className="capitalize">{result.modality}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                              {(result.score * 100).toFixed(0)}% match
                            </div>
                          </div>
                        </div>

                        {/* Preview */}
                        {result.preview && (
                          <div className="mb-4 rounded-lg overflow-hidden bg-gray-50">
                            <MediaPreview url={result.preview} modality={result.modality} />
                          </div>
                        )}

                        {/* Content/Metadata */}
                        <div className="space-y-3 text-sm">
                          {result.metadata?.text && (
                            <div>
                              <p className="text-gray-700 leading-relaxed line-clamp-3">
                                {result.metadata.text}
                              </p>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                            {result.metadata?.date && (
                              <div className="flex items-center gap-1">
                                <span>📅</span>
                                <span>{new Date(result.metadata.date).toLocaleDateString()}</span>
                              </div>
                            )}
                            {result.metadata?.folder_id && (
                              <div className="flex items-center gap-1">
                                <span>📁</span>
                                <span>Folder: {result.metadata.folder_id.slice(0, 8)}</span>
                              </div>
                            )}
                          </div>

                          {/* Expandable Details */}
                          <details className="group">
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-700 text-xs font-medium">
                              View details
                            </summary>
                            <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-2 text-xs">
                              <div>
                                <span className="font-medium text-gray-700">Asset ID:</span>{" "}
                                <code className="bg-gray-200 px-2 py-1 rounded">
                                  {result.assetId}
                                </code>
                              </div>
                              {result.metadata?.r2_key && (
                                <div>
                                  <span className="font-medium text-gray-700">File:</span>{" "}
                                  <code className="bg-gray-200 px-2 py-1 rounded break-all">
                                    {result.metadata.r2_key}
                                  </code>
                                </div>
                              )}
                              {result.preview && (
                                <div>
                                  <a 
                                    className="text-blue-600 hover:underline inline-flex items-center gap-1" 
                                    href={result.preview} 
                                    target="_blank" 
                                    rel="noreferrer"
                                  >
                                    <LinkIcon className="w-3 h-3" />
                                    Open in new tab
                                  </a>
                                </div>
                              )}
                            </div>
                          </details>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
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
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
