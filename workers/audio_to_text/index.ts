import { json } from "@smara/shared/utils";

export interface Env {
    AI: Ai;
    R2: R2Bucket;
    EMBEDDING_QUEUE: Queue;
}

interface AudioIngestMessage {
    asset_id: string;
    user_id: string;
    folder_id: string;
    r2_key: string;
    source_r2_key?: string;  // Original video/asset r2_key for display
    modality: string;
    mime: string;
}

interface EmbeddingMessage {
    text: string;
    user_id: string;
    folder_id: string;
    asset_id: string;
    r2_key: string;
    source_r2_key?: string;  // Original asset r2_key for search results
    modality: string;
    chunk_id?: string;
}

const MODEL = "@cf/openai/whisper";

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        return json({
            service: "audio-to-text",
            status: "running",
            timestamp: new Date().toISOString()
        }, 405);
    },

    async queue(batch: MessageBatch<AudioIngestMessage>, env: Env): Promise<void> {
        console.log(`Processing batch of ${batch.messages.length} audio messages`);
        
        for (const message of batch.messages) {
            try {
                const body = message.body;
                
                // Validate required fields
                if (!body.asset_id || !body.user_id || !body.r2_key) {
                    console.error(`Message ${message.id}: Missing required fields (asset_id, user_id, or r2_key)`);
                    message.ack(); // Ack to avoid infinite retries on bad data
                    continue;
                }

                console.log(`Processing audio for asset: ${body.asset_id}, R2 key: ${body.r2_key}`);

                // Fetch audio from R2
                const obj = await env.R2.get(body.r2_key);
                if (!obj) {
                    console.error(`Message ${message.id}: Object not found in R2: ${body.r2_key}`);
                    message.ack(); // Ack - file doesn't exist (permanent error)
                    continue;
                }

                const arrayBuffer = await obj.arrayBuffer();

                // Run Whisper ASR
                const aiRes = await env.AI.run(
                    MODEL,
                    {
                        audio: [...new Uint8Array(arrayBuffer)],
                    }
                ) as any;

                // Extract transcription text
                const transcription = aiRes?.text || aiRes?.description || "";
                
                if (!transcription || transcription.trim().length === 0) {
                    console.error(`Message ${message.id}: AI model returned no transcription`);
                    message.retry();
                    continue;
                }

                console.log(`Transcription completed for ${body.asset_id}: ${transcription.substring(0, 100)}...`);

                // Send transcription to embedding queue
                const embeddingMessage: EmbeddingMessage = {
                    text: transcription,
                    user_id: body.user_id,
                    folder_id: body.folder_id,
                    asset_id: body.asset_id,
                    r2_key: body.source_r2_key || body.r2_key,
                    source_r2_key: body.source_r2_key,
                    modality: body.modality,
                };

                await env.EMBEDDING_QUEUE.send(embeddingMessage);
                console.log(`Sent transcription to embedding queue for asset: ${body.asset_id}`);

                // Acknowledge successful processing
                message.ack();

            } catch (err: any) {
                console.error(`Message ${message.id}: Error processing audio:`, err);
                
                // Retry for transient errors
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