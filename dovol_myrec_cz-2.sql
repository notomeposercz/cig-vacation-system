-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Počítač: db.dw189.webglobe.com
-- Vytvořeno: Čtv 22. kvě 2025, 14:24
-- Verze serveru: 8.0.41-32
-- Verze PHP: 8.1.32

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Databáze: `dovol_myrec_cz`
--

-- --------------------------------------------------------

--
-- Struktura tabulky `departments`
--

CREATE TABLE `departments` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `manager_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Vypisuji data pro tabulku `departments`
--

INSERT INTO `departments` (`id`, `name`, `manager_id`, `created_at`, `updated_at`) VALUES
('DEPT_FIN_003', 'Finanční oddělení', NULL, '2025-05-07 21:19:16', '2025-05-07 21:19:16'),
('DEPT_HR_002', 'Personální oddělení', 'USER_MGR_003', '2025-05-07 21:19:16', '2025-05-07 21:19:16'),
('DEPT_IT_001', 'IT oddělení', 'USER_MGR_002', '2025-05-07 21:19:16', '2025-05-07 21:19:16'),
('DEPT_MKT_004', 'Marketing', NULL, '2025-05-07 21:19:16', '2025-05-07 21:19:16');

--
-- Triggery `departments`
--
DELIMITER $$
CREATE TRIGGER `before_insert_departments` BEFORE INSERT ON `departments` FOR EACH ROW BEGIN
  IF NEW.id IS NULL THEN
    SET NEW.id = UUID();
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Struktura tabulky `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Vypisuji data pro tabulku `refresh_tokens`
--

INSERT INTO `refresh_tokens` (`id`, `user_id`, `token`, `expires_at`, `created_at`) VALUES
('eee18d01-2b88-11f0-9ed7-4289ea8b509b', 'USER_ADMIN_001', 'token_admin_eee18be5-2b88-11f0-9ed7-4289ea8b509b', '2025-06-05 22:00:00', '2025-05-07 21:19:17'),
('eee1901c-2b88-11f0-9ed7-4289ea8b509b', 'USER_MGR_002', 'token_novak_eee18fcc-2b88-11f0-9ed7-4289ea8b509b', '2025-06-05 22:00:00', '2025-05-07 21:19:17');

--
-- Triggery `refresh_tokens`
--
DELIMITER $$
CREATE TRIGGER `before_insert_refresh_tokens` BEFORE INSERT ON `refresh_tokens` FOR EACH ROW BEGIN
  IF NEW.id IS NULL THEN
    SET NEW.id = UUID();
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Struktura tabulky `users`
--

