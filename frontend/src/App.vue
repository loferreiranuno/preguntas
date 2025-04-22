<script setup lang="ts">
import { ref } from 'vue';
import GameHost from './components/GameHost.vue';
import GameParticipant from './components/GameParticipant.vue';

const role = ref<'host' | 'participant' | null>(null);
</script>

<template>
  <div class="app">
    <nav>
      <button @click="role = 'host'" :class="{ active: role === 'host' }">Host Game</button>
      <button @click="role = 'participant'" :class="{ active: role === 'participant' }">Join Game</button>
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
