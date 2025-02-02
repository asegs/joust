-- AlterTable
ALTER TABLE `Tournament` ADD COLUMN `defaultRating` INTEGER NOT NULL DEFAULT 800,
    ADD COLUMN `pairingSystem` VARCHAR(191) NOT NULL DEFAULT 'swiss',
    ADD COLUMN `tiebreakSystem` VARCHAR(191) NOT NULL DEFAULT 'median buchholz';
