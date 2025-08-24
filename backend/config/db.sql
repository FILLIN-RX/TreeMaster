-- =====================================================
-- Base de données pour site de jeu de pari multi-joueur
-- Phase 1 : prototype dés / damier (sans argent réel)
-- =====================================================

-- Créer la base de données
CREATE DATABASE IF NOT EXISTS TreeMaster;
USE TreeMaster;

-- -----------------------------
-- Table users
-- -----------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------
-- Table games
-- -----------------------------
CREATE TABLE IF NOT EXISTS games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_type VARCHAR(50) NOT NULL,
    player1_id INT NOT NULL,
    player2_id INT,
    status ENUM('waiting','in_progress','finished') DEFAULT 'waiting',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    finished_at DATETIME,
    FOREIGN KEY (player1_id) REFERENCES users(id),
    FOREIGN KEY (player2_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- -----------------------------
-- Table turns
-- -----------------------------
CREATE TABLE IF NOT EXISTS turns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    player_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    result INT,
    turn_number INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (player_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- -----------------------------
-- Table transactions (optionnelle pour Phase 1)
-- -----------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    game_id INT,
    amount DECIMAL(10,2) NOT NULL,
    type ENUM('bet','win','loss','deposit','withdraw') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (game_id) REFERENCES games(id)
) ENGINE=InnoDB;

-- =============================
-- Exemple d'insertion initiale (optionnel)
-- =============================
INSERT INTO users (username, email, password, balance)
VALUES ('Player1', 'player1@example.com', 'password_hash', 100.00),
       ('Player2', 'player2@example.com', 'password_hash', 100.00);
