CREATE DATABASE IF NOT EXISTS miniYelp;
USE miniYelp;

CREATE TABLE `Businesses` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `ownerId` INT UNSIGNED NOT NULL,
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
INSERT INTO `Businesses` (`id`, `ownerId`, `name`, `address`, `city`, `state`, `zip`, `phone`, `category`, `subcategory`, `website`, `email`) VALUES
(NULL, 0, "Block 15", "300 SW Jefferson Ave.", "Corvallis", "OR", "97333", "541-758-2077", "Restaurant", "Brewpub", "http://block15.com", NULL),
(NULL, 1, "Corvallis Brewing Supply", "119 SW 4th St.", "Corvallis", "OR", "97333", "541-758-1674", "Shopping", "Brewing Supply", "http://www.lickspigot.com", NULL),
(NULL, 2, "Robnett's Hardware", "400 SW 2nd St.", "Corvallis", "OR", "97333", "541-753-5531", "Shopping", "Hardware", NULL, NULL),
(NULL, 3, "First Alternative Co-op North Store", "2855 NW Grant Ave.", "Corvallis", "OR", "97330", "541-452-3115", "Shopping", "Groceries", NULL, NULL);


CREATE TABLE `Photos` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INT UNSIGNED NOT NULL,
    `businessId` INT UNSIGNED NOT NULL REFERENCES `Businesses`(`id`),
    `caption` VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (`id`)
);
INSERT INTO `Photos`(`userId`, `businessId`, `caption`) VALUES 
(2, 0, "This is my dinner."),
(1, 2, NULL),
(1, 3, NULL),
(2, 1, "Hops"),
(3, 2, NULL);


CREATE TABLE `Reviews` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INT UNSIGNED NOT NULL,
    `businessId` INT UNSIGNED NOT NULL REFERENCES `Businesses`(`id`),
    `dollars` INT UNSIGNED NOT NULL,
    `stars` INT UNSIGNED NOT NULL,
    `review` VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (`id`)
);
INSERT INTO `Reviews`(`userId`, `businessId`, `dollars`, `stars`, `review`) VALUES 
(1, 1, 3, 4, "Nice drinks."),
(2, 1, 2, 3, "Drinks are reasonably priced."),
(1, 0, 4, 3, "Pretty expensive for decent food."),
(3, 2, 3, 5, "Good tool variety."),
(0, 3, 2, 4, "Fresh produce.");