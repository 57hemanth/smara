import { IngestMessage, Env } from "../types"

export async function processImageMessage(message: IngestMessage, env: Env): Promise<void> {
    console.log(`Routing image to image-to-text queue: ${message.asset_id}`)
    
    // Send to image processing queue
    await env.IMAGE_INGEST_QUEUE.send({
        asset_id: message.asset_id,
        user_id: message.user_id,
        workspace_id: message.workspace_id,
        r2_key: message.r2_key,
        modality: message.modality,
        mime: message.mime
    });
    
    console.log(`Image message queued for processing: ${message.asset_id}`)
}