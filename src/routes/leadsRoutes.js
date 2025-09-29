const express = require('express');
const { route } = require('./productRoutes');
const { parse } = require('csv-parse');
const util = require('util');
const parsePromise = util.promisify(parse);

module.exports = ({ query, dayjs, stringify }) => {
    const router = express.Router();

    // Read
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

    // Create
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

    // Edit
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

    // Delete
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

    // Export CSV
    router.get('/leads/export', async (req, res) => {
        try {
            const result = await query(`
                SELECT
                  lead_id,
                  lead_name,
                  lead_phone,
                  lead_email,
                  lead_address,
                  lead_notes
                FROM leads
            `);

            const leads = result.rows;

            const columns = [
                'lead_id', 'lead_name', 'lead_phone', 'lead_email', 'lead_address', 'lead_notes'
            ];

            // Use the passed in stringify for CSV generation
            stringify(leads, { header: true, columns: columns }, (err, output) => {
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

    // Import CSV
    router.post('/leads/import', async (req, res) => {
        const csvText = req.body;

        if(!csvText || typeof csvText !== 'string'){
            return res.status(400).json({ error: 'CSV data is missing or invalid' });
        }

        try {
            const data = req.body;
            const records = await parsePromise(csvText, {
                columns: true,
                skip_empty_lines: true
            });

            for (const record of records){
                const { lead_name, lead_phone, lead_email, lead_address, lead_notes } = record;
                //TODO check if phone already exist

                const existingData = await query(
                    `SELECT lead_id FROM leads WHERE lead_phone = $1 OR lead_email = $2`,
                    [lead_phone || null, lead_email || null]
                )

                const existingLead = existingData.rows[0];
                const updated_at = new Date();
                
                if(existingLead){
                    await query(
                        `UPDATE leads SET 
                            lead_name = $1, 
                            lead_phone = $2,  
                            lead_email = $3, 
                            lead_address = $4, 
                            lead_notes = $5,
                            updated_at = $6
                        WHERE lead_id = $7`,
                        [lead_name, lead_phone, lead_email, lead_address, lead_notes, updated_at, existingLead.lead_id]
                    );
                }

                else{
                    await query(
                        `INSERT INTO leads (lead_name, lead_phone, lead_email, lead_address, lead_notes)
                        VALUES ($1, $2, $3, $4, $5)`,
                        [lead_name, lead_phone, lead_email, lead_address, lead_notes]
                    );
                }
            }

            res.status(200).json({ message: 'Leads imported successfully.' });
        } catch (error) {
            console.error('Error importing leads: ', error);
            res.status(500).json({ error: 'Failed to import leads. Check CSV format.', details: error.message });
 
        }
    })
    return router;
};