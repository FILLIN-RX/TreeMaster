<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { io } from 'socket.io-client'

// ⚡ URL de ton serveur Socket.io
const socket = io('http://localhost:5000') 

const games = ref([])
const newGameName = ref('')
// const currentUserId = ref(1) // Simuler un utilisateur connecté (à remplacer par auth réelle)

onMounted(() => {
  // Connexion au socket
  socket.on('connect', () => {
    console.log('Connecté au socket', socket.id)
    socket.emit('game:list') // Demande initiale de la liste
  })

  // Réception de la liste des parties
  socket.on('game:list:response', (rows) => {
    games.value = rows
    console.log('Liste des parties reçue', rows)
  })

  // Réception d'une nouvelle partie créée
  socket.on('game:created', (game) => {
    games.value.unshift(game)
  })

  // Réception d'une partie arrêtée
  socket.on('game:stopped', (game) => {
    const index = games.value.findIndex(g => g.id === game.id)
    if (index !== -1) games.value[index] = game
  })
})

onBeforeUnmount(() => {
  socket.disconnect()
})

// Créer une partie
function createGame() {
  if (!newGameName.value.trim()) return
  socket.emit('game:create', { creator: newGameName.value })
  newGameName.value = ''
}

// Arrêter une partie
function stopGame(gameId) {
  socket.emit('game:stop', { gameId })
}
</script>

<template>
  <div class="p-4 max-w-lg mx-auto">
    <h1 class="text-2xl font-bold mb-4">Jeu de Pari Multi-joueurs</h1>

    <div class="mb-4 flex gap-2">
      <input v-model="newGameName" placeholder="Nom de la partie" class="border p-2 flex-1 rounded">
      <button class="bg-blue-500 text-white px-4 py-2 rounded" @click="createGame">Créer</button>
    </div>

    <h2 class="text-xl font-bold mb-2">Parties en cours / en attente</h2>
    <ul class="border rounded p-2">
      <li v-for="g in games" :key="g.id" class="border-b p-2 flex justify-between items-center">
  <span>{{ g.creator }} - {{ g.name }} ({{ g.status }})</span>
  <div class="flex gap-2">
    <button v-if="g.status === 'waiting'" @click="joinGame(g.id)" class="bg-green-500 text-white px-2 py-1 rounded text-sm">Rejoindre</button>
    <button v-if="g.status !== 'stopped'" @click="stopGame(g.id)" class="bg-red-500 text-white px-2 py-1 rounded text-sm">Arrêter</button>
  </div>
</li>

    </ul>
  </div>
</template>
