import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(), // Hashed
  created_at: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

// Type inference
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

