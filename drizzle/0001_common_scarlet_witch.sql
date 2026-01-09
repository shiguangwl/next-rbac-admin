CREATE TABLE `stock_config` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`stock_code` varchar(20) NOT NULL,
	`industry` varchar(100) NOT NULL DEFAULT '',
	`sort_order` int unsigned NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stock_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_stock_code` UNIQUE(`stock_code`)
);
--> statement-breakpoint
CREATE TABLE `stock_data` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`stock_code` varchar(20) NOT NULL,
	`stock_name` varchar(255),
	`total_score` tinyint,
	`greater_than_m5_price` tinyint,
	`greater_than_m10_price` tinyint,
	`greater_than_m20_price` tinyint,
	`m0_percent` double(10,2),
	`m5_percent` double(10,2),
	`m10_percent` double(10,2),
	`m20_percent` double(10,2),
	`ma_mean_ratio` double(10,2),
	`growth_stock_count` int,
	`total_stock_count` int,
	`latest_price` double(10,2),
	`is_etf` tinyint DEFAULT 0,
	`create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `stock_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_stock_code` ON `stock_data` (`stock_code`);--> statement-breakpoint
CREATE INDEX `idx_create_time` ON `stock_data` (`create_time`);