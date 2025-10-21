"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api";
import { Sparkles, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { PageLayout } from "@/components/layout";
import { SearchInput, SearchResultCard, SearchEmptyState } from "@/components/search";
import { useAuth } from "@/hooks/use-auth";

interface SearchResult {
  assetId: string;
  userId: string;
  modality: string;
  score: number;
  metadata: Record<string, any>;
  preview?: string;
}

export default function SearchPage() {
  useAuth(); // Handles authentication
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    
    if (!query.trim() || loading) return;

    try {
      setLoading(true);
      setHasSearched(true);

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

  // Custom header for search page
  const searchHeader = hasSearched ? (
    <>
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex-1">
        <SearchInput 
          query={query}
          setQuery={setQuery}
          loading={loading}
          onSearch={handleSearch}
          variant="compact"
        />
      </div>
    </>
  ) : null;

  return (
    <PageLayout 
      showHeader={hasSearched}
      headerContent={searchHeader}
    >
      {!hasSearched ? (
        /* Initial Centered Search */
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-6">
          <div className="w-full max-w-2xl space-y-8">
            {/* Logo/Title */}
            <div className="text-center space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  SMARA Search
                </h1>
              </div>
              <p className="text-gray-600 text-lg">
                Search your images, videos, audio, and documents
              </p>
            </div>

            {/* Search Form */}
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
              <SearchInput 
                query={query}
                setQuery={setQuery}
                loading={loading}
                onSearch={handleSearch}
                variant="centered"
              />
            </div>

            {/* Quick Tips */}
            <div className="text-center text-sm text-gray-500 animate-in fade-in duration-1000 delay-300">
              <p>Try: "mountain sunset" • "jazz music" • "project presentation"</p>
            </div>
          </div>
        </div>
      ) : (
        /* Results Section */
        <div className="p-6 max-w-6xl mx-auto w-full">
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
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
                    <SearchResultCard 
                      key={result.assetId + index} 
                      result={result} 
                      index={index} 
                    />
                  ))}
                </div>
              </>
            ) : (
              <SearchEmptyState />
            )}
          </div>
        </div>
      )}
    </PageLayout>
  );
}