CREATE TABLE `users` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('admin','manager','employee') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'employee',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `user_code` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Vypisuji data pro tabulku `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `department_id`, `role`, `created_at`, `updated_at`, `user_code`) VALUES
('USER_ADMIN_001', 'admin@cig.cz', '$2y$10$0gvsg48.wrXoUNsp44CGQeoyFu/5.j5IkWUKMVaVCfuNTtUcnAwq6', 'Admin', 'Systémový', 'DEPT_IT_001', 'admin', '2025-05-07 21:19:16', '2025-05-12 12:24:12', 'USER_ADMIN_001'),
('USER_EMP_004', 'tomas.dvorak@cig.cz', '$2y$10$0gvsg48.wrXoUNsp44CGQeoyFu/5.j5IkWUKMVaVCfuNTtUcnAwq6', 'Tomáš', 'Dvořák', 'DEPT_IT_001', 'employee', '2025-05-07 21:19:16', '2025-05-12 12:24:12', 'USER_EMP_004'),
('USER_EMP_005', 'lucie.novotna@cig.cz', '$2y$10$0gvsg48.wrXoUNsp44CGQeoyFu/5.j5IkWUKMVaVCfuNTtUcnAwq6', 'Lucie', 'Novotná', 'DEPT_FIN_003', 'employee', '2025-05-07 21:19:16', '2025-05-12 12:24:12', 'USER_EMP_005'),
('USER_EMP_006', 'martin.cerny@cig.cz', '$2y$10$0gvsg48.wrXoUNsp44CGQeoyFu/5.j5IkWUKMVaVCfuNTtUcnAwq6', 'Martin', 'Černý', 'DEPT_MKT_004', 'employee', '2025-05-07 21:19:16', '2025-05-12 12:24:12', 'USER_EMP_006'),
('USER_MGR_002', 'jan.novak@cig.cz', '$2y$10$0gvsg48.wrXoUNsp44CGQeoyFu/5.j5IkWUKMVaVCfuNTtUcnAwq6', 'Jan', 'Novák', 'DEPT_IT_001', 'manager', '2025-05-07 21:19:16', '2025-05-12 12:24:12', 'USER_MGR_002'),
('USER_MGR_003', 'petra.svobodova@cig.cz', '$2y$10$0gvsg48.wrXoUNsp44CGQeoyFu/5.j5IkWUKMVaVCfuNTtUcnAwq6', 'Petra', 'Svobodová', 'DEPT_HR_002', 'manager', '2025-05-07 21:19:16', '2025-05-12 12:24:12', 'USER_MGR_003');

--
-- Triggery `users`
--
DELIMITER $$
CREATE TRIGGER `before_insert_users` BEFORE INSERT ON `users` FOR EACH ROW BEGIN
  IF NEW.id IS NULL THEN
    SET NEW.id = UUID();
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Struktura tabulky `vacation_approvals`
--

CREATE TABLE `vacation_approvals` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vacation_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `approved_by` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Vypisuji data pro tabulku `vacation_approvals`
--

INSERT INTO `vacation_approvals` (`id`, `vacation_id`, `approved_by`, `status`, `note`, `created_at`) VALUES
('eed7e92d-2b88-11f0-9ed7-4289ea8b509b', 'ee8cd1bd-2b88-11f0-9ed7-4289ea8b509b', 'USER_ADMIN_001', 'approved', 'Schváleno automaticky', '2025-05-07 21:19:17'),
('eed7ec5d-2b88-11f0-9ed7-4289ea8b509b', 'ee9cdb2a-2b88-11f0-9ed7-4289ea8b509b', 'USER_ADMIN_001', 'approved', 'Schváleno administrátorem', '2025-05-07 21:19:17'),
('eed7eda7-2b88-11f0-9ed7-4289ea8b509b', 'eea4e04a-2b88-11f0-9ed7-4289ea8b509b', 'USER_ADMIN_001', 'approved', 'Schváleno administrátorem', '2025-05-07 21:19:17'),
('eed7ee55-2b88-11f0-9ed7-4289ea8b509b', 'eeacdb67-2b88-11f0-9ed7-4289ea8b509b', 'USER_MGR_002', 'approved', 'Schváleno manažerem IT', '2025-05-07 21:19:17'),
('eed7eef1-2b88-11f0-9ed7-4289ea8b509b', 'eeb4c53e-2b88-11f0-9ed7-4289ea8b509b', 'USER_MGR_002', 'approved', 'Schváleno manažerem IT - nemoc', '2025-05-07 21:19:17'),
('eed7ef99-2b88-11f0-9ed7-4289ea8b509b', 'eec4c279-2b88-11f0-9ed7-4289ea8b509b', 'USER_ADMIN_001', 'rejected', 'Zamítnuto z provozních důvodů', '2025-05-07 21:19:17');

--
-- Triggery `vacation_approvals`
--
DELIMITER $$
CREATE TRIGGER `before_insert_vacation_approvals` BEFORE INSERT ON `vacation_approvals` FOR EACH ROW BEGIN
  IF NEW.id IS NULL THEN
    SET NEW.id = UUID();
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Struktura tabulky `vacation_requests`
--

CREATE TABLE `vacation_requests` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `start_day_portion` enum('FULL_DAY','AM_HALF_DAY','PM_HALF_DAY') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FULL_DAY' COMMENT 'Konfigurace prvního dne (celý, dopol. půlden, odpol. půlden)',
  `end_day_portion` enum('FULL_DAY','AM_HALF_DAY','PM_HALF_DAY') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FULL_DAY' COMMENT 'Konfigurace posledního dne (celý, dopol. půlden, odpol. půlden)',
  `half_day_start` tinyint(1) DEFAULT '0',
  `half_day_end` tinyint(1) DEFAULT '0',
  `type` enum('vacation','sick_leave','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'vacation',
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `note` text COLLATE utf8mb4_unicode_ci,
  `calculated_duration_days` decimal(4,1) DEFAULT NULL COMMENT 'Vypočítaná délka dovolené ve dnech (např. 2.5 dne)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `approved_at` datetime DEFAULT NULL,
  `approved_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rejected_at` datetime DEFAULT NULL,
  `rejected_by` int UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Vypisuji data pro tabulku `vacation_requests`
--

INSERT INTO `vacation_requests` (`id`, `user_id`, `start_date`, `end_date`, `start_day_portion`, `end_day_portion`, `half_day_start`, `half_day_end`, `type`, `status`, `note`, `calculated_duration_days`, `created_at`, `updated_at`, `approved_at`, `approved_by`, `rejected_at`, `rejected_by`) VALUES
('2354b82d-30e9-11f0-9ed7-4289ea8b509b', 'USER_ADMIN_001', '2025-06-15', '2025-06-25', 'FULL_DAY', 'FULL_DAY', 0, 0, 'vacation', 'pending', NULL, 8.0, '2025-05-14 17:30:32', '2025-05-14 17:30:32', NULL, NULL, NULL, NULL),
('303ab3d4-2fd7-11f0-9ed7-4289ea8b509b', 'USER_ADMIN_001', '2025-05-15', '2025-05-17', 'FULL_DAY', 'FULL_DAY', 0, 0, 'vacation', 'pending', NULL, 2.0, '2025-05-13 08:49:32', '2025-05-13 08:49:32', NULL, NULL, NULL, NULL),
('556ddd40-2f2d-11f0-9ed7-4289ea8b509b', 'USER_ADMIN_001', '2025-05-12', '2025-05-12', 'FULL_DAY', 'FULL_DAY', 0, 0, 'vacation', 'rejected', NULL, 1.0, '2025-05-12 12:33:40', '2025-05-12 12:33:48', '2025-05-12 14:33:48', 'USER_ADMIN_001', NULL, NULL),
('641ca154-2f2c-11f0-9ed7-4289ea8b509b', 'USER_ADMIN_001', '2025-09-12', '2025-09-12', 'FULL_DAY', 'FULL_DAY', 0, 0, 'vacation', 'approved', NULL, 1.0, '2025-05-12 12:26:55', '2025-05-12 12:30:36', '2025-05-12 14:30:36', 'USER_ADMIN_001', NULL, NULL),
('6a7b303f-2f29-11f0-9ed7-4289ea8b509b', 'USER_ADMIN_001', '2025-05-12', '2025-05-12', 'FULL_DAY', 'FULL_DAY', 0, 0, 'vacation', 'approved', 're', 1.0, '2025-05-12 12:05:37', '2025-05-12 12:30:39', '2025-05-12 14:30:39', 'USER_ADMIN_001', NULL, NULL),
('ee8cd1bd-2b88-11f0-9ed7-4289ea8b509b', 'USER_ADMIN_001', '2025-05-21', '2025-05-25', 'FULL_DAY', 'FULL_DAY', 0, 0, 'vacation', 'approved', 'Letní dovolená', 5.0, '2025-05-07 21:19:17', '2025-05-07 21:19:17', NULL, NULL, NULL, NULL),
('ee94c341-2b88-11f0-9ed7-4289ea8b509b', 'USER_ADMIN_001', '2025-06-06', '2025-06-06', 'AM_HALF_DAY', 'AM_HALF_DAY', 0, 0, 'vacation', 'approved', 'Dopolední vyřizování', 0.5, '2025-05-07 21:19:17', '2025-05-12 08:50:11', '2025-05-12 10:50:11', '1', NULL, NULL),
('ee9cdb2a-2b88-11f0-9ed7-4289ea8b509b', 'USER_MGR_002', '2025-05-14', '2025-05-18', 'FULL_DAY', 'FULL_DAY', 0, 0, 'vacation', 'approved', 'Rodinná dovolená', 5.0, '2025-05-07 21:19:17', '2025-05-07 21:19:17', NULL, NULL, NULL, NULL),
('eea4e04a-2b88-11f0-9ed7-4289ea8b509b', 'USER_MGR_003', '2025-05-12', '2025-05-12', 'PM_HALF_DAY', 'PM_HALF_DAY', 0, 0, 'vacation', 'approved', 'Odpolední lékař', 0.5, '2025-05-07 21:19:17', '2025-05-07 21:19:17', NULL, NULL, NULL, NULL),
('eeacdb67-2b88-11f0-9ed7-4289ea8b509b', 'USER_EMP_004', '2025-05-17', '2025-05-21', 'FULL_DAY', 'FULL_DAY', 0, 0, 'vacation', 'approved', 'Dovolená na horách', 5.0, '2025-05-07 21:19:17', '2025-05-07 21:19:17', NULL, NULL, NULL, NULL),
('eeb4c53e-2b88-11f0-9ed7-4289ea8b509b', 'USER_EMP_004', '2025-06-01', '2025-06-01', 'FULL_DAY', 'FULL_DAY', 0, 0, 'sick_leave', 'approved', 'Plánovaná operace', 1.0, '2025-05-07 21:19:17', '2025-05-07 21:19:17', NULL, NULL, NULL, NULL),
('eebcae56-2b88-11f0-9ed7-4289ea8b509b', 'USER_EMP_005', '2025-05-27', '2025-05-31', 'FULL_DAY', 'FULL_DAY', 0, 0, 'vacation', 'rejected', 'Dovolená v zahraničí', 5.0, '2025-05-07 21:19:17', '2025-05-12 09:01:43', NULL, NULL, '2025-05-12 11:01:43', 1),
('eec4c279-2b88-11f0-9ed7-4289ea8b509b', 'USER_EMP_006', '2025-05-10', '2025-05-11', 'FULL_DAY', 'FULL_DAY', 0, 0, 'vacation', 'rejected', 'Náhradní volno - zamítnuto z provozních důvodů', 2.0, '2025-05-07 21:19:17', '2025-05-07 21:19:17', NULL, NULL, NULL, NULL);

--
-- Triggery `vacation_requests`
--
DELIMITER $$
CREATE TRIGGER `before_insert_vacation_requests` BEFORE INSERT ON `vacation_requests` FOR EACH ROW BEGIN
  IF NEW.id IS NULL THEN
    SET NEW.id = UUID();
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Struktura tabulky `vacation_settings`
--

CREATE TABLE `vacation_settings` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` int NOT NULL,
  `total_days` int NOT NULL,
  `carried_days` int DEFAULT '0',
  `days_taken_in_year` decimal(4,1) NOT NULL DEFAULT '0.0' COMMENT 'Počet dní vyčerpaných v tomto roce z tohoto nároku',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Vypisuji data pro tabulku `vacation_settings`
