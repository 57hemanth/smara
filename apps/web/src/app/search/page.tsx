"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api";
import { Search, FileText, Image, Music, Video } from "lucide-react";
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
      {/* Background */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        {!hasSearched ? (
          /* Initial Centered Search */
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-6">
            <div className="w-full max-w-3xl space-y-10">
              {/* Header Section */}
              <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="space-y-4">
                  <h1 className="text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Search Everything
                  </h1>
                  <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    Find your images, videos, audio files, and documents instantly
                  </p>
                </div>
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

              {/* Quick Examples */}
              <div className="text-center animate-in fade-in duration-1000 delay-400">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Popular searches:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    "vacation photos",
                    "meeting recordings", 
                    "project documents",
                    "san francisco"
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => {
                        setQuery(example);
                        handleSearch();
                      }}
                      className="px-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-lg"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Results Section */
          <div className="p-6 max-w-7xl mx-auto">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-8 h-8 border-2 border-slate-300 dark:border-slate-600 border-t-primary rounded-full animate-spin"></div>
                  <p className="text-slate-600 dark:text-slate-400">Searching your content...</p>
                </div>
              ) : results.length > 0 ? (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                      Search Results
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                      Found {results.length} {results.length === 1 ? 'result' : 'results'} for "{query}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
      </div>
    </PageLayout>
  );
}
