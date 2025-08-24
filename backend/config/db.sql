-- =====================================================
-- Base de données pour site de jeu de pari multi-joueur
-- Phase 1 : prototype dés / damier (sans argent réel)
-- =====================================================

-- Créer la base de données
DROP DATABASE IF EXISTS TreeMaster;
CREATE DATABASE IF NOT EXISTS TreeMaster;
USE TreeMaster;

-- -----------------------------
-- Table users
-- -----------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------
-- Table games
-- -----------------------------
CREATE TABLE IF NOT EXISTS games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) DEFAULT NULL,               -- Nom de la partie
    status ENUM('waiting','in_progress','finished','stopped') DEFAULT 'waiting',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    finished_at DATETIME DEFAULT NULL
) ENGINE=InnoDB;

-- -----------------------------
-- Table game_players (nouvelle table de liaison)
-- -----------------------------
CREATE TABLE IF NOT EXISTS game_players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    user_id INT NOT NULL,
    is_creator BOOLEAN DEFAULT FALSE,
    is_ready BOOLEAN DEFAULT FALSE,
    points INT DEFAULT 100, -- Points de départ
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_game_user (game_id, user_id)
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
-- Table bets (nouvelle table pour les paris)
-- -----------------------------
CREATE TABLE IF NOT EXISTS bets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    player_id INT NOT NULL,
    amount INT NOT NULL,
    prediction VARCHAR(20) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (player_id) REFERENCES users(id)
) ENGINE=InnoDB;