import { IngestMessage, Env } from "../types"

export async function processDocumentMessage(message: IngestMessage, env: Env): Promise<void> {
    console.log(`Routing document to doc-to-text queue: ${message.asset_id}`)
    
    // Send to document processing queue
    await env.DOC_INGEST_QUEUE.send({
        asset_id: message.asset_id,
        user_id: message.user_id,
        folder_id: message.folder_id,
        r2_key: message.r2_key,
        modality: message.modality,
        mime: message.mime
    });
    
    console.log(`Document message queued for processing: ${message.asset_id}`)
}

