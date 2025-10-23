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

            // Filter results by minimum score (default 0.1 for relevance)
            const minScore = body.minScore ?? 0.4;
            const filteredResults = vectorizeRes.matches.filter((result: any) => result.score >= minScore);

            console.log(`Filtered ${vectorizeRes.matches.length} results to ${filteredResults.length} with minScore: ${minScore}`);

            return json({ 
                data: filteredResults,
                total: filteredResults.length,
                minScore: minScore
            }, 200);
        }
        catch (err: any) {
            console.error(err);
            return json({ error: err?.message || "Internal error" }, 500);
        }
    }
}