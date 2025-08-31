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
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- -----------------------------
-- Table games
-- -----------------------------
CREATE TABLE Game (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  min_bet DECIMAL(10,2) NOT NULL,
  max_players INT NOT NULL,
  status ENUM('waiting', 'in_progress', 'finished') DEFAULT 'waiting',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------
-- Table bet
-- ------------------------------
CREATE TABLE bets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  game_id INT NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  statut ENUM('active', 'canceled', 'settled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (game_id) REFERENCES Game(id) ON DELETE CASCADE
);

-- -----------------------------
-- Table game_players (relation entre jeux et joueurs)
-- -----------------------------
CREATE TABLE GamePlayers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_id INT NOT NULL,
  user_id INT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES Game(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

