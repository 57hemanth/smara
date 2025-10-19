import { json } from "@smara/shared/utils";

export interface Env {
    AI: Ai;
    VECTORIZE: Vectorize;
}

interface EmbeddingMessage {
    text: string;
    user_id: string;
    workspace_id: string;
    asset_id: string;
    r2_key: string;
    source_r2_key?: string;  // Original asset r2_key for search results
    modality: string;
    chunk_id?: string;
    url?: string;  // YouTube URL for link modality
}

const MODEL = "@cf/google/embeddinggemma-300m"

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        return json({
            service: "text-to-embedding",
            status: "running",
            timestamp: new Date().toISOString()
        }, 405);
    },
    async queue(batch: MessageBatch<EmbeddingMessage>, env: Env): Promise<void> {
        console.log(`Processing batch of ${batch.messages.length} embedding messages`);
        
        for (const message of batch.messages) {
            try {
                const body = message.body;
                
                if (!body.text || typeof body.text !== 'string' || body.text.trim().length === 0) {
                    console.error(`Message ${message.id}: Missing or invalid text field. Text: "${body.text}"`);
                    message.retry();
                    continue;
                }

                if (!body.user_id || !body.asset_id || !body.workspace_id) {
                    console.error(`Message ${message.id}: Missing required fields (user_id, asset_id, or workspace_id)`);
                    console.error(`Received body:`, JSON.stringify(body, null, 2));
                    message.retry();
                    continue;
                }

                console.log(`Processing embedding for asset: ${body.asset_id}, modality: ${body.modality}, workspace_id: ${body.workspace_id}`);

                const aiRes = await env.AI.run(
                    MODEL,
                    {
                        text: body.text
                    }
                ) as any;

                if (!aiRes?.data?.[0]) {
                    console.error(`Message ${message.id}: AI model returned no embeddings`);
                    message.retry();
                    continue;
                }

                // Create unique ID for the vector entry
                const vectorId = body.chunk_id 
                    ? `${body.asset_id}_${body.chunk_id}`
                    : body.asset_id;

                const metadata = {
                    user_id: body.user_id,
                    workspace_id: body.workspace_id,
                    asset_id: body.asset_id,
                    modality: body.modality,
                    date: new Date().toISOString(),
                    r2_key: body.r2_key,
                    chunk_id: body.chunk_id,
                    url: body.url,  // Store YouTube URL for link modality
                };

                console.log(`Upserting to Vectorize with metadata:`, JSON.stringify(metadata, null, 2));

                const vectorizeRes = await env.VECTORIZE.upsert([
                    {
                        id: vectorId,
                        values: aiRes.data[0],
                        metadata: metadata,
                    }
                ]);

                console.log(`Successfully processed embedding for ${vectorId}:`, vectorizeRes);

                // Acknowledge successful processing
                message.ack();

            } catch (err: any) {
                console.error(`Message ${message.id}: Error processing embedding:`, err);
                
                // Retry the message for transient errors
                if (err.message?.includes('rate limit') || err.message?.includes('timeout')) {
                    message.retry();
                } else {
                    // For permanent errors, ack to avoid infinite retries
                    console.error(`Permanent error, dropping message ${message.id}:`, err.message);
                    message.ack();
                }
            }
        }
    }
} satisfies ExportedHandler<Env>;