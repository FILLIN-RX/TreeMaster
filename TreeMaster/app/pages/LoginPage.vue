<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const email = ref('')
const password = ref('')
const error = ref(null)

async function login() {
  try {
    await userStore.login({ email: email.value, password: password.value })
    // Redirection ou notification ici
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur serveur'
  }
}
</script>

<template>
  <form @submit.prevent="login">
    <input v-model="email" placeholder="Email" >
    <input  v-model="password" type="password" placeholder="Mot de passe" >
    <button type="submit">Se connecter</button>
    <p v-if="error">{{ error }}</p>
  </form>
</template>
