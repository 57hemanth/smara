import type { Env, IngestMessage } from './types'
import { json } from '../shared/utils'
import { MessageBatch } from '@cloudflare/workers-types'
import { processImageMessage, processAudioMessage, processTextMessage, processVideoMessage, processLinkMessage } from './processors'

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    return json({ 
      service: 'queue-consumer',
      status: 'running',
      timestamp: new Date().toISOString()
    })
  },

  async queue(batch: MessageBatch, env: Env): Promise<void> {
    console.log(`Processing batch of ${batch.messages.length} messages`)
    
    for (const message of batch.messages) {
      try {
        const ingestMsg = message.body as IngestMessage
        
        // Validate message structure
        if (!ingestMsg.asset_id || !ingestMsg.user_id || !ingestMsg.modality || !ingestMsg.r2_key) {
          throw new Error(`Invalid message structure: ${JSON.stringify(ingestMsg)}`)
        }

        console.log(`Routing message for asset ${ingestMsg.asset_id} with modality: ${ingestMsg.modality}`)

        // Route based on media type
        switch (ingestMsg.modality) {
          case 'image':
            await processImageMessage(ingestMsg, env)
            break
          case 'audio':
            await processAudioMessage(ingestMsg, env)
            break
          case 'video':
            await processVideoMessage(ingestMsg, env)
            break
          case 'text':
            await processTextMessage(ingestMsg, env)
            break
          case 'link':
            await processLinkMessage(ingestMsg, env)
            break
          default:
            throw new Error(`Unknown modality: ${ingestMsg.modality}`)
        }

        // Acknowledge successful processing
        message.ack()

      } catch (error: any) {
        console.error(`Error processing message:`, error)
        
        // Retry message (don't ack, let queue retry)
        message.retry()
      }
    }
  }
}

export default worker