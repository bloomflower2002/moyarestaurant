-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: moya_cafe
-- ------------------------------------------------------
-- Server version       8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- ------------------------------------------------------
-- Table structure for table `admin_accounts`
-- ------------------------------------------------------

DROP TABLE IF EXISTS `admin_accounts`;
CREATE TABLE `admin_accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------
-- Table structure for table `admin_sessions`
-- ------------------------------------------------------

DROP TABLE IF EXISTS `admin_sessions`;
CREATE TABLE `admin_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `admin_sessions_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admin_accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------
-- Table structure for table `admin_login_history`
-- ------------------------------------------------------

DROP TABLE IF EXISTS `admin_login_history`;
CREATE TABLE `admin_login_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL,
  `login_time` datetime DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `admin_login_history_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admin_accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------
-- Table structure for table `admin_activities`
-- ------------------------------------------------------

DROP TABLE IF EXISTS `admin_activities`;
CREATE TABLE `admin_activities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL,
  `action` text NOT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
CONSTRAINT `admin_activities_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admin_accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
   id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(100) NOT NULL,
   email VARCHAR(100) UNIQUE NOT NULL,
   password VARCHAR(255) DEFAULT NULL,  -- This can be NULL for OAuth users
   is_verified BOOLEAN DEFAULT FALSE,
   verification_token VARCHAR(255),
   reset_token VARCHAR(255),
   avatar_url VARCHAR(255),         -- For storing Google profile picture
   role ENUM('user', 'admin') DEFAULT 'user',  -- Add role column here
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` varchar(50) DEFAULT NULL,
  `status` enum('pending','completed','failed','refunded') DEFAULT 'pending',
  `transaction_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------
-- Table structure for table `orders`
-- ------------------------------------------------------

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('pending','confirmed','preparing','ready','completed') DEFAULT 'pending',
  `order_type` enum('pickup','delivery') DEFAULT 'pickup',
  `scheduled_time` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--
LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;



--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `menu_item_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `variant` varchar(500) DEFAULT NULL,
  `special_instructions` text,
  `display_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `custom_price` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_menu_item` (`menu_item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=163 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--


LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
INSERT INTO `cart_items` VALUES (126,NULL,'session_1760457225883_6i35ilwsl',411,1,NULL,NULL,NULL,'2025-10-22 18:35:46',17.99),(127,NULL,'session_1761158986201_lbxd7ga48',425,1,NULL,NULL,NULL,'2025-10-22 18:50:52',12.99),(128,NULL,'session_1761158986201_lbxd7ga48',426,1,NULL,NULL,NULL,'2025-10-22 19:14:26',12.99),(129,NULL,'session_1760457225883_6i35ilwsl',421,1,'Firfir + Tibs',NULL,NULL,'2025-10-22 19:33:41',25.00),(130,NULL,'session_1760457225883_6i35ilwsl',420,1,'Ful + Chechebsa',NULL,NULL,'2025-10-22 19:33:48',17.00),(131,NULL,'session_1761158986201_lbxd7ga48',421,1,'Firfir + Tibs',NULL,NULL,'2025-10-22 20:05:25',25.00);
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--
LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES 
(74,'Breakfast','Traditional Ethiopian breakfast dishes','2025-10-22 17:00:53'),
(75,'Meat','Ethiopian meat dishes','2025-10-22 17:00:53'),
(76,'Combinations','Breakfast and lunch combinations','2025-10-22 17:00:53'),
(77,'Vegetarian','Vegetarian Ethiopian dishes','2025-10-22 17:00:53'),
(78,'Fish','Ethiopian fish dishes','2025-10-22 17:00:53'),
(79,'Kitfo','Traditional Ethiopian kitfo dishes','2025-10-22 17:00:53'),
(80,'Sides','Side dishes and extras','2025-10-22 17:00:53'),
(81,'Extras','Additional items','2025-10-22 17:00:53'),
(82,'Beverages','Drinks and beverages','2025-10-22 17:00:53');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int DEFAULT NULL,
  `menu_item_id` int DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `price` decimal(10,2) NOT NULL,
  `special_instructions` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `variant` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `menu_item_id` (`menu_item_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--
LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

-- Table structure for table `orders`
--

-- Table structure for table `menu_items`
--

DROP TABLE IF EXISTS `menu_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `menu_items_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=463 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_items`
--
LOCK TABLES `menu_items` WRITE;
/*!40000 ALTER TABLE `menu_items` DISABLE KEYS */;
INSERT INTO `menu_items` VALUES (402,'Ful','Fava beans cooked with minced onions and tomatoes',10.99,'image/ful.jpeg',74,1,'2025-10-22 17:00:53'),(403,'Special Ful','Ful with egg',15.99,'image/specialful.jpeg',74,1,'2025-10-22 17:00:53'),(404,'Chechebsa','Toasted flatbread pieces heated with berbere and spiced butter or olive oil. (Black teff +$1.99)',10.99,'image/Chechebsa.jpg',74,1,'2025-10-22 17:00:53'),(405,'Special Chechebsa','Chechebsa with egg',15.99,'image/specialchechebsa.jpeg',74,1,'2025-10-22 17:00:53'),(406,'Enkulal Firfir','Scrambled eggs sauced with tomatoes, onions and jalape├▒os',11.99,'image/enkulalfirifiri.jpeg',74,1,'2025-10-22 17:00:53'),(407,'Enkulal Besiga','Scrambled eggs with minced meat, tomatoes, onions, garlic and jalape├▒os',15.99,'image/enkulalbesiga.jpeg',74,1,'2025-10-22 17:00:53'),(408,'YetSom Firfir','Shredded injera tossed in a vegetable sauce',12.99,'image/yetsomfirfir.jpeg',74,1,'2025-10-22 17:00:53'),(409,'Feta','Dabo firfir with tomato sauce, enkulal firfir, served with homemade yogurt',15.99,'image/feta.jpg',74,1,'2025-10-22 17:00:53'),(410,'Pasta','Pasta made with intensely flavored sauce; gluten-free & vegan options available',12.99,'image/pasta.jpeg',74,1,'2025-10-22 17:00:53'),(411,'Tibs','Tender tips of marinated beef with jalape├▒os, onions, garlic and rosemary',17.99,'image/tibs.jpg',75,1,'2025-10-22 17:00:53'),(412,'Derek Tibs','Tender shoulder cubes marinated in chef\'s blend, stir-fried with wine',21.99,'image/derektibs.jpeg',75,1,'2025-10-22 17:00:53'),(413,'Awaze Tibs','Beef tips with berbere, jalape├▒os, onions, garlic and rosemary',19.99,'image/awazetibs.jpg',75,1,'2025-10-22 17:00:53'),(414,'Kuanta Firfir','Beef jerky cooked in light berbere sauce and tossed with shredded injera',18.99,'image/kuantafirfir.jpeg',75,1,'2025-10-22 17:00:53'),(415,'Dulet','Chopped tripe, liver, and beef saut├⌐ed with spices and herbs',17.99,'image/dulet.jpg',75,1,'2025-10-22 17:00:53'),(416,'Key Wot','Spicy beef stew slow-cooked in berbere sauce and seasoned butter',19.99,'image/keywot.jpeg',75,1,'2025-10-22 17:00:53'),(417,'Shiro Bedist','Smooth spiced chickpea stew simmered in seasoned oil or butter',15.99,'image/shirobedst.jpeg',75,1,'2025-10-22 17:00:53'),(418,'Beyayinetu','Assorted platter of vegetarian dishes served with injera',17.99,'image/beyayinet.jpeg',75,1,'2025-10-22 17:00:53'),(419,'Moya Especial','Tibs, Gomen Besiga, Kitfo, Special Kitfo, Key Wot, and Ayib',34.99,'image/beyayinetu.jpg',75,1,'2025-10-22 17:00:53'),(420,'Breakfast Combination','Breakfast choose Two for $17',17.00,'image/combobreakfast.jpg',76,1,'2025-10-22 17:00:53'),(421,'Lunch Combination','Lunch choose Two for $25',25.00,'image/combolunch.webp',76,1,'2025-10-22 17:00:53'),(422,'Misir Wot','Red split lentils stewed with onions, garlic, berbere and herbs',14.99,'image/misirwot.jpg',77,1,'2025-10-22 17:00:53'),(423,'Kik Alicha','Yellow split peas with garlic, onions and turmeric',14.99,'image/KikAlicha.jpg',77,1,'2025-10-22 17:00:53'),(424,'Shiro','Smooth, spiced chickpea stew simmered in seasoned oil or butter',15.99,'image/shiro.jpeg',77,1,'2025-10-22 17:00:53'),(425,'Atkilt Wot','Cabbage, potato and carrot cooked with onion, ginger and garlic',12.99,'image/atakiltwat.webp',77,1,'2025-10-22 17:00:53'),(426,'Gomen Wot','Saut├⌐ed collard greens cooked with onions, garlic, and spiced butter',12.99,'image/Gomenwot.jpg',77,1,'2025-10-22 17:00:53'),(427,'Suf Fitfit','Finely ground sunflower seeds tossed in shredded injera, olive oil and spices',10.99,'image/suffitfit.jpg',77,1,'2025-10-22 17:00:53'),(428,'Key Sir','Beets, carrots and potatoes cooked with onion and garlic',12.99,'image/keysir.jpeg',77,1,'2025-10-22 17:00:53'),(429,'Vegetarian Beyayinetu','Assorted vegetarian platter served with injera',17.99,'image/beyayinetu.jpg',77,1,'2025-10-22 17:00:53'),(430,'Assa Dullet','Spiced, saut├⌐ed fish mixed with herbs and aromatic spices',18.99,'image/Assadulet.jpg',78,1,'2025-10-22 17:00:53'),(431,'Assa Gulash','Fish simmered in a rich, spicy tomato-based sauce',19.99,'image/Assagulash.jpeg',78,1,'2025-10-22 17:00:53'),(432,'Assa Kitfo','Red fish tuna finely chopped and mixed with olive oil, cardamom and mitmita',20.99,'image/assakitfo.jpeg',78,1,'2025-10-22 17:00:53'),(433,'Yetash├⌐ Assa','Smoked fish served with cubed kocho, fresh ayib and saut├⌐ed gomen greens',22.99,'image/yetasheassa.jpg',78,1,'2025-10-22 17:00:53'),(434,'Kitfo','Minced prime beef mixed with spicy butter and mitmita; served with ayib',20.99,'image/kitfo.png',79,1,'2025-10-22 17:00:53'),(435,'Kesem Zmamuchia','Red split lentils mixed with seasonings and spicy butter; served with ayib',19.99,'image/kesemzmamucha.jpeg',79,1,'2025-10-22 17:00:53'),(436,'Yetashe Kitfo','Minced beef/fish mixed with spices, served with feta and kocho',22.99,'image/yetashekitfo.jpeg',79,1,'2025-10-22 17:00:53'),(437,'Gomen Kitfo','Finely minced collard mixed with spices and served with ayib',20.99,'image/gomenkitfo.jpeg',79,1,'2025-10-22 17:00:53'),(438,'Fish Kitfo','Red fish tuna mixed with olive oil, cardamom and mitmita',20.99,'image/assakitfo.jpeg',79,1,'2025-10-22 17:00:53'),(439,'Tibit Kitfo','Extra-spiced minced beef slow-cooked with bold Ethiopian seasonings',20.99,'image/Tibitkitfo.jpg',79,1,'2025-10-22 17:00:53'),(440,'Boiled Egg','',4.99,'image/boiledegg.webp',80,1,'2025-10-22 17:00:53'),(441,'Cheese & Gomen Mix','',4.99,'image/gomen&cheesemix.jpg',80,1,'2025-10-22 17:00:53'),(442,'Spicy Ethiopian Cheese','',4.99,'image/spicedEthiopiacheese.jpg',80,1,'2025-10-22 17:00:53'),(443,'House-Style Collard','',4.99,'image/housestylecollard.jpeg',80,1,'2025-10-22 17:00:53'),(444,'Lentil Stew','',4.99,'image/lentilstew.jpeg',80,1,'2025-10-22 17:00:53'),(445,'Split Pea Stew','',4.99,'image/splitpeasoup.jpeg',80,1,'2025-10-22 17:00:53'),(446,'Shiro Wot/Chickpea','',4.99,'image/shirowot.jpeg',80,1,'2025-10-22 17:00:53'),(447,'Keysir/Beetroots','',4.99,'image/keysirbeetroots.jpeg',80,1,'2025-10-22 17:00:53'),(448,'Salad','Fresh garden salad',4.99,'image/Salad.jpeg',80,1,'2025-10-22 17:00:53'),(449,'Extra Injera','Extra injera',2.99,'image/extraenjera.jpeg',81,1,'2025-10-22 17:00:53'),(450,'Extra Bread','Extra bread',1.99,'image/extrabread.webp',81,1,'2025-10-22 17:00:53'),(451,'Extra Kocho','Extra kocho',4.99,'image/Extrakocho.jpg',81,1,'2025-10-22 17:00:53'),(452,'Soda','Assorted soft drinks',3.17,'image/Soda.jpeg',82,1,'2025-10-22 17:00:53'),(453,'Gas Water','Sparkling water',2.49,'image/gas water.jpg',82,1,'2025-10-22 17:00:53'),(454,'Water','Bottled water',1.50,'image/water.jpeg',82,1,'2025-10-22 17:00:53'),(455,'Coffee','Fresh brewed coffee',3.99,'image/coffee.webp',82,1,'2025-10-22 17:00:53'),(456,'Macchiato','Espresso with steamed milk',3.99,'image/macchiato.jpg',82,1,'2025-10-22 17:00:53'),(457,'Special Tea','Special blended tea',4.99,'image/specialtea.jpeg',82,1,'2025-10-22 17:00:53'),(458,'Tea','Regular tea',2.99,'image/tea.jpeg',82,1,'2025-10-22 17:00:53'),(459,'Keshir Tea','Spiced tea',4.00,'image/keshirtea.jpeg',82,1,'2025-10-22 17:00:53'),(460,'Latte','Coffee latte',3.99,'image/latte.jpeg',82,1,'2025-10-22 17:00:53'),(461,'Small Ergo','Small homemade yogurt',3.99,'image/homemadeyogurt.jpeg',82,1,'2025-10-22 17:00:53'),(462,'Large Ergo','Large homemade yogurt',6.99,'image/homemadeyogurt.jpeg',82,1,'2025-10-22 17:00:53');
/*!40000 ALTER TABLE `menu_items` ENABLE KEYS */;
UNLOCK TABLES;


-- Orders table
DROP TABLE IF EXISTS `orders`;
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_email VARCHAR(255),
  total_amount DECIMAL(10,2) NOT NULL,
  subtotal_amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL,
  order_type ENUM('dine-in', 'takeaway', 'delivery') DEFAULT 'dine-in',
  payment_method VARCHAR(50) DEFAULT 'cash',
  payment_status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  user_id INT NULL,
  session_id VARCHAR(255) NULL,
  delivery_address JSON NULL,
  status ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_session_id (session_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Order items table
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  menu_item_id INT NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  variant VARCHAR(500) NULL,
  special_instructions TEXT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_id (order_id),
  INDEX idx_menu_item_id (menu_item_id)
);



-- ------------------------------------------------------
-- Table structure for table `payments`
-- ------------------------------------------------------


-- ------------------------------------------------------
-- Cleanup
-- ------------------------------------------------------

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed successfully