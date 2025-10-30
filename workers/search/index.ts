import { json } from "@smara/shared/utils";

export interface Env {
    AI: Ai;
    VECTORIZE: Vectorize;
}
const MODEL = "@cf/google/embeddinggemma-300m"

type ReqBody = {
    query: string;
    topK: number;
    user_id: string;
    minScore?: number; // Optional minimum score threshold
}

export default{
    async fetch(request: Request, env: Env): Promise<Response> {
        try {
            if (request.method !== "POST") {
                return json({ error: "Use POST" }, 405);
            }

            const body = (await request.json()) as ReqBody;
            
            const queryVector = await env.AI.run(
                MODEL,
                {
                    text: body.query
                }
            ) as any;

            const vectorizeRes = await env.VECTORIZE.query(queryVector.data[0], {
                topK: body.topK || 10,
                filter: {
                    user_id: body.user_id
                },
                returnMetadata: true
            });

            // Filter results by minimum score (default 0.4 for relevance)
            const minScore = body.minScore ?? 0.4;
            const filteredResults = vectorizeRes.matches.filter((result: any) => result.score >= minScore);

            // Aggregate chunks by asset_id for documents that were chunked
            const aggregatedResults = aggregateChunkResults(filteredResults);

            console.log(`Filtered ${vectorizeRes.matches.length} results to ${filteredResults.length}, aggregated to ${aggregatedResults.length} documents with minScore: ${minScore}`);

            return json({ 
                data: aggregatedResults,
                total: aggregatedResults.length,
                minScore: minScore
            }, 200);
        }
        catch (err: any) {
            console.error(err);
            return json({ error: err?.message || "Internal error" }, 500);
        }
    }
}

/**
 * Aggregate multiple chunk results from the same document into a single result
 */
function aggregateChunkResults(results: any[]): any[] {
    const documentMap = new Map<string, any>();

    for (const result of results) {
        const metadata = result.metadata || {};
        const assetId = metadata.asset_id;
        
        if (!assetId) {
            // Non-chunked result, add as-is
            documentMap.set(result.id, result);
            continue;
        }

        const existing = documentMap.get(assetId);
        
        if (!existing) {
            // First chunk for this document
            documentMap.set(assetId, {
                ...result,
                id: assetId, // Use asset_id as the main ID
                score: result.score,
                chunkCount: 1,
                bestChunkId: metadata.chunk_id || result.id,
                allChunks: [result]
            });
        } else {
            // Additional chunk for same document
            existing.chunkCount++;
            existing.allChunks.push(result);
            
            // Update with best scoring chunk's data
            if (result.score > existing.score) {
                existing.score = result.score;
                existing.bestChunkId = metadata.chunk_id || result.id;
                existing.metadata = { ...existing.metadata, ...metadata };
            }
            
            // Optionally combine text excerpts (if available in metadata)
            if (metadata.text && existing.metadata.text) {
                // Combine text from chunks (truncate if too long)
                const combinedText = `${existing.metadata.text} ... ${metadata.text}`;
                existing.metadata.text = combinedText.length > 500 
                    ? combinedText.substring(0, 500) + '...' 
                    : combinedText;
            }
        }
    }

    // Convert map to array and sort by score
    return Array.from(documentMap.values())
        .sort((a, b) => b.score - a.score);
}