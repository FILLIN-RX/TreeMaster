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
            <h1 class="text-2xl font-bold">Partie #{{ $route.params.id }}</h1>
            <p class="text-gray-600">Tour {{ gameState.turn }} - {{ getStateText() }}</p>
          </div>
          <NuxtLink to="/games" class="px-4 py-2 bg-gray-600 text-white rounded-md">
            Retour
          </NuxtLink>
        </div>
      </div>

      <!-- Joueurs -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Joueurs</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            v-for="player in gameState.players"
            :key="player.id"
            class="p-4 border rounded-lg"
            :class="{
              'bg-green-50 border-green-300': player.id === gameState.currentPlayer,
              'bg-gray-50': player.id !== gameState.currentPlayer
            }"
          >
            <div class="flex justify-between items-center">
              <div>
                <h3 class="font-semibold">{{ player.name }}</h3>
                <p class="text-sm text-gray-600">{{ player.points }} points</p>
              </div>
              <div class="text-right">
                <span 
                  v-if="player.id === gameState.currentPlayer"
                  class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                >
                  Son tour
                </span>
                <span 
                  v-else-if="gameState.state === 'waiting'"
                  class="px-2 py-1 rounded text-xs"
                  :class="player.isReady ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
                >
                  {{ player.isReady ? 'Prêt' : 'En attente' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Phase d'attente -->
      <div v-if="gameState.state === 'waiting'" class="bg-yellow-50 rounded-lg p-6 mb-6">
        <h3 class="text-lg font-semibold mb-2">En attente du début de partie</h3>
        <p class="mb-4">{{ gameState.players.length }}/4 joueurs - Cliquez sur "Prêt" pour commencer</p>
        
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

      <!-- Phase de jeu -->
      <div v-if="gameState.state === 'playing'" class="space-y-6">
        
        <!-- Parier -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold mb-4">Placer un pari</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium mb-2">Montant</label>
              <input 
                v-model.number="betAmount"
                type="number" 
                min="1" 
                :max="playerPoints"
                class="w-full px-3 py-2 border rounded-md"
                placeholder="Points à parier"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Prédiction</label>
              <select v-model="betPrediction" class="w-full px-3 py-2 border rounded-md">
                <option value="">Choisir...</option>
                <option value="even">Pair (x1.8)</option>
                <option value="odd">Impair (x1.8)</option>
                <option value="2">Exactement 2 (x5)</option>
                <option value="3">Exactement 3 (x5)</option>
                <option value="4">Exactement 4 (x5)</option>
                <option value="5">Exactement 5 (x5)</option>
                <option value="6">Exactement 6 (x5)</option>
                <option value="7">Exactement 7 (x5)</option>
                <option value="8">Exactement 8 (x5)</option>
                <option value="9">Exactement 9 (x5)</option>
                <option value="10">Exactement 10 (x5)</option>
                <option value="11">Exactement 11 (x5)</option>
                <option value="12">Exactement 12 (x5)</option>
              </select>
            </div>
            
            <div class="flex items-end">
              <button 
                @click="placeBet"
                :disabled="!canPlaceBet() || loading"
                class="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                Parier
              </button>
            </div>
          </div>
        </div>

        <!-- Lancer les dés -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold mb-4">Lancer les dés</h3>
          
          <div v-if="isMyTurn()" class="text-center">
            <p class="mb-4 text-green-600 font-medium">C'est votre tour !</p>
            <button 
              @click="rollDice"
              :disabled="loading"
              class="px-8 py-3 bg-red-600 text-white rounded-lg text-lg font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              {{ loading ? 'Lancement...' : '🎲 Lancer les dés' }}
            </button>
          </div>
          
          <div v-else class="text-center text-gray-600">
            <p>En attente du tour de {{ getCurrentPlayerName() }}</p>
          </div>
        </div>

        <!-- Dernier résultat -->
        <div v-if="lastResult" class="bg-blue-50 rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-2">Dernier lancer</h3>
          <div class="flex items-center gap-4">
            <div class="text-4xl">🎲</div>
            <div>
              <p><strong>Dés:</strong> {{ lastResult.dice?.join(' + ') }} = {{ lastResult.total }}</p>
              <p><strong>Joueur:</strong> {{ getPlayerName(lastResult.playerId) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Partie terminée -->
      <div v-if="gameState.state === 'finished'" class="bg-green-50 rounded-lg p-6 text-center">
        <h3 class="text-2xl font-bold mb-4">🎉 Partie terminée !</h3>
        <div v-if="winner">
          <p class="text-xl mb-2">Gagnant: <strong>{{ winner.name }}</strong></p>
          <p class="text-lg text-gray-600">{{ winner.points }} points</p>
        </div>
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
const playerId = ref(null) // À récupérer du localStorage ou session
const betAmount = ref(10)
const betPrediction = ref('')
const lastResult = ref(null)
const winner = ref(null)

const playerPoints = computed(() => {
  if (!gameState.value || !playerId.value) return 0
  const player = gameState.value.players.find(p => p.id === playerId.value)
  return player?.points || 0
})

const fetchGameState = async () => {
  try {
    const data = await $fetch(`/api/games/${gameId}/state`)
    gameState.value = data.gameState
  } catch (error) {
    console.error('Erreur chargement état:', error)
  }
}

const setReady = async () => {
  if (!playerId.value) return
  
  loading.value = true
  try {
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

const placeBet = async () => {
  if (!canPlaceBet()) return
  
  loading.value = true
  try {
    await $fetch(`/api/games/${gameId}/bet`, {
      method: 'POST',
      body: { 
        playerId: playerId.value,
        amount: betAmount.value,
        prediction: betPrediction.value
      }
    })
    // Reset form
    betAmount.value = 10
    betPrediction.value = ''
  } catch (error) {
    alert('Erreur pari: ' + error.data?.error)
  }
  loading.value = false
}

const rollDice = async () => {
  if (!isMyTurn()) return
  
  loading.value = true
  try {
    const result = await $fetch(`/api/games/${gameId}/roll`, {
      method: 'POST',
      body: { playerId: playerId.value }
    })
    
    lastResult.value = result.result
    if (result.result.gameFinished) {
      winner.value = result.result.winner
    }
    
    await fetchGameState()
  } catch (error) {
    alert('Erreur lancer: ' + error.data?.error)
  }
  loading.value = false
}

const isMyTurn = () => {
  return gameState.value?.currentPlayer === playerId.value
}

const isPlayerReady = () => {
  if (!gameState.value || !playerId.value) return false
  const player = gameState.value.players.find(p => p.id === playerId.value)
  return player?.isReady || false
}

const canPlaceBet = () => {
  return betAmount.value > 0 && 
         betAmount.value <= playerPoints.value && 
         betPrediction.value && 
         playerId.value
}

const getCurrentPlayerName = () => {
  if (!gameState.value) return ''
  const player = gameState.value.players.find(p => p.id === gameState.value.currentPlayer)
  return player?.name || ''
}

const getPlayerName = (id) => {
  if (!gameState.value) return ''
  const player = gameState.value.players.find(p => p.id === id)
  return player?.name || ''
}

const getStateText = () => {
  switch (gameState.value?.state) {
    case 'waiting': return 'En attente'
    case 'playing': return 'En cours'
    case 'finished': return 'Terminée'
    default: return ''
  }
}

onMounted(async () => {
  // Récupérer l'ID du joueur (temporaire - à améliorer)
  playerId.value = parseInt(sessionStorage.getItem(`game_${gameId}_playerId`)) || 1
  
  await fetchGameState()
  
  // Polling pour les mises à jour
  const interval = setInterval(fetchGameState, 2000)
  
  onUnmounted(() => {
    clearInterval(interval)
  })
})
</script>