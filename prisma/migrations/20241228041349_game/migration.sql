-- CreateTable
CREATE TABLE `Game` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tournamentId` INTEGER NOT NULL,
    `round` INTEGER NOT NULL,
    `whiteId` INTEGER NOT NULL,
    `blackId` INTEGER NOT NULL,
    `result` INTEGER NOT NULL,
    `pgn` LONGTEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Game` ADD CONSTRAINT `Game_tournamentId_fkey` FOREIGN KEY (`tournamentId`) REFERENCES `Tournament`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Game` ADD CONSTRAINT `Game_whiteId_fkey` FOREIGN KEY (`whiteId`) REFERENCES `Player`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Game` ADD CONSTRAINT `Game_blackId_fkey` FOREIGN KEY (`blackId`) REFERENCES `Player`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
