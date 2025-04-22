<template>
  <div class="game-host">
    <div v-if="!gameStarted">
      <h2>Host a New Game</h2>
      <button @click="createGame">Create Game</button>
    </div>
    <div v-else>
      <h2>Game PIN: {{ gamePin }}</h2>
      <div class="groups-list">
        <h3>Connected Groups:</h3>
        <ul>
          <li v-for="group in groups" :key="group.id">
            {{ group.name }}
            <span v-if="group.questionSubmitted">(Question submitted)</span>
          </li>
        </ul>
      </div>
      <button @click="startQuestionPhase" :disabled="groups.length < 2">
        Start Question Phase
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';

const gameStarted = ref(false);
const gamePin = ref('');
const groups = ref<any[]>([]);
const ws = ref<WebSocket | null>(null);

const createGame = async () => {
  try {
    const response = await axios.post('http://localhost:3000/api/games', {
      hostId: crypto.randomUUID()
    });
    gamePin.value = response.data.pin;
    gameStarted.value = true;
    connectWebSocket();
  } catch (error) {
    console.error('Error creating game:', error);
  }
};

const connectWebSocket = () => {
  ws.value = new WebSocket('ws://localhost:3000');
  
  ws.value.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'group_joined') {
      groups.value.push(data.group);
    }
  };
};

const startQuestionPhase = () => {
  if (ws.value) {
    ws.value.send(JSON.stringify({
      type: 'start_question_phase',
      gamePin: gamePin.value
    }));
  }
};
</script>

<style scoped>
.game-host {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.groups-list {
  margin: 20px 0;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>