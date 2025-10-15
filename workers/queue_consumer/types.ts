import type { R2Bucket, Fetcher, Queue } from '@cloudflare/workers-types'

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
  EMBEDDING_QUEUE: Queue

  // Service Bindings for Workers
  IMAGE_TO_TEXT_SERVICE: Fetcher
  AUDIO_TO_TEXT_SERVICE: Fetcher
  TEXT_TO_EMBEDDING_SERVICE: Fetcher
}