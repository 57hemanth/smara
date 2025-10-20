import { IngestMessage, Env } from "../types"

export async function processLinkMessage(message: IngestMessage, env: Env): Promise<void> {
    console.log(`Routing link to link-to-text queue: ${message.asset_id}`)
    
    // Validate that URL is provided for link modality
    if (!message.url) {
        throw new Error(`Link message missing URL field for asset ${message.asset_id}`);
    }
    
    // Send to link processing queue
    await env.LINK_INGEST_QUEUE.send({
        asset_id: message.asset_id,
        user_id: message.user_id,
        folder_id: message.folder_id,
        r2_key: message.r2_key,
        modality: message.modality,
        mime: message.mime,
        url: message.url
    });
    
    console.log(`Link message queued for processing: ${message.asset_id}, URL: ${message.url}`)
}

