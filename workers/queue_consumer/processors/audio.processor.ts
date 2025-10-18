import { IngestMessage, Env } from "../types"

export async function processAudioMessage(message: IngestMessage, env: Env): Promise<void> {
    console.log(`Routing audio to audio-to-text queue: ${message.asset_id}`)
    
    // Send to audio processing queue
    await env.AUDIO_INGEST_QUEUE.send({
        asset_id: message.asset_id,
        user_id: message.user_id,
        r2_key: message.r2_key,
        modality: message.modality,
        mime: message.mime
    });
    
    console.log(`Audio message queued for processing: ${message.asset_id}`)
}