--

INSERT INTO `vacation_settings` (`id`, `user_id`, `year`, `total_days`, `carried_days`, `days_taken_in_year`, `created_at`, `updated_at`) VALUES
('ee83b17d-2b88-11f0-9ed7-4289ea8b509b', 'USER_ADMIN_001', 2025, 100, 0, 0.0, '2025-05-07 21:19:16', '2025-05-13 09:18:32'),
('ee83b442-2b88-11f0-9ed7-4289ea8b509b', 'USER_MGR_002', 2025, 58, 3, 0.0, '2025-05-07 21:19:16', '2025-05-13 08:57:22'),
('ee83b55c-2b88-11f0-9ed7-4289ea8b509b', 'USER_MGR_003', 2025, 5, 2, 0.0, '2025-05-07 21:19:16', '2025-05-13 08:48:53'),
('ee83b5e6-2b88-11f0-9ed7-4289ea8b509b', 'USER_EMP_004', 2025, 55, 0, 0.0, '2025-05-07 21:19:16', '2025-05-13 09:33:10'),
('ee83b659-2b88-11f0-9ed7-4289ea8b509b', 'USER_EMP_005', 2025, 44, 1, 0.0, '2025-05-07 21:19:16', '2025-05-13 08:38:43'),
('ee83b6c6-2b88-11f0-9ed7-4289ea8b509b', 'USER_EMP_006', 2025, 44, 5, 0.0, '2025-05-07 21:19:16', '2025-05-13 09:33:03');

