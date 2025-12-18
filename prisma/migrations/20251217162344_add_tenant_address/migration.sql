-- AlterTable
ALTER TABLE `Claim` ADD COLUMN `submittedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Insurance` ADD COLUMN `card_url` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Tenant` ADD COLUMN `address` VARCHAR(191) NULL;
