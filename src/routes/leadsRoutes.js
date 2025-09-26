// src/leadsRoute.js
const express = require('express');

// This module exports a function that takes dependencies and returns the router
module.exports = ({ query, dayjs, stringify }) => {
    const router = express.Router();

    // GET /api/leads
    router.get('/leads', async (req, res) => {
        try {
            const result = await query(`
                SELECT lead_id as id, lead_name, lead_phone, lead_email, lead_address, lead_notes
                FROM leads
            `);
            res.json(result.rows);
        } catch (error) {
            console.error('Error fetching leads:', error);
            res.status(500).json({ error: 'Failed to retrieve leads.' });
        }
    });

    // POST /api/leads
    router.post('/leads', async (req, res) => {
        const { lead_name, lead_phone, lead_email, lead_address, lead_notes } = req.body;
        try {
            const result = await query(
                `INSERT INTO leads (lead_name, lead_phone, lead_email, lead_address, lead_notes)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [lead_name, lead_phone, lead_email, lead_address, lead_notes]
            );
            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Error creating new lead:', error);
            res.status(500).json({ error: 'Failed to create lead.' });
        }
    });

    // PUT /api/leads/:id
    router.put('/leads/:id', async (req, res) => {
        const { id } = req.params;
        const { lead_name, lead_phone, lead_email, lead_address, lead_notes } = req.body;
        try {
            const updated_at = new Date();
            const result = await query(
                `UPDATE leads SET
                 lead_name = $1,
                 lead_phone = $2, lead_email = $3, lead_address = $4, lead_notes = $5, updated_at = $6
                 WHERE lead_id = $7 RETURNING *`,
                [lead_name, lead_phone, lead_email, lead_address, lead_notes, updated_at, id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Lead not found.' });
            }
            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error updating lead:', error);
            res.status(500).json({ error: 'Failed to update lead.' });
        }
    });

    // DELETE /api/leads/:id
    router.delete('/leads/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const result = await query(`DELETE FROM leads WHERE lead_id = $1 RETURNING *`, [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Lead not found.' });
            }
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting lead:', error);
            res.status(500).json({ error: 'Failed to delete lead.' });
        }
    });

    // GET /api/leads/export
    router.get('/leads/export', async (req, res) => {
        try {
            const result = await query(`
                SELECT
                  lead_id,
                  lead_name,
                  lead_phone,
                  lead_email,
                  lead_address,
                  lead_notes,
                  created_at,
                  updated_at
                FROM leads
            `);

            const formattedLeads = result.rows.map(lead => ({
                ...lead,
                // Use the passed in dayjs for formatting
                created_at: lead.created_at ? dayjs(lead.created_at).format('DD/MM/YYYY HH:mm:ss') : null,
                updated_at: lead.updated_at ? dayjs(lead.updated_at).format('DD/MM/YYYY HH:mm:ss') : null,
            }));

            const columns = [
                'lead_id', 'lead_name', 'lead_phone', 'lead_email', 'lead_address', 'lead_notes', 'created_at', 'updated_at'
            ];

            // Use the passed in stringify for CSV generation
            stringify(formattedLeads, { header: true, columns: columns }, (err, output) => {
                if (err) {
                    console.error('Error generating CSV', err);
                    return res.status(500).json({ error: 'Failed to generate CSV.' });
                }
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
                res.send(output);
            });
        } catch (error) {
            console.error('Error exporting leads: ', error);
            res.status(500).json({ error: 'Failed to export leads.' });
        }
    });

    return router;
};