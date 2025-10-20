"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { Sparkles, Loader2 } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { SearchInput, SearchResultCard, SearchEmptyState } from "@/components/search";

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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header with Search Bar (shown after first search) */}
        {hasSearched && (
          <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-white/80 backdrop-blur-md px-4 transition-all duration-500">
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
          </header>
        )}

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          {!hasSearched ? (
            /* Initial Centered Search */
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-6">
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
      </SidebarInset>
    </SidebarProvider>
  );
}