--
-- Triggery `vacation_settings`
--
DELIMITER $$
CREATE TRIGGER `before_insert_vacation_settings` BEFORE INSERT ON `vacation_settings` FOR EACH ROW BEGIN
  IF NEW.id IS NULL THEN
    SET NEW.id = UUID();
  END IF;
END
$$
DELIMITER ;

--
-- Indexy pro exportované tabulky
--

--
-- Indexy pro tabulku `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_departments_manager` (`manager_id`);

--
-- Indexy pro tabulku `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_refresh_tokens_user` (`user_id`);

--
-- Indexy pro tabulku `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `user_code` (`user_code`),
  ADD KEY `fk_users_department` (`department_id`);

--
-- Indexy pro tabulku `vacation_approvals`
--
ALTER TABLE `vacation_approvals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_vacation_approvals_vacation` (`vacation_id`),
  ADD KEY `fk_vacation_approvals_user` (`approved_by`);

--
-- Indexy pro tabulku `vacation_requests`
--
ALTER TABLE `vacation_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_vacation_requests_user_id` (`user_id`),
  ADD KEY `idx_vacation_requests_status` (`status`),
  ADD KEY `idx_vacation_requests_dates` (`start_date`,`end_date`);

--
-- Indexy pro tabulku `vacation_settings`
--
ALTER TABLE `vacation_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_year` (`user_id`,`year`),
  ADD KEY `idx_vacation_settings_user_year` (`user_id`,`year`);

--
-- Omezení pro exportované tabulky
--

--
-- Omezení pro tabulku `departments`
--
ALTER TABLE `departments`
  ADD CONSTRAINT `fk_departments_manager` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Omezení pro tabulku `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `fk_refresh_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Omezení pro tabulku `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL;

--
-- Omezení pro tabulku `vacation_approvals`
--
ALTER TABLE `vacation_approvals`
  ADD CONSTRAINT `fk_vacation_approvals_user` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_vacation_approvals_vacation` FOREIGN KEY (`vacation_id`) REFERENCES `vacation_requests` (`id`) ON DELETE CASCADE;

--
-- Omezení pro tabulku `vacation_requests`
--
ALTER TABLE `vacation_requests`
  ADD CONSTRAINT `fk_vacation_requests_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Omezení pro tabulku `vacation_settings`
--
ALTER TABLE `vacation_settings`
  ADD CONSTRAINT `fk_vacation_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
