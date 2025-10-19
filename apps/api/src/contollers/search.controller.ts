import { Context } from "hono";
import type { Env, Variables } from "../types/env";

interface SearchWorkerResponse {
  data: {
    count: number;
    matches: Array<{
      id: string;
      score: number;
      metadata: {
        date: string;
        modality: string;
        r2_key: string;
        user_id: string;
        workspace_id?: string;
        asset_id?: string;
        chunk_id?: string;
        url?: string;
      };
    }>;
  };
}

interface SearchResult {
  assetId: string;
  userId: string;
  modality: string;
  score: number;
  metadata: Record<string, any>;
  preview?: string;
}

class SearchController {
  static async search(c: Context<{ Bindings: Env; Variables: Variables }>) {
    try {
      const body = await c.req.json();
      const { query, user_id, modality } = body;
      
      if (!query?.trim()) {
        return c.json({ error: 'Query is required' }, 400);
      }

      // Get user ID from header (later this will come from auth)
      const userId = user_id || c.req.header('X-User-Id') || 'anon';

      // Call the search worker via service binding
      const searchRequest = new Request('https://localhost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          user_id: userId
        }),
      });
      
      const searchResponse = await c.env.SEARCH_WORKER.fetch(searchRequest);

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error('Search worker error:', errorText);
        return c.json({ error: 'Search service unavailable' }, 503);
      }

      const searchData: SearchWorkerResponse = await searchResponse.json();

      // Transform results and add R2 URLs
      const results: SearchResult[] = await Promise.all(
        searchData.data.matches.map(async (match) => {
          let preview: string | undefined;

          // Generate public URL for R2 object
          if (match.metadata.r2_key && c.env.R2_PUBLIC_BASE_URL) {
            try {
              preview = `${c.env.R2_PUBLIC_BASE_URL}/${match.metadata.r2_key}`;
            } catch (error) {
              console.error('Error generating R2 URL:', error);
              // Continue without preview URL
            }
          }

          return {
            assetId: match.id,
            userId: match.metadata.user_id,
            modality: match.metadata.modality,
            score: match.score,
            metadata: {
              date: match.metadata.date,
              r2_key: match.metadata.r2_key,
              ...(match.metadata.workspace_id && { workspace_id: match.metadata.workspace_id }),
              ...(match.metadata.asset_id && { asset_id: match.metadata.asset_id }),
              ...(match.metadata.chunk_id && { chunk_id: match.metadata.chunk_id }),
              ...(match.metadata.url && { url: match.metadata.url }),
            },
            ...(preview && { preview }),
          };
        })
      );

      // Filter by modality if requested
      const filteredResults = modality
        ? results.filter(result => result.modality === modality)
        : results;

      return c.json(filteredResults, 200);

    } catch (err: any) {
      console.error('Search error:', err);
      return c.json({ error: err?.message || 'Search failed' }, 500);
    }
  }
}

export { SearchController };
