CREATE TABLE `applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fullName` varchar(150) NOT NULL,
	`college` varchar(200) NOT NULL,
	`department` varchar(160) NOT NULL,
	`studyYear` varchar(40) NOT NULL,
	`whatsapp` varchar(32) NOT NULL,
	`email` varchar(320) NOT NULL,
	`track` varchar(80) NOT NULL,
	`tools` text NOT NULL,
	`focus` text NOT NULL,
	`portfolioLink` varchar(1000),
	`goal` varchar(180) NOT NULL,
	`workstation` varchar(180) NOT NULL,
	`consent` boolean NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
