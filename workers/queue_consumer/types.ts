import type { R2Bucket, Queue } from '@cloudflare/workers-types'

export interface IngestMessage {
  asset_id: string
  user_id: string
  folder_id: string
  r2_key: string
  mime: string
  modality: 'image' | 'audio' | 'video' | 'text' | 'link' | 'document'
  bytes?: number
  url?: string  // For link modality - the YouTube or external URL
}

export interface Env {
  // SMARA Standard Bindings
  R2: R2Bucket
  
  // Queue Producers - route to specialized processing queues
  IMAGE_INGEST_QUEUE: Queue
  AUDIO_INGEST_QUEUE: Queue
  VIDEO_INGEST_QUEUE: Queue
  LINK_INGEST_QUEUE: Queue
  DOC_INGEST_QUEUE: Queue
  EMBEDDING_QUEUE: Queue
}