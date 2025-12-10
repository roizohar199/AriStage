-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: ari_stage
-- ------------------------------------------------------
-- Server version	8.0.36

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `files`
--

DROP TABLE IF EXISTS `files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `file_url` text COLLATE utf8mb4_general_ci NOT NULL,
  `file_type` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'unknown',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `files_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `files`
--

LOCK TABLES `files` WRITE;
/*!40000 ALTER TABLE `files` DISABLE KEYS */;
/*!40000 ALTER TABLE `files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lineup_shares`
--

DROP TABLE IF EXISTS `lineup_shares`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lineup_shares` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lineup_id` int NOT NULL,
  `share_token` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `share_token` (`share_token`),
  KEY `lineup_id` (`lineup_id`),
  CONSTRAINT `lineup_shares_ibfk_1` FOREIGN KEY (`lineup_id`) REFERENCES `lineups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lineup_shares`
--

LOCK TABLES `lineup_shares` WRITE;
/*!40000 ALTER TABLE `lineup_shares` DISABLE KEYS */;
/*!40000 ALTER TABLE `lineup_shares` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lineup_songs`
--

DROP TABLE IF EXISTS `lineup_songs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lineup_songs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lineup_id` int NOT NULL,
  `song_id` int NOT NULL,
  `position` int NOT NULL DEFAULT '1',
  `chart_pdf` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `lineup_id` (`lineup_id`),
  KEY `song_id` (`song_id`),
  CONSTRAINT `lineup_songs_ibfk_1` FOREIGN KEY (`lineup_id`) REFERENCES `lineups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `lineup_songs_ibfk_2` FOREIGN KEY (`song_id`) REFERENCES `songs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=236 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lineup_songs`
--

LOCK TABLES `lineup_songs` WRITE;
/*!40000 ALTER TABLE `lineup_songs` DISABLE KEYS */;
INSERT INTO `lineup_songs` VALUES (233,25,51,1,'/uploads/charts/19/chart-233-1765178008981.pdf'),(234,25,52,2,NULL),(235,26,52,1,NULL);
/*!40000 ALTER TABLE `lineup_songs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lineups`
--

DROP TABLE IF EXISTS `lineups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lineups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `date` date DEFAULT NULL,
  `time` time DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `lineups_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lineups`
--

LOCK TABLES `lineups` WRITE;
/*!40000 ALTER TABLE `lineups` DISABLE KEYS */;
INSERT INTO `lineups` VALUES (25,'אשדוד','2025-12-24','10:06:00','אשדוד','',19,'2025-12-08 07:06:35',NULL),(26,'באר שבע','2025-12-20','14:13:00','באר שבע ','',19,'2025-12-08 09:13:44',NULL);
/*!40000 ALTER TABLE `lineups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `metrics`
--

DROP TABLE IF EXISTS `metrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `metrics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `value` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `metrics_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `metrics`
--

LOCK TABLES `metrics` WRITE;
/*!40000 ALTER TABLE `metrics` DISABLE KEYS */;
/*!40000 ALTER TABLE `metrics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `body` text COLLATE utf8mb4_general_ci,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `songs`
--

DROP TABLE IF EXISTS `songs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `songs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `artist` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `bpm` int DEFAULT NULL,
  `key_sig` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `duration_sec` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_general_ci,
  `chart_pdf` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `user_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `songs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `songs`
--

LOCK TABLES `songs` WRITE;
/*!40000 ALTER TABLE `songs` DISABLE KEYS */;
INSERT INTO `songs` VALUES (51,'צליל מיתר','אייל גולן',80,'C Major','3:00','שקט',NULL,19,'2025-12-08 06:32:53'),(52,'משוגעת','שרית חדד',120,'C Major','4:00','קצבי','/uploads/charts/20/song-chart-52-1765194627366.pdf',19,'2025-12-08 07:14:13');
/*!40000 ALTER TABLE `songs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_hosts`
--

DROP TABLE IF EXISTS `user_hosts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_hosts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `guest_id` int NOT NULL,
  `host_id` int NOT NULL,
  `invitation_status` enum('pending','accepted','rejected') COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_guest_host` (`guest_id`,`host_id`),
  KEY `guest_id` (`guest_id`),
  KEY `host_id` (`host_id`),
  KEY `idx_guest_status` (`guest_id`,`invitation_status`),
  KEY `idx_host_status` (`host_id`,`invitation_status`),
  CONSTRAINT `user_hosts_ibfk_1` FOREIGN KEY (`guest_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_hosts_ibfk_2` FOREIGN KEY (`host_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_hosts`
--

LOCK TABLES `user_hosts` WRITE;
/*!40000 ALTER TABLE `user_hosts` DISABLE KEYS */;
INSERT INTO `user_hosts` VALUES (1,20,19,'accepted','2025-12-08 13:45:01',NULL);
/*!40000 ALTER TABLE `user_hosts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_invitations`
--

DROP TABLE IF EXISTS `user_invitations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_invitations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(190) COLLATE utf8mb4_general_ci NOT NULL,
  `host_id` int NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT '0',
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `email` (`email`),
  KEY `token` (`token`),
  KEY `host_id` (`host_id`),
  CONSTRAINT `user_invitations_ibfk_1` FOREIGN KEY (`host_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_invitations`
--

LOCK TABLES `user_invitations` WRITE;
/*!40000 ALTER TABLE `user_invitations` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_invitations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(190) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `role` enum('admin','manager','user') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'user',
  `subscription_type` enum('trial','pro') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'trial',
  `theme` enum('light','dark') COLLATE utf8mb4_general_ci DEFAULT 'dark',
  `invited_by` int DEFAULT NULL,
  `invitation_status` enum('pending','accepted','rejected') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  `reset_token` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `reset_expires` bigint DEFAULT NULL,
  `artist_role` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `avatar` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `invited_by` (`invited_by`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`invited_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (19,'רועי','roizohar111@gmail.com','$2a$10$RGCdXZP1wM7PEOXFzWAcXeyifbcG6DGyHW.J14OdGqbCdchCAyoUC','user','trial','dark',NULL,NULL,'2025-12-08 06:03:56',NULL,NULL,NULL,'קלידן',NULL),(20,'יוסי','yosiyoviv@gmail.com','$2a$10$28l2Hg4sJVrRiCTBepqHOegUYWusrNW/vLtQjYtYfx1zR/Kbm1ALO','user','trial','dark',19,'accepted','2025-12-08 06:24:31',NULL,NULL,NULL,'בסיסט',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-10 10:27:26
