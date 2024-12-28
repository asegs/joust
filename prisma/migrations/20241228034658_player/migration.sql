-- CreateTable
CREATE TABLE `Player` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `uscfProfile` VARCHAR(191) NULL,
    `fideProfile` VARCHAR(191) NULL,
    `chessComProfile` VARCHAR(191) NULL,
    `lichessProfile` VARCHAR(191) NULL,
    `neutralRating` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
