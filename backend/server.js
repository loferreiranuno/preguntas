require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const WebSocket = require('ws');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// Track connected users
let onlineUsers = 0;

const broadcastOnlineUsers = () => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'online_users', count: onlineUsers }));
        }
    });
};

// Database configuration
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// Game state management
const activeGames = new Map();

class Game {
    constructor(pin, hostId) {
        this.pin = pin;
        this.hostId = hostId;
        this.groups = new Map();
        this.state = 'waiting'; // waiting -> question -> answer -> scores
        this.questions = new Map();
        this.answers = new Map();
        this.hostWs = null;
    }

    addGroup(name, ws) {
        this.groups.set(name, { ws, questionSubmitted: false });
        this.broadcastToHost({ type: 'group_joined', group: { name, questionSubmitted: false } });
    }

    submitQuestion(groupName, question) {
        const group = this.groups.get(groupName);
        if (group) {
            this.questions.set(groupName, question);
            group.questionSubmitted = true;
            this.broadcastToHost({ 
                type: 'question_submitted', 
                groupName, 
                allSubmitted: this.areAllQuestionsSubmitted() 
            });
        }
    }

    submitAnswer(groupName, questionId, selectedOption, answerTime) {
        const answers = this.answers.get(questionId) || new Map();
        answers.set(groupName, { selectedOption, answerTime });
        this.answers.set(questionId, answers);

        if (this.haveAllGroupsAnswered(questionId)) {
            this.calculateAndBroadcastScores(questionId);
        }
    }

    areAllQuestionsSubmitted() {
        return Array.from(this.groups.values()).every(group => group.questionSubmitted);
    }

    haveAllGroupsAnswered(questionId) {
        const answers = this.answers.get(questionId);
        return answers && answers.size === this.groups.size;
    }

    calculateAndBroadcastScores(questionId) {
        const question = Array.from(this.questions.values())[questionId];
        const answers = this.answers.get(questionId);
        const scores = new Map();

        answers.forEach((answer, groupName) => {
            const isCorrect = answer.selectedOption === question.correctOption;
            const timeBonus = Math.max(0, 1000 - answer.answerTime) / 100;
            scores.set(groupName, isCorrect ? (10 + timeBonus) : 0);
        });

        this.broadcastToAll({
            type: 'question_scores',
            scores: Object.fromEntries(scores),
            correctOption: question.correctOption
        });
    }

    broadcastToHost(message) {
        if (this.hostWs && this.hostWs.readyState === WebSocket.OPEN) {
            this.hostWs.send(JSON.stringify(message));
        }
    }

    broadcastToAll(message) {
        const payload = JSON.stringify(message);
        this.groups.forEach(({ ws }) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(payload);
            }
        });
        this.broadcastToHost(message);
    }
}

// Initialize WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// WebSocket connection handling
wss.on('connection', (ws) => {
    onlineUsers++;
    broadcastOnlineUsers();
    
    ws.on('close', () => {
        onlineUsers--;
        broadcastOnlineUsers();
    });

    ws.on('message', async (message) => {
        const data = JSON.parse(message);
        const game = activeGames.get(data.gamePin);

        if (!game) return;

        switch (data.type) {
            case 'host_connected':
                game.hostWs = ws;
                break;

            case 'join_game':
                game.addGroup(data.groupName, ws);
                break;

            case 'start_question_phase':
                game.state = 'question';
                game.broadcastToAll({ type: 'question_phase_started' });
                break;

            case 'submit_question':
                game.submitQuestion(data.groupName, data.question);
                break;

            case 'start_answer_phase':
                if (game.areAllQuestionsSubmitted()) {
                    game.state = 'answer';
                    const questions = Array.from(game.questions.values());
                    game.broadcastToAll({ 
                        type: 'answer_phase_started',
                        totalQuestions: questions.length
                    });

                    // Start with the first question
                    game.broadcastToAll({
                        type: 'new_question',
                        question: questions[0],
                        questionNumber: 1
                    });
                }
                break;

            case 'submit_answer':
                game.submitAnswer(
                    data.groupName,
                    data.questionId,
                    data.selectedOption,
                    data.answerTime
                );
                break;
        }
    });
});

// API Routes
app.post('/api/games', async (req, res) => {
    try {
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        const hostId = crypto.randomUUID();
        const result = await pool.query(
            'INSERT INTO games (pin, host_id, state) VALUES ($1, $2, $3) RETURNING *',
            [pin, hostId, 'waiting']
        );
        
        const game = new Game(pin, hostId);
        activeGames.set(pin, game);
        
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/groups', async (req, res) => {
    try {
        const { gamePin, name } = req.body;
        const result = await pool.query(
            'INSERT INTO groups (game_id, name) VALUES ((SELECT id FROM games WHERE pin = $1), $2) RETURNING *',
            [gamePin, name]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});

// Integrate WebSocket with HTTP server
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});