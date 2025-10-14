import { IngestMessage, Env } from "../types"

export async function processAudioMessage(message: IngestMessage, env: Env): Promise<void> {
    console.log(`Processing audio: ${message.asset_id}`)
    
    // Call audio-to-text service (Whisper)
    const response = await env.AUDIO_TO_TEXT_SERVICE.fetch('http://localhost/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: message.r2_key })
    })
    
    if (!response.ok) {
      throw new Error(`Audio processing failed: ${response.status}`)
    }
    
    const result = await response.json() as any
    console.log(`Audio processed successfully: ${message.asset_id}`, result)
    
    // Store transcription as text chunks
    const transcription = result.description || result.raw_response?.text || ''
    if (transcription) {      
      // Generate embeddings for searchability
      await env.TEXT_TO_EMBEDDING_SERVICE.fetch('http://localhost/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: transcription, 
          user_id: message.user_id, 
          asset_id: message.asset_id 
        })
      })
    }
}