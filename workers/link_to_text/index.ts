import { json } from "@smara/shared/utils";
import { getYoutubeCaption, isYoutubeUrl, getYoutubeVideoId } from "./utils/youtube";

export interface Env {
    R2: R2Bucket;
    EMBEDDING_QUEUE: Queue;
}

interface LinkIngestMessage {
    asset_id: string;
    user_id: string;
    r2_key: string;
    modality: string;
    mime: string;
    url: string;  // The YouTube or external URL
}

interface EmbeddingMessage {
    text: string;
    user_id: string;
    asset_id: string;
    r2_key: string;
    modality: string;
    chunk_id?: string;
    url?: string;  // Preserve original URL for context
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        return json({
            service: "link-to-text",
            status: "running",
            timestamp: new Date().toISOString()
        }, 405);
    },

    async queue(batch: MessageBatch<LinkIngestMessage>, env: Env): Promise<void> {
        console.log(`Processing batch of ${batch.messages.length} link messages`);
        
        for (const message of batch.messages) {
            try {
                const body = message.body;
                
                // Validate required fields
                if (!body.asset_id || !body.user_id || !body.r2_key || !body.url) {
                    console.error(`Message ${message.id}: Missing required fields`);
                    message.ack(); // Ack to avoid infinite retries on bad data
                    continue;
                }

                console.log(`Processing link for asset: ${body.asset_id}, URL: ${body.url}`);

                // Check if it's a YouTube URL
                if (!isYoutubeUrl(body.url)) {
                    console.error(`Message ${message.id}: Not a YouTube URL: ${body.url}`);
                    message.ack(); // Permanent error - not a YouTube URL
                    continue;
                }

                // Extract video ID
                const videoId = getYoutubeVideoId(body.url);
                if (!videoId) {
                    console.error(`Message ${message.id}: Could not extract video ID from URL: ${body.url}`);
                    message.ack(); // Permanent error - invalid URL format
                    continue;
                }

                console.log(`Extracted video ID: ${videoId} from ${body.url}`);

                // Fetch YouTube transcript
                const transcript = await getYoutubeCaption(videoId);
                
                if (!transcript || transcript.trim().length === 0) {
                    console.error(`Message ${message.id}: No transcript available for video: ${videoId}`);
                    message.ack(); // Permanent error - no transcript available
                    continue;
                }

                console.log(`Transcript fetched for ${body.asset_id}: ${transcript.substring(0, 100)}... (${transcript.length} chars)`);

                // Send transcript to embedding queue
                const embeddingMessage: EmbeddingMessage = {
                    text: transcript,
                    user_id: body.user_id,
                    asset_id: body.asset_id,
                    r2_key: body.r2_key,
                    modality: 'link',
                    url: body.url,
                };

                await env.EMBEDDING_QUEUE.send(embeddingMessage);
                console.log(`Sent transcript to embedding queue for asset: ${body.asset_id}`);

                // Acknowledge successful processing
                message.ack();

            } catch (err: any) {
                console.error(`Message ${message.id}: Error processing link:`, err);
                
                // Retry for transient errors (network issues, rate limits)
                if (err.message?.includes('rate limit') || 
                    err.message?.includes('timeout') || 
                    err.message?.includes('network') ||
                    err.message?.includes('ECONNREFUSED')) {
                    console.log(`Retrying message ${message.id} due to transient error`);
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