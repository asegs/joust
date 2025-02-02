-- DropForeignKey
ALTER TABLE `Admin` DROP FOREIGN KEY `Admin_tournamentId_fkey`;

-- DropForeignKey
ALTER TABLE `Entry` DROP FOREIGN KEY `Entry_playerId_fkey`;

-- DropForeignKey
ALTER TABLE `Entry` DROP FOREIGN KEY `Entry_tournamentId_fkey`;

-- DropForeignKey
ALTER TABLE `Game` DROP FOREIGN KEY `Game_tournamentId_fkey`;

-- AddForeignKey
ALTER TABLE `Entry` ADD CONSTRAINT `Entry_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `Tournament`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Entry` ADD CONSTRAINT `Entry_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Player`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Game` ADD CONSTRAINT `Game_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `Tournament`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Admin` ADD CONSTRAINT `Admin_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `Tournament`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
