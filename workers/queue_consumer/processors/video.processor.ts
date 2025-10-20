import type { Env, IngestMessage } from '../types'

/**
 * Process video content by sending to video processing queue
 * The video worker will extract frames and audio, then route them
 * to image and audio queues respectively
 */
export async function processVideoMessage(
  message: IngestMessage,
  env: Env
): Promise<void> {
  console.log(`Routing video ${message.asset_id} to video processing queue`)

  // Send to video processing queue
  await env.VIDEO_INGEST_QUEUE.send({
    asset_id: message.asset_id,
    user_id: message.user_id,
    folder_id: message.folder_id,
    r2_key: message.r2_key,
    modality: message.modality,
    mime: message.mime
  })

  console.log(`Video ${message.asset_id} queued for processing`)
}

