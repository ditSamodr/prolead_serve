require('dotenv').config();
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();
const { query } = require('./src/db.js');
app.use(express.json());
dotenv.config();
const db = require('./src/db.js');
const productRoute = require('./src/routes/productRoutes.js');
const OpenAI = require('openai');

let products = [];

// app.get(/^\/(?!api).*/, (req, res) => 
//     res.sendFile(path.join(__dirname, '../Client/dist/index.html'))
// ); 

app.use(cors());

app.use("/api", productRoute);


const PORT = process.env.PORT || 5001;
app.listen(PORT, ()=> console.log(`server is running on port ${PORT}`));

//DB connect test
db.query('SELECT current_database()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database', err);
  } else {
    const dbName = res.rows[0].current_database;
    console.log(`Database Connected successfully to: ${dbName}`);
  }
});

async function connectAndQuery() {
  try {
    const res = await db.query('SELECT NOW()');
    console.log('Connected to PostgreSQL database!');
    console.log(res.rows[0]);
  } catch (err) {
    console.error('Error connecting to the database:', err);
  } finally {
  }
}

connectAndQuery();
//DB table connection test
async function getUsers() {
  try {
    const res = await db.query('SELECT * FROM products');
    console.log('✅ Users from the database:');
    console.table(res.rows); 
  } catch (err) {
    console.error('❌ Error fetching users:', err.stack);
  }
}

// Call the function to display the table contents
getUsers();

// const allowedOrigins = [
//         'https://umbra-2.prolead.id',
// ];

// const corsOptions = {
//   origin: (origin, callback) => {
//     // If the request origin is in our allowed list, allow it
//     if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   }
// };

//app.use(cors(corsOptions));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/session', async (req, res) => {
  try{
    const result = await query('INSERT INTO sessions DEFAULT VALUES RETURNING id');
    const sessionId = result.rows[0].id;
    res.json({ sessionId });
  } catch (error){
    console.error('Error creating new session: ', error);
    res.status(500).json({ error: 'FAILED TO START NEW SESSION. '});
  }
})

app.post('/api/chat', async (req, res)=>{
  const { sessionId, messages } = req.body;

  if(!sessionId || !messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required and cannot be empty.' });
  }

  try{
    const userMessage = messages[messages.length -1];
    await query('INSERT INTO messages(session_id, role, content) VALUES($1, $2, $3)', [sessionId, userMessage.role, userMessage.content]);

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: messages,
    });

    const reply = response.choices?.[0]?.message?.content || "No reply from AI";
    await query('INSERT INTO messages(session_id, role, content) VALUES($1, $2, $3)', [sessionId, 'assistant', reply]);
    res.json({ reply });
  }catch(error){
    console.error("Error calling OpenAI API: ", error);
    res.status(500).json({ error: 'Failed to get response from AI. ' });    
  }
});

app.get('/api/sessions-summary', async (req, res) => {
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

// A new endpoint to get messages for a specific session ID
app.get('/api/session/:sessionId', async (req, res) => {
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

app.get('/api/leads', async (req, res) => {
  try {
    // The table name is 'leads' and the data columns are 'lead_id', 'lead_name', etc.
    const result = await query(`
      SELECT lead_id as id, lead_name, lead_phone, lead_email, lead_address, lead_notes FROM leads`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to retrieve leads.' });
  }
});

app.post('/api/leads', async (req, res) => {
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

// New API endpoint to update an existing lead
app.put('/api/leads/:id', async (req, res) => {
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

// New API endpoint to delete a lead
app.delete('/api/leads/:id', async (req, res) => {
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