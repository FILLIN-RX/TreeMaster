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



-- TABLE users (optionnelle pour l'instant; tu peux l'utiliser si tu veux lier un user_id)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------
-- Table games
-- -----------------------------

CREATE TABLE IF NOT EXISTS games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) DEFAULT NULL,               -- Nom de la partie
    creator_id INT NOT NULL,                  -- Joueur qui crée la partie
    opponent_id INT DEFAULT NULL,             -- Joueur qui rejoint
    status ENUM('waiting','in_progress','finished','stopped') DEFAULT 'waiting',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    finished_at DATETIME DEFAULT NULL,
    FOREIGN KEY (creator_id) REFERENCES users(id),
    FOREIGN KEY (opponent_id) REFERENCES users(id)
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

