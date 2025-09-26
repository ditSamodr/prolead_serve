// src/sessionRoute.js
const express = require('express');

// This module exports a function that takes dependencies and returns the router
module.exports = ({ query }) => {
    const router = express.Router();

    // POST /api/session (Create new session)
    router.post('/session', async (req, res) => {
        try {
            const result = await query('INSERT INTO sessions DEFAULT VALUES RETURNING id');
            const sessionId = result.rows[0].id;
            res.json({ sessionId });
        } catch (error) {
            console.error('Error creating new session: ', error);
            res.status(500).json({ error: 'FAILED TO START NEW SESSION.' });
        }
    });

    // GET /api/sessions-summary
    router.get('/sessions-summary', async (req, res) => {
        try {
            const result = await query(`
                SELECT
                  session_id,
                  COUNT(*) AS chat_count,
                  MAX(created_at) AS last_message_date,
                  (
                    SELECT content
                    FROM messages
                    WHERE session_id = m.session_id
                    ORDER BY created_at DESC
                    LIMIT 1
                  ) AS last_message_content,
                  (
                    SELECT role
                    FROM messages
                    WHERE session_id = m.session_id
                    ORDER BY created_at DESC
                    LIMIT 1
                  ) AS last_message_role
                FROM messages m
                GROUP BY session_id
                ORDER BY last_message_date DESC
            `);
            res.json({ sessions: result.rows });
        } catch (error) {
            console.error('Error fetching session summaries: ', error);
            res.status(500).json({ error: 'Failed to retrieve session summaries.' });
        }
    });

    // GET /api/session/:sessionId (Get messages for a specific session)
    router.get('/session/:sessionId', async (req, res) => {
        const { sessionId } = req.params;
        try {
            const result = await query(
                `SELECT
                   session_id,
                   role,
                   content,
                   TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS date
                 FROM messages
                 WHERE session_id = $1
                 ORDER BY created_at`,
                [sessionId]
            );
            res.json({ messages: result.rows });
        } catch (error) {
            console.error('Error fetching chat history for session: ', error);
            res.status(500).json({ error: 'Failed to retrieve chat history for this session.' });
        }
    });

    return router;
};