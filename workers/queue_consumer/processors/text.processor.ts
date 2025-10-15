import { IngestMessage, Env } from "../types"

export async function processTextMessage(message: IngestMessage, env: Env): Promise<void> {
    console.log(`Processing text: ${message.asset_id}`)
    
    // For text files, read from R2 and process directly
    const obj = await env.R2.get(message.r2_key)
    if (!obj) {
      throw new Error(`Text file not found in R2: ${message.r2_key}`)
    }
    
    const text = await obj.text()
    console.log(`Text file loaded: ${message.asset_id}, length: ${text.length}`)
    
    // Generate embeddings
    await env.EMBEDDING_QUEUE.send({
      text: text,
      user_id: message.user_id,
      asset_id: message.asset_id,
      r2_key: message.r2_key,
      modality: message.modality
    });
}