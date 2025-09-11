// /api/api.js
import { useUserStore } from '@/stores/user'
import axios from 'axios'

/**
 * Axios instance configurée pour interagir avec le backend.
 * Le token JWT sera automatiquement ajouté aux headers si présent.
 */
const api = axios.create({
  baseURL: process.env.API_URL // URL de l'API backend, définie dans .env
})

/**
 * Interceptor pour injecter automatiquement le token dans chaque requête.
 * - Récupère le token depuis le store Pinia (userStore)
 * - Ajoute le header Authorization si token présent
 */
api.interceptors.request.use(config => {
  const store = useUserStore()
  if (store.token) {
    config.headers.Authorization = `Bearer ${store.token}`
  }
  return config
})

/**
 * Service centralisé pour toutes les requêtes vers le backend.
 * Utilisé par les stores et composants Nuxt 3.
 */
export const apiService = {
  /**
   * Enregistrer un nouvel utilisateur
   * @param {string} username - Nom d'utilisateur unique
   * @param {string} email - Email unique
   * @param {string} password - Mot de passe en clair (sera hashé côté serveur)
   * @returns {Promise<Object>} Données retournées par le serveur
   */
  async register(username, email, password) {
    const res = await api.post('/auth/register', { username, email, password })
    return res.data
  },

  /**
   * Connexion d'un utilisateur existant
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe
   * @returns {Promise<Object>} Contient token JWT et informations utilisateur
   */
  async login(email, password) {
    const res = await api.post('/auth/login', { email, password })
    return res.data
  },

  /**
   * Récupérer toutes les parties de jeu disponibles
   * @returns {Promise<Array>} Liste des jeux
   */
  async getGames() {
    const res = await api.get('/games')
    return res.data
  },

  /**
   * Récupérer les détails d'une partie spécifique
   * @param {number|string} gameId - ID du jeu
   * @returns {Promise<Object>} Détails du jeu
   */
  async getGameDetails(gameId) {
    const res = await api.get(`/games/${gameId}`)
    return res.data
  },

  /**
   * Créer une mise sur une partie
   * @param {number|string} gameId - ID de la partie
   * @param {number} montant - Montant de la mise
   * @returns {Promise<Object>} Données de la mise créée
   */
  async createBet(gameId, montant) {
    const res = await api.post('/bets/create', { game_id: gameId, montant })
    return res.data
  },

  /**
   * Récupérer toutes les mises de l'utilisateur connecté
   * @returns {Promise<Array>} Liste des mises
   */
  async getBets() {
    const res = await api.get('/bets')
    return res.data
  },

  /**
   * Annuler une mise
   * @param {number|string} betId - ID de la mise à annuler
   * @returns {Promise<Object>} Message de confirmation
   */
  async cancelBet(betId) {
    const res = await api.post(`/bets/${betId}/cancel`)
    return res.data
  },

  /**
   * Récupérer les informations du compte utilisateur
   * @returns {Promise<Object>} Détails du compte (solde, nom, email, etc.)
   */
  async getAccountInfo() {
    const res = await api.get('/account')
    return res.data
  }
}
