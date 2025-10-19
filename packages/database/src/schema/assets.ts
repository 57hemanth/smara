import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { workspaces } from './workspaces';

export const assets = sqliteTable('assets', {
  id: text('id').primaryKey(),
  user_id: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  workspace_id: text('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  r2_key: text('r2_key').notNull(),
  mime: text('mime').notNull(),
  modality: text('modality', { 
    enum: ['image', 'audio', 'video', 'text', 'link'] 
  }).notNull(),
  bytes: integer('bytes').notNull(),
  sha256: text('sha256').notNull(),
  source: text('source', { enum: ['web', 'extension'] }),
  source_url: text('source_url'),
  status: text('status', { 
    enum: ['pending', 'processing', 'ready', 'error'] 
  }).notNull().default('pending'),
  created_at: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const labels = sqliteTable('labels', {
  asset_id: text('asset_id')
    .notNull()
    .references(() => assets.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  value: text('value').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.asset_id, table.key] }),
}));

export const textChunks = sqliteTable('text_chunks', {
  asset_id: text('asset_id')
    .notNull()
    .references(() => assets.id, { onDelete: 'cascade' }),
  chunk_id: text('chunk_id').notNull(),
  kind: text('kind', { 
    enum: ['asr', 'ocr', 'user', 'description'] 
  }).notNull(),
  lang: text('lang'),
  start_ms: integer('start_ms'),
  end_ms: integer('end_ms'),
  text: text('text').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.asset_id, table.chunk_id] }),
}));

export const errors = sqliteTable('errors', {
  asset_id: text('asset_id').notNull(),
  stage: text('stage').notNull(),
  message: text('message').notNull(),
  ts: text('ts').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

// Type exports
export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
export type Label = typeof labels.$inferSelect;
export type NewLabel = typeof labels.$inferInsert;
export type TextChunk = typeof textChunks.$inferSelect;
export type NewTextChunk = typeof textChunks.$inferInsert;
export type Error = typeof errors.$inferSelect;
export type NewError = typeof errors.$inferInsert;

