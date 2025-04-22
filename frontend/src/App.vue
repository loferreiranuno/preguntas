<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import GameHost from './components/GameHost.vue';
import GameParticipant from './components/GameParticipant.vue';

const role = ref<'host' | 'participant' | null>(null);
const onlineUsers = ref(0);

const ws = new WebSocket(import.meta.env.VITE_WS_URL);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'online_users') {
    onlineUsers.value = data.count;
  }
};

onUnmounted(() => {
  ws.close();
});
</script>

<template>
  <div class="app">
    <nav>
      <button @click="role = 'host'" :class="{ active: role === 'host' }">Host Game</button>
      <button @click="role = 'participant'" :class="{ active: role === 'participant' }">Join Game</button>
      <div class="online-users">
        Online Users: {{ onlineUsers }}
      </div>
    </nav>
    <main>
      <GameHost v-if="role === 'host'" />
      <GameParticipant v-else-if="role === 'participant'" />
      <div v-else class="welcome">
        <h1>Welcome to the Quiz Game</h1>
        <p>Choose your role to begin</p>
      </div>
    </main>
  </div>
</template>

<style>
.app {
  font-family: Arial, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

nav {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
}

nav button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  border: 1px solid #ccc;
  background: white;
  border-radius: 4px;
}

nav button.active {
  background: #007bff;
  color: white;
  border-color: #0056b3;
}

.online-users {
  margin-left: auto;
  padding: 8px 12px;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 14px;
}

.welcome {
  text-align: center;
  margin-top: 100px;
}

main {
  padding: 20px;
  border-radius: 8px;
  background: #f8f9fa;
}
</style>
