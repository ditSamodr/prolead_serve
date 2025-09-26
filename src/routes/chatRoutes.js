// src/chatRoute.js
const express = require('express');

// This module exports a function that takes dependencies and returns the router
module.exports = ({ openai, query }) => {
    const router = express.Router();

    // POST /api/chat
    router.post('/chat', async (req, res) => {
        const { sessionId, messages } = req.body;

        if (!sessionId || !messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Messages array is required and cannot be empty.' });
        }

        try {
            const userMessage = messages[messages.length - 1];
            await query('INSERT INTO messages(session_id, role, content) VALUES($1, $2, $3)', [sessionId, userMessage.role, userMessage.content]);

            const response = await openai.chat.completions.create({
                model: "gpt-4.1-nano",
                messages: messages,
            });

            const reply = response.choices?.[0]?.message?.content || "No reply from AI";
            await query('INSERT INTO messages(session_id, role, content) VALUES($1, $2, $3)', [sessionId, 'assistant', reply]);
            res.json({ reply });
        } catch (error) {
            console.error("Error calling OpenAI API: ", error);
            res.status(500).json({ error: 'Failed to get response from AI.' });
        }
    });

    return router;
};