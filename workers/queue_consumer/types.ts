import type { R2Bucket, Queue } from '@cloudflare/workers-types'

export interface IngestMessage {
  asset_id: string
  user_id: string
  r2_key: string
  mime: string
  modality: 'image' | 'audio' | 'video' | 'text'
  bytes?: number
}

export interface Env {
  // SMARA Standard Bindings
  R2: R2Bucket
  
  // Queue Producers - route to specialized processing queues
  IMAGE_INGEST_QUEUE: Queue
  AUDIO_INGEST_QUEUE: Queue
  VIDEO_INGEST_QUEUE: Queue
  EMBEDDING_QUEUE: Queue
}