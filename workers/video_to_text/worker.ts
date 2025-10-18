// worker.ts (runs in Workers runtime, not in the container)
import { Container } from '@cloudflare/containers';
import type { MessageBatch } from '@cloudflare/workers-types';
import type { Env, VideoProcessPayload } from './types';

export class VideoContainer extends Container {
  // Must match the port your Hono app listens on
  defaultPort = 8080;
  // Optional: sleep container a bit after idle
  sleepAfter = '20s';
}

export default {
  // optional HTTP to test container
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.pathname === '/health') return new Response('ok');

    if (url.pathname === '/process') {
      // For testing, allow specifying container name via query param
      const containerName = url.searchParams.get('container') || 'test';
      const container = env.VIDEO_CONTAINER.getByName(containerName);
      return container.fetch('http://container/process', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: await request.text()
      });
    }
    return new Response('not found', { status: 404 });
  },

  // QUEUE CONSUMER — processes video files
  async queue(batch: MessageBatch<VideoProcessPayload>, env: Env) {
    for (const msg of batch.messages) {
      try {
        // Get a unique container per asset for parallel processing
        const payload = typeof msg.body === 'string' ? JSON.parse(msg.body) : msg.body;
        const { asset_id, user_id, r2_key, mime } = payload;
        
        // Each video gets its own container instance (up to max_instances limit)
        const container = env.VIDEO_CONTAINER.getByName(asset_id);

        console.log(`Processing video ${asset_id} for user ${user_id}`);

        // Download video from R2
        const videoObj = await env.R2.get(r2_key);
        if (!videoObj) {
          throw new Error(`Video not found in R2: ${r2_key}`);
        }

        // Get video as array buffer
        const videoArrayBuffer = await videoObj.arrayBuffer();
        
        // Forward to container for processing with metadata in headers
        const res = await container.fetch('http://container/process', {
          method: 'POST',
          headers: {
            'content-type': mime,
            'x-asset-id': asset_id,
            'x-user-id': user_id,
            'x-r2-key': r2_key
          },
          body: videoArrayBuffer
        });

        if (!res.ok) {
          const error = await res.text();
          throw new Error(`Container error ${res.status}: ${error}`);
        }

        const result = await res.json<{
          success: boolean;
          asset_id: string;
          frames: Array<{ filename: string; data: string; size: number }>;
          audio?: { data: string; size: number };
          metadata: {
            frame_count: number;
            has_audio: boolean;
            total_size_bytes: number;
          };
        }>();

        console.log(`Extracted ${result.frames.length} frames, audio: ${result.audio ? 'yes' : 'no'}`);

        // Upload frames to R2 and send to image queue
        const framePromises = result.frames.map(async (frame, index) => {
          // Decode base64
          const frameBuffer = Uint8Array.from(atob(frame.data), c => c.charCodeAt(0));
          
          // Generate R2 key for frame (stored separately but linked to video)
          const frameR2Key = `videos/${user_id}/${asset_id}/frames/${frame.filename}`;
          
          // Upload to R2
          await env.R2.put(frameR2Key, frameBuffer, {
            httpMetadata: {
              contentType: 'image/jpeg'
            }
          });

          console.log(`Uploaded frame ${index + 1}/${result.frames.length}: ${frameR2Key}`);

          // Send to image processing queue
          // IMPORTANT: Keep original video's asset_id so search results show the video
          await env.IMAGE_QUEUE.send({
            asset_id,  // Original video asset_id
            user_id,
            r2_key: frameR2Key,
            modality: 'image',
            mime: 'image/jpeg',
            frame_index: index,
            is_video_frame: true  // Mark this as extracted from video
          });
        });

        await Promise.all(framePromises);
        console.log(`All ${result.frames.length} frames uploaded and queued`);

        // Upload audio to R2 and send to audio queue if available
        if (result.audio) {
          const audioBuffer = Uint8Array.from(atob(result.audio.data), c => c.charCodeAt(0));
          const audioR2Key = `videos/${user_id}/${asset_id}/audio.wav`;
          
          await env.R2.put(audioR2Key, audioBuffer, {
            httpMetadata: {
              contentType: 'audio/wav'
            }
          });

          console.log(`Uploaded audio: ${audioR2Key}`);

          // Send to audio processing queue
          // IMPORTANT: Keep original video's asset_id so search results show the video
          await env.AUDIO_QUEUE.send({
            asset_id,  // Original video asset_id
            user_id,
            r2_key: audioR2Key,
            modality: 'audio',
            mime: 'audio/wav',
            is_video_audio: true  // Mark this as extracted from video
          });

          console.log('Audio queued for processing');
        }

        msg.ack();
        console.log(`Successfully processed video ${asset_id}`);
      } catch (e) {
        console.error('Video processing error:', e);
        msg.retry();
      }
    }
  },
}