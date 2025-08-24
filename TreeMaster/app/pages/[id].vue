<!-- app/pages/game/[id].vue -->
<template>
  <div class="container mx-auto p-6">
    <div v-if="!gameState" class="text-center py-8">
      <p>Chargement de la partie...</p>
    </div>

    <div v-else class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold">{{ gameState.name || ('Partie #' + gameState.id) }}</h1>
            <p class="text-gray-600">Statut: {{ getStateText() }}</p>
            <p class="text-sm text-gray-500">Créée le: {{ formatDate(gameState.created_at) }}</p>
          </div>
          <NuxtLink to="/games" class="px-4 py-2 bg-gray-600 text-white rounded-md">
            Retour aux parties
          </NuxtLink>
        </div>
      </div>

      <!-- Informations sur les joueurs -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Joueurs ({{ gameState.players.length }})</h2>
        
        <div v-if="gameState.players.length === 0" class="text-center py-4 text-gray-500">
          Aucun joueur n'a rejoint cette partie pour le moment.
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            v-for="player in gameState.players"
            :key="player.id"
            class="p-4 border rounded-lg"
            :class="{
              'bg-blue-50 border-blue-300': player.is_creator,
              'bg-gray-50': !player.is_creator
            }"
          >
            <div class="flex justify-between items-center">
              <div>
                <h3 class="font-semibold flex items-center">
                  {{ player.username }}
                  <span v-if="player.is_creator" class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    Créateur
                  </span>
                </h3>
                <p class="text-sm text-gray-600">{{ player.points }} points</p>
                <p class="text-xs text-gray-500">Rejoint: {{ formatDate(player.joined_at) }}</p>
              </div>
              <div class="text-right">
                <span 
                  class="px-2 py-1 rounded text-xs"
                  :class="player.is_ready ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
                >
                  {{ player.is_ready ? 'Prêt' : 'En attente' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions selon le statut -->
      <div v-if="gameState.status === 'waiting'" class="bg-yellow-50 rounded-lg p-6 mb-6">
        <h3 class="text-lg font-semibold mb-2">En attente de joueurs</h3>
        <p class="mb-4">{{ gameState.players.length }}/4 joueurs - Cliquez sur "Prêt" quand vous êtes prêt à commencer</p>
        
        <button 
          v-if="!isPlayerReady()"
          @click="setReady"
          :disabled="loading"
          class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {{ loading ? 'Chargement...' : 'Je suis prêt !' }}
        </button>
        
        <span v-else class="px-4 py-2 bg-green-100 text-green-800 rounded-md">
          Vous êtes prêt ! ✓
        </span>
      </div>

      <div v-if="gameState.status === 'in_progress'" class="bg-green-50 rounded-lg p-6 mb-6">
        <h3 class="text-lg font-semibold mb-2">Partie en cours</h3>
        <p>La partie a commencé. Bonne chance à tous les joueurs !</p>
      </div>

      <div v-if="gameState.status === 'finished' || gameState.status === 'stopped'" class="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 class="text-lg font-semibold mb-2">Partie terminée</h3>
        <p>Cette partie est maintenant terminée.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const route = useRoute()
const gameId = route.params.id

const gameState = ref(null)
const loading = ref(false)
const playerId = ref(null)

const fetchGameState = async () => {
  try {
    // Cette route doit être implémentée côté backend
    const data = await $fetch(`/api/games/${gameId}`)
    gameState.value = data
  } catch (error) {
    console.error('Erreur chargement état:', error)
  }
}

const setReady = async () => {
  if (!playerId.value) return
  
  loading.value = true
  try {
    // Cette route doit être implémentée côté backend
    await $fetch(`/api/games/${gameId}/ready`, {
      method: 'POST',
      body: { playerId: playerId.value }
    })
    await fetchGameState()
  } catch (error) {
    alert('Erreur: ' + error.data?.error)
  }
  loading.value = false
}

const isPlayerReady = () => {
  if (!gameState.value || !playerId.value) return false
  const player = gameState.value.players.find(p => p.id === playerId.value)
  return player?.is_ready || false
}

const getStateText = () => {
  switch (gameState.value?.status) {
    case 'waiting': return 'En attente de joueurs'
    case 'in_progress': return 'En cours'
    case 'finished': return 'Terminée'
    case 'stopped': return 'Arrêtée'
    default: return ''
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('fr-FR')
}

onMounted(async () => {
  // Récupérer l'ID du joueur depuis le sessionStorage
  playerId.value = parseInt(sessionStorage.getItem(`game_${gameId}_playerId`)) || null
  
  await fetchGameState()
  
  // Polling pour les mises à jour
  const interval = setInterval(fetchGameState, 3000)
  
  onUnmounted(() => {
    clearInterval(interval)
  })
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f3f4f6;
}
</style>