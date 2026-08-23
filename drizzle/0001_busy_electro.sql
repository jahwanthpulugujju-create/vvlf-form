CREATE TABLE `studioForms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`slug` varchar(140) NOT NULL,
	`description` text,
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`successMessage` text NOT NULL,
	`redirectUrl` varchar(1000),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studioForms_id` PRIMARY KEY(`id`),
	CONSTRAINT `studioForms_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `studioQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formId` int NOT NULL,
	`kind` enum('short_text','long_text','email','phone','single_choice','multiple_choice','consent') NOT NULL,
	`label` varchar(300) NOT NULL,
	`helpText` text,
	`options` text,
	`required` boolean NOT NULL DEFAULT false,
	`position` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studioQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studioResponses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formId` int NOT NULL,
	`answers` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `studioResponses_id` PRIMARY KEY(`id`)
);
