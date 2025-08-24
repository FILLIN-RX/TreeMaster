<!-- app/pages/games.vue -->
<template>
  <div class="container mx-auto p-6">
    <h1 class="text-3xl font-bold mb-8">TreeMaster - Parties de Jeu</h1>

    <!-- Formulaire nom joueur et nom de la partie -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <div class="flex gap-4 items-end flex-wrap">
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium mb-2">Votre nom :</label>
          <input 
            v-model="playerName" 
            type="text" 
            placeholder="Entrez votre nom"
            class="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium mb-2">Nom de la partie :</label>
          <input 
            v-model="gameName" 
            type="text" 
            placeholder="Ex: Partie rapide"
            class="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button 
          @click="createGame"
          :disabled="!playerName.trim() || !gameName.trim() || loading"
          class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {{ loading ? 'Création...' : 'Créer Partie' }}
        </button>
      </div>
    </div>

    <!-- Liste des parties -->
    <div class="grid gap-4">
      <h2 class="text-xl font-semibold">Parties disponibles</h2>
      
      <div v-if="games.length === 0" class="text-gray-500 text-center py-8">
        Aucune partie disponible. Créez-en une !
      </div>

      <div 
        v-for="game in games" 
        :key="game.id"
        class="bg-white rounded-lg shadow-md p-6 border-l-4"
        :class="{
          'border-l-yellow-400': game.status === 'waiting',
          'border-l-green-400': game.status === 'in_progress',
          'border-l-gray-400': game.status === 'stopped'
        }"
      >
        <div class="flex justify-between items-start flex-wrap">
          <div class="flex-1 min-w-[200px]">
            <h3 class="text-lg font-semibold">{{ game.name || ('Partie #' + game.id) }}</h3>
            <p class="text-gray-600">Créée par: {{ game.username }}</p>
            <p class="text-sm text-gray-500">{{ formatDate(game.created_at) }}</p>

            <div class="mt-2">
              <span 
                class="px-2 py-1 rounded text-xs font-medium"
                :class="{
                  'bg-yellow-100 text-yellow-800': game.status === 'waiting',
                  'bg-green-100 text-green-800': game.status === 'in_progress',
                  'bg-gray-100 text-gray-800': game.status === 'stopped'
                }"
              >
                {{ getStatusText(game) }}
              </span>
            </div>

            <!-- Participants -->
            <div class="mt-2 text-sm text-gray-700">
              <strong>Participants ({{ game.players?.length || 1 }}):</strong>
              <span v-for="(p, idx) in game.players || []" :key="idx">
                {{ p.name }}<span v-if="idx < (game.players.length -1)">, </span>
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 mt-4 md:mt-0">
            <button 
              v-if="game.status === 'waiting'"
              @click="joinGame(game.id)"
              :disabled="!playerName.trim() || loading"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Rejoindre
            </button>

            <button 
              v-if="game.status === 'in_progress' && isCreator(game)"
              @click="endGame(game.id)"
              :disabled="loading"
              class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Terminer
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="text-center mt-8">
      <button 
        @click="fetchGames"
        class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
      >
        Rafraîchir
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { navigateTo } from '#imports'

const games = ref([])
const playerName = ref('')
const gameName = ref('')
const loading = ref(false)

const fetchGames = async () => {
  try {
    const data = await $fetch('http://localhost:5000/api/games')
    games.value = data
  } catch (error) {
    console.error('Erreur chargement parties:', error)
  }
}

const createGame = async () => {
  if (!playerName.value.trim() || !gameName.value.trim()) {
    alert('Nom du joueur et nom de la partie requis')
    return
  }

  loading.value = true
  try {
    const result = await $fetch('http://localhost:5000/api/games', {
      method: 'POST',
      body: { username: playerName.value, name: gameName.value }
    })
    sessionStorage.setItem(`game_${result.id}_playerId`, result.creatorId || 1)
    navigateTo(`/game/${result.id}`)
  } catch (error) {
    alert('Erreur création partie: ' + (error.data?.error || error.message))
    console.error(error)
  }
  loading.value = false
}

const joinGame = async (gameId) => {
  if (!playerName.value.trim()) {
    alert('Entrez votre nom')
    return
  }

  loading.value = true
  try {
    const result = await $fetch(`http://localhost:5000/api/games/join/${gameId}`, {
      method: 'POST',
      body: { playerName: playerName.value }
    })
    sessionStorage.setItem(`game_${gameId}_playerId`, result.playerId || 1)
    // navigateTo(`/game/${gameId}`)
  } catch (error) {
    alert('Erreur rejoindre partie: ' + (error.data?.error || error.message))
    console.error(error)
  }
  loading.value = false
}

const endGame = async (gameId) => {
  loading.value = true
  try {
    await $fetch(`http://localhost:5000/api/games/end/${gameId}`, {
      method: 'POST'
    })
    await fetchGames()
  } catch (error) {
    alert('Erreur terminer partie: ' + (error.data?.error || error.message))
  }
  loading.value = false
}

const getStatusText = (game) => {
  switch (game.status) {
    case 'waiting': return 'En attente'
    case 'in_progress': return 'En cours'
    case 'stopped': return 'Terminée'
    default: return 'Inconnue'
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('fr-FR')
}

const isCreator = (game) => {
  // suppose que le premier joueur (creator) est toujours le créateur
  return game.creator === playerName.value
}

onMounted(() => {
  fetchGames()
  setInterval(fetchGames, 5000)
})
</script>
