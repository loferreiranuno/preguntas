<template>
  <div class="game-participant">
    <div v-if="!joined">
      <h2>Join a Game</h2>
      <div class="join-form">
        <input v-model="gamePin" placeholder="Enter Game PIN" />
        <input v-model="groupName" placeholder="Enter Group Name" />
        <button @click="joinGame" :disabled="!gamePin || !groupName">
          Join Game
        </button>
      </div>
    </div>
    <div v-else-if="questionPhase && !questionSubmitted">
      <h2>Submit Your Question</h2>
      <div class="question-form">
        <input v-model="question" placeholder="Enter your question" />
        <div v-for="(option, index) in options" :key="index" class="option-input">
          <input v-model="options[index]" :placeholder="'Option ' + (index + 1)" />
        </div>
        <select v-model="correctOption">
          <option v-for="(_, index) in options" :key="index" :value="index">
            Option {{ index + 1 }} is correct
          </option>
        </select>
        <button @click="submitQuestion" :disabled="!isQuestionValid">
          Submit Question
        </button>
      </div>
    </div>
    <div v-else-if="answerPhase">
      <h2>Answer Question</h2>
      <div v-if="currentQuestion" class="answer-section">
        <h3>{{ currentQuestion.text }}</h3>
        <div class="options">
          <button
            v-for="(option, index) in currentQuestion.options"
            :key="index"
            @click="submitAnswer(index)"
            :disabled="answerSubmitted"
          >
            {{ option }}
          </button>
        </div>
      </div>
    </div>
    <div v-else>
      <h2>Waiting for game to start...</h2>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import axios from 'axios';

const gamePin = ref('');
const groupName = ref('');
const joined = ref(false);
const questionPhase = ref(false);
const answerPhase = ref(false);
const questionSubmitted = ref(false);
const answerSubmitted = ref(false);
const ws = ref<WebSocket | null>(null);

const question = ref('');
const options = ref(['', '', '', '']);
const correctOption = ref(0);
const currentQuestion = ref<any>(null);

const isQuestionValid = computed(() => {
  return (
    question.value.trim() !== '' &&
    options.value.every(opt => opt.trim() !== '')
  );
});

const joinGame = async () => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/groups`, {
      gamePin: gamePin.value,
      name: groupName.value
    });
    joined.value = true;
    connectWebSocket();
  } catch (error) {
    console.error('Error joining game:', error);
  }
};

const connectWebSocket = () => {
  ws.value = new WebSocket(import.meta.env.VITE_WS_URL);
  
  ws.value.onmessage = (event) => {
    const data = JSON.parse(event.data);
    switch (data.type) {
      case 'question_phase_started':
        questionPhase.value = true;
        break;
      case 'answer_phase_started':
        answerPhase.value = true;
        questionPhase.value = false;
        currentQuestion.value = data.question;
        break;
    }
  };
};

const submitQuestion = () => {
  if (ws.value && isQuestionValid.value) {
    ws.value.send(JSON.stringify({
      type: 'submit_question',
      gamePin: gamePin.value,
      groupName: groupName.value,
      question: {
        text: question.value,
        options: options.value,
        correctOption: correctOption.value
      }
    }));
    questionSubmitted.value = true;
  }
};

const submitAnswer = (selectedOption: number) => {
  if (ws.value && !answerSubmitted.value) {
    const startTime = performance.now();
    ws.value.send(JSON.stringify({
      type: 'submit_answer',
      gamePin: gamePin.value,
      groupName: groupName.value,
      selectedOption,
      answerTime: startTime
    }));
    answerSubmitted.value = true;
  }
};
</script>

<style scoped>
.game-participant {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.join-form, .question-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 20px 0;
}

input, select {
  padding: 8px;
  font-size: 16px;
}

.option-input {
  display: flex;
  gap: 10px;
}

.options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 20px;
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