// ~/stores/user.js
import { defineStore } from "pinia";
import { apiService } from "@/api/api";
import { useCookie } from "#app";

/**
 * Store Pinia pour la gestion de l'utilisateur (Nuxt 3 SSR)
 * Ce store gère l'état global de l'utilisateur connecté,
 * le token d'authentification et fournit des actions pour
 * l'inscription, la connexion et la déconnexion.
 */
export const useUserStore = defineStore("user", {
  state: () => ({
    /**
     * Informations de l'utilisateur connecté
     * @type {Object|null}
     */
    user: null,

    /**
     * Token JWT pour l'authentification
     * Stocké dans un cookie pour fonctionner côté serveur
     * @type {string|null}
     */
    token: null,
  }),

  getters: {
    /**
     * Indique si l'utilisateur est connecté
     * @param {Object} state - État du store
     * @returns {boolean} true si connecté, false sinon
     */
    isLoggedIn: (state) => !!state.token,
  },

  actions: {
    /**
     * Initialise le token depuis le cookie (SSR + client)
     * Doit être appelé dans un plugin ou layout à l'initialisation
     */
    initToken() {
      const tokenCookie = useCookie("token");
      this.token = tokenCookie.value || null;
    },

    /**
     * Inscrire un nouvel utilisateur
     * Appelle le backend via apiService pour créer un compte
     *
     * @param {string} username - Nom d'utilisateur
     * @param {string} email - Email de l'utilisateur
     * @param {string} password - Mot de passe
     * @returns {Promise<Object>} Données renvoyées par le backend
     */
    async register(username, email, password) {
      return await apiService.register(username, email, password);
    },

    /**
     * Connexion de l'utilisateur
     * Récupère le token et les informations utilisateur du backend
     * et met à jour le store + cookie pour SSR
     *
     * @param {string} email - Email de l'utilisateur
     * @param {string} password - Mot de passe
     */
    async login(email, password) {
      const data = await apiService.login(email, password);
      this.token = data.token;
      this.user = data.user;

      // Stocker le token dans un cookie pour SSR et client
      const tokenCookie = useCookie("token");
      tokenCookie.value = data.token;
      tokenCookie.maxAge = 60 * 60 * 24 * 7; // 7 jours
    },

    /**
     * Déconnexion de l'utilisateur
     * Supprime les informations du store et le cookie
     */
    logout() {
      this.token = null;
      this.user = null;

      const tokenCookie = useCookie("token");
      tokenCookie.value = null;
    },
  },
});
