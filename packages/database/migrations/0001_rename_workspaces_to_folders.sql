-- Rename workspaces table to folders
ALTER TABLE `workspaces` RENAME TO `folders`;
--> statement-breakpoint

-- Rename workspace_id column to folder_id in assets table
-- SQLite doesn't support ALTER COLUMN directly, so we need to recreate the table
CREATE TABLE `assets_new` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`folder_id` text NOT NULL,
	`r2_key` text NOT NULL,
	`mime` text NOT NULL,
	`modality` text NOT NULL,
	`bytes` integer NOT NULL,
	`sha256` text NOT NULL,
	`source` text,
	`source_url` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

-- Copy data from old assets table to new one
INSERT INTO `assets_new` SELECT * FROM `assets`;
--> statement-breakpoint

-- Drop old assets table
DROP TABLE `assets`;
--> statement-breakpoint

-- Rename new table to assets
ALTER TABLE `assets_new` RENAME TO `assets`;

