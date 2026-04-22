CREATE TABLE `checklist_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`itemKey` varchar(64) NOT NULL,
	`status` enum('pending','present','missing') NOT NULL DEFAULT 'pending',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `checklist_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `checklist_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`status` enum('active','completed') NOT NULL DEFAULT 'active',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`notes` text,
	CONSTRAINT `checklist_sessions_id` PRIMARY KEY(`id`)
);
