CREATE DATABASE IF NOT EXISTS miniYelp;
USE miniYelp;

DROP TABLE IF EXISTS Businesses;
CREATE TABLE `Businesses` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `ownerId` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `city` VARCHAR(255) NOT NULL,
    `state` CHAR(2) NOT NULL,
    `zip` CHAR(5) NOT NULL,
    `phone` VARCHAR(255) NOT NULL,
    `category` VARCHAR(255) NOT NULL,
    `subcategory` VARCHAR(255) NOT NULL,
    `website` VARCHAR(255) DEFAULT NULL,
    `email` VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_ownerid` (`ownerId`)
);
INSERT INTO `Businesses`(`ownerId`, `name`, `address`, `city`, `state`, `zip`, `phone`, `category`, `subcategory`, `website`) VALUES (0, `Block 15`, `300 SW Jefferson Ave.`, `Corvallis`, `OR`, `97333`, `541-758-2077`, `Restaurant`, `Brewpub`, `http://block15.com`);
INSERT INTO `Businesses`(`ownerId`, `name`, `address`, `city`, `state`, `zip`, `phone`, `category`, `subcategory`, `website`) VALUES (1, `Corvallis Brewing Supply`, `119 SW 4th St.`, `Corvallis`, `OR`, `97333`, `541-758-1674`, `Shopping`, `Brewing Supply`, `http://www.lickspigot.com`);
INSERT INTO `Businesses`(`ownerId`, `name`, `address`, `city`, `state`, `zip`, `phone`, `category`, `subcategory`) VALUES (2, `Robnett's Hardware`, `400 SW 2nd St.`, `Corvallis`, `OR`, `97333`, `541-753-5531`, `Shopping`, `Hardware`);
INSERT INTO `Businesses`(`ownerId`, `name`, `address`, `city`, `state`, `zip`, `phone`, `category`, `subcategory`) VALUES (3, `First Alternative Co-op North Store`, `2855 NW Grant Ave.`, `Corvallis`, `OR`, `97330`, `541-452-3115`, `Shopping`, `Groceries`);


DROP TABLE IF EXISTS Photos
CREATE TABLE `Photos` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `userId` INT NOT NULL,
    `businessId` INT NOT NULL,
    `caption` VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`businessId`) REFERENCES `Businesses`(`id`)
);
INSERT INTO `Photos`(`userId`, `businessId`, `caption`) VALUES (2, 0, `This is my dinner.`);
INSERT INTO `Photos`(`userId`, `businessId`) VALUES (1, 2);
INSERT INTO `Photos`(`userId`, `businessId`) VALUES (1, 3);
INSERT INTO `Photos`(`userId`, `businessId`, `caption`) VALUES (2, 1, `Hops`);
INSERT INTO `Photos`(`userId`, `businessId`) VALUES (3, 2);

DROP TABLE IF EXISTS Reviews
CREATE TABLE `Reviews` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `userId` INT NOT NULL,
    `businessId` INT NOT NULL,
    `dollars` INT NOT NULL,
    `stars` INT NOT NULL,
    `review` VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`businessId`) REFERENCES `Businesses`(`id`)
);
INSERT INTO `Reviews`(`userId`, `businessId`, `dollars`, `stars`, `review`) VALUES (1, 1, 3, 4, `Nice drinks.`);
INSERT INTO `Reviews`(`userId`, `businessId`, `dollars`, `stars`, `review`) VALUES (2, 1, 2, 3, `Drinks are reasonably priced.`);
INSERT INTO `Reviews`(`userId`, `businessId`, `dollars`, `stars`, `review`) VALUES (1, 0, 4, 3, `Pretty expensive for decent food.`);
INSERT INTO `Reviews`(`userId`, `businessId`, `dollars`, `stars`, `review`) VALUES (3, 2, 3, 5, `Good tool variety.`);
INSERT INTO `Reviews`(`userId`, `businessId`, `dollars`, `stars`, `review`) VALUES (0, 3, 2, 4, `Fresh produce.`);