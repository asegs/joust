-- AlterTable
ALTER TABLE `Entry` MODIFY `type` VARCHAR(191) NOT NULL DEFAULT 'request';

-- AlterTable
ALTER TABLE `Tournament` ADD COLUMN `maxRating` INTEGER NULL,
    ADD COLUMN `minRating` INTEGER NULL,
    ADD COLUMN `requireLinkedAccounts` BOOLEAN NOT NULL DEFAULT false;
