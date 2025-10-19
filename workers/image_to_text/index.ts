import { json } from "@smara/shared/utils";

export interface Env {
    AI: Ai;
    R2: R2Bucket;
    EMBEDDING_QUEUE: Queue;
}

interface ImageIngestMessage {
    asset_id: string;
    user_id: string;
    workspace_id: string;
    r2_key: string;
    source_r2_key?: string;  // Original video/asset r2_key for display
    modality: string;
    mime: string;
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
}

const MODEL = "@cf/llava-hf/llava-1.5-7b-hf";
const DEFAULT_PROMPT = `
    You are an expert visual analyst describing an image for a semantic memory system.
    Describe the image precisely and objectively, focusing on what can actually be seen — not imagined.

    Include:
    - Main subjects (people, animals, objects) and their positions/actions.
    - Scene or setting (indoor/outdoor, environment, time of day, weather, lighting).
    - Colors, textures, and composition elements (foreground/background).
    - Text visible in the image (signs, labels, screens, documents).
    - Contextual details that help recall or search later (e.g., activity, event, location type).
    - Avoid artistic interpretation or emotions — describe only verifiable details that a viewer could confirm.

    End the description with one short summary sentence starting with “This image shows …”
`;

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        return json({
            service: "image-to-text",
            status: "running",
            timestamp: new Date().toISOString()
        }, 405);
    },

    async queue(batch: MessageBatch<ImageIngestMessage>, env: Env): Promise<void> {
        console.log(`Processing batch of ${batch.messages.length} image messages`);
        
        for (const message of batch.messages) {
            try {
                const body = message.body;
                
                // Validate required fields
                if (!body.asset_id || !body.user_id || !body.r2_key) {
                    console.error(`Message ${message.id}: Missing required fields (asset_id, user_id, or r2_key)`);
                    message.ack(); // Ack to avoid infinite retries on bad data
                    continue;
                }

                console.log(`Processing image for asset: ${body.asset_id}, R2 key: ${body.r2_key}`);

                // Fetch image from R2
                const obj = await env.R2.get(body.r2_key);
                if (!obj || !obj.body) {
                    console.error(`Message ${message.id}: Object not found in R2: ${body.r2_key}`);
                    message.ack(); // Ack - file doesn't exist (permanent error)
                    continue;
                }

                const imageBuf = await obj.arrayBuffer();
                const contentType = obj.httpMetadata?.contentType || null;

                // Validate image size and type
                if (imageBuf.byteLength > 15 * 1024 * 1024) {
                    console.error(`Message ${message.id}: Image too large (${imageBuf.byteLength} bytes)`);
                    message.ack(); // Ack - permanent error
                    continue;
                }

                if (
                    contentType &&
                    !/^image\/(png|jpe?g|webp|gif|bmp|tiff|svg\+xml)$/i.test(contentType)
                ) {
                    console.error(`Message ${message.id}: Invalid image type: ${contentType}`);
                    message.ack(); // Ack - permanent error
                    continue;
                }

                // Run Workers AI (LLaVA 1.5 7B)
                const input = {
                    image: [...new Uint8Array(imageBuf)],
                    prompt: DEFAULT_PROMPT,
                };

                const aiRes = await env.AI.run(MODEL, input) as any;
                
                // Extract description
                const description = aiRes?.description || "";
                
                if (!description || description.trim().length === 0) {
                    console.error(`Message ${message.id}: AI model returned no description`);
                    message.retry();
                    continue;
                }

                console.log(`Description completed for ${body.asset_id}: ${description.substring(0, 100)}...`);

                // Send description to embedding queue
                const embeddingMessage: EmbeddingMessage = {
                    text: description,
                    user_id: body.user_id,
                    workspace_id: body.workspace_id,
                    asset_id: body.asset_id,
                    r2_key: body.source_r2_key || body.r2_key,
                    source_r2_key: body.source_r2_key,
                    modality: body.modality,
                };

                await env.EMBEDDING_QUEUE.send(embeddingMessage);
                console.log(`Sent description to embedding queue for asset: ${body.asset_id}`);

                // Acknowledge successful processing
                message.ack();

            } catch (err: any) {
                console.error(`Message ${message.id}: Error processing image:`, err);
                
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