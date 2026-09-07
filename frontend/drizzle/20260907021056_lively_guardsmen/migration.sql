CREATE TABLE `denomination` (
	`id_denomination` integer PRIMARY KEY AUTOINCREMENT,
	`value` real NOT NULL,
	`type` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pending_operation` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`client_id` text NOT NULL UNIQUE,
	`type` text NOT NULL,
	`payload` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 5 NOT NULL,
	`next_retry_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_meta` (
	`key` text PRIMARY KEY,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transaction` (
	`id_transaction` integer PRIMARY KEY AUTOINCREMENT,
	`client_id` text NOT NULL UNIQUE,
	`date` text NOT NULL,
	`total` real NOT NULL,
	`observation` text,
	`synced` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transaction_denomination` (
	`id_transaction_denomination` integer PRIMARY KEY AUTOINCREMENT,
	`id_transaction` integer NOT NULL,
	`id_denomination` integer NOT NULL,
	`label` text NOT NULL,
	`value` real NOT NULL,
	`quantity` integer NOT NULL,
	`subtotal` real NOT NULL,
	CONSTRAINT `fk_transaction_denomination_id_transaction_transaction_id_transaction_fk` FOREIGN KEY (`id_transaction`) REFERENCES `transaction`(`id_transaction`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `pending_operation_ready_idx` ON `pending_operation` (`next_retry_at`);--> statement-breakpoint
CREATE INDEX `transaction_synced_idx` ON `transaction` (`synced`);