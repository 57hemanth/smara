import { IngestMessage, Env } from "../types"

export async function processImageMessage(message: IngestMessage, env: Env): Promise<void> {
    console.log(`Processing image: ${message.asset_id}`)
    
    // Call image-to-text service
    const response = await env.IMAGE_TO_TEXT_SERVICE.fetch('http://localhost/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: message.r2_key })
    })
    
    if (!response.ok) {
      throw new Error(`Image processing failed: ${response.status}`)
    }
    
    const result = await response.json() as any
    console.log(`Image processed successfully: ${message.asset_id}`, result)
    
    // Generate text embeddings for the description
    await env.EMBEDDING_QUEUE.send({
      text: result.description,
      user_id: message.user_id,
      asset_id: message.asset_id,
      r2_key: message.r2_key,
      modality: message.modality
    });
}