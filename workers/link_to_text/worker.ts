// worker.ts (runs in Workers runtime, communicates with Python container)
import { Container } from '@cloudflare/containers';
import type { MessageBatch } from '@cloudflare/workers-types';
import { isYoutubeUrl, getYoutubeVideoId } from "./utils/youtube";

export interface Env {
    R2: R2Bucket;
    EMBEDDING_QUEUE: Queue;
    TRANSCRIPT_CONTAINER: DurableObjectNamespace<TranscriptContainer>;
}

export class TranscriptContainer extends Container {
    // Must match the port your Flask app listens on
    defaultPort = 8080;
    // Optional: sleep container a bit after idle
    sleepAfter = '20s';
}

interface LinkIngestMessage {
    asset_id: string;
    user_id: string;
    folder_id: string;
    r2_key: string;
    modality: string;
    mime: string;
    url: string;  // The YouTube or external URL
}

interface EmbeddingMessage {
    text: string;
    user_id: string;
    folder_id: string;
    asset_id: string;
    r2_key: string;
    modality: string;
    chunk_id?: string;
    url?: string;  // Preserve original URL for context
    start_ms?: number;  // Timestamp for video/audio chunks
    end_ms?: number;    // Timestamp for video/audio chunks
}

interface TranscriptChunk {
    text: string;
    start_ms: number;
    end_ms: number;
    segment_count: number;
}

interface TranscriptResponse {
    success: boolean;
    transcript?: string;
    chunks?: Array<TranscriptChunk>;  // Added for chunked processing
    segments?: Array<{ text: string; start: number; duration: number }>;
    language?: string;
    video_id?: string;
    error?: string;
    error_type?: 'no_transcript' | 'transcripts_disabled' | 'video_unavailable' | 'rate_limit' | 'api_error' | 'xml_parse_error' | 'parse_error' | 'internal_error';
    segment_count?: number;
    chunk_count?: number;
    char_count?: number;
    suggestion?: string;
    raw_error?: string;
}

export default {
    // Optional HTTP endpoint for testing
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        if (url.pathname === '/health') {
            return new Response(JSON.stringify({
                service: "link-to-text",
                status: "running",
                timestamp: new Date().toISOString()
            }), {
                headers: { 'content-type': 'application/json' }
            });
        }
        return new Response('not found', { status: 404 });
    },

    // QUEUE CONSUMER — processes YouTube links
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

                // Get container instance (reuse per video ID for potential caching)
                const container = env.TRANSCRIPT_CONTAINER.getByName(videoId);

                // Fetch transcript from Python container
                const transcriptRequest = {
                    video_id: videoId,
                    languages: ['en', 'es', 'fr', 'de'], // Preferred languages
                    url: body.url
                };

                console.log(`Requesting transcript from container for video: ${videoId}`);
                
                const transcriptResponse = await container.fetch('http://container/transcript', {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify(transcriptRequest)
                });

                // Read response body once (can be used for both error and success cases)
                const responseText = await transcriptResponse.text();
                const status = transcriptResponse.status;

                if (!transcriptResponse.ok) {
                    let errorData: TranscriptResponse | null = null;
                    
                    // Try to parse as JSON
                    try {
                        errorData = JSON.parse(responseText) as TranscriptResponse;
                    } catch (parseError) {
                        // If we can't parse the error response, log the raw text
                        console.error(`Container error ${status} for video ${videoId}: Unable to parse error response: ${responseText}`);
                        // Retry for unparseable errors (might be transient)
                        message.retry();
                        continue;
                    }
                    
                    console.error(`Container error ${status} for video ${videoId}:`, errorData.error);
                    if (errorData.error_type) {
                        console.error(`Error type: ${errorData.error_type}`);
                    }
                    
                    // Handle different error types
                    if (status === 404 || errorData.error_type === 'no_transcript' || 
                        errorData.error_type === 'transcripts_disabled' || 
                        errorData.error_type === 'video_unavailable') {
                        // Permanent error - no transcript available
                        console.error(`Permanent error for video ${videoId}: ${errorData.error}`);
                        message.ack();
                        continue;
                    } else if (status === 429 || errorData.error_type === 'rate_limit') {
                        // Retry on rate limits
                        console.log(`Rate limited for video ${videoId}, retrying...`);
                        message.retry();
                        continue;
                    } else if (status === 503 || errorData.error_type === 'api_error' || 
                               errorData.error_type === 'xml_parse_error' || 
                               errorData.error_type === 'parse_error') {
                        // Retry on transient API/parsing errors (YouTube blocking, empty responses)
                        // XML parse errors often indicate YouTube blocking or empty responses - retry with delay
                        console.log(`Transient error (${errorData.error_type}) for video ${videoId}, retrying...`);
                        message.retry();
                        continue;
                    } else {
                        // Other errors - retry once
                        console.error(`Unexpected error for video ${videoId} (status: ${status}, type: ${errorData.error_type}), retrying...`);
                        message.retry();
                        continue;
                    }
                }

                // Parse successful response
                let transcriptData: TranscriptResponse;
                try {
                    transcriptData = JSON.parse(responseText) as TranscriptResponse;
                } catch (parseError) {
                    console.error(`Failed to parse successful response for video ${videoId}: ${responseText}`);
                    message.retry();
                    continue;
                }
                
                if (!transcriptData.success || !transcriptData.chunks || transcriptData.chunks.length === 0) {
                    console.error(`No transcript data for video: ${videoId}`);
                    message.ack();
                    continue;
                }

                const chunks = transcriptData.chunks;
                console.log(`Processing ${body.asset_id}: ${chunks.length} chunks, ${transcriptData.char_count || 0} chars`);
                
                for (let i = 0; i < chunks.length; i++) {
                    const chunk = chunks[i];
                    const embeddingMessage: EmbeddingMessage = {
                        text: chunk.text,
                        user_id: body.user_id,
                        folder_id: body.folder_id,
                        asset_id: body.asset_id,
                        r2_key: body.r2_key,
                        modality: 'link',
                        chunk_id: `chunk-${i + 1}-of-${chunks.length}`,
                        url: body.url,
                        // Add timestamp metadata for storage in text_chunks table
                        start_ms: chunk.start_ms,
                        end_ms: chunk.end_ms,
                    };

                    await env.EMBEDDING_QUEUE.send(embeddingMessage);
                    
                    // Small delay between chunks to avoid overwhelming the queue
                    if (i < chunks.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 50));
                    }
                }

                console.log(`Queued ${chunks.length} chunks for ${body.asset_id}`);

                // Acknowledge successful processing
                message.ack();

            } catch (err: any) {
                console.error(`Message ${message.id}: Error processing link:`, err);
                
                // Retry for transient errors (network issues, rate limits, container startup)
                if (err.message?.includes('rate limit') || 
                    err.message?.includes('timeout') || 
                    err.message?.includes('network') ||
                    err.message?.includes('ECONNREFUSED') ||
                    err.message?.includes('container') ||
                    err.code === 'ECONNREFUSED') {
                    console.log(`Retrying message ${message.id} due to transient error: ${err.message}`);
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

