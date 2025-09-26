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
const { stringify } = require('csv-stringify');
const dayjs = require('dayjs');

app.use(cors());

app.use("/api", productRoute);


const PORT = process.env.PORT || 5001;


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

//connectAndQuery();
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

//getUsers();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const chatRoutes = require('./src/routes/chatRoutes');
const sessionRoutes = require('./src/routes/sessionRoutes');
const leadsRoutes = require('./src/routes/leadsRoutes');

app.use(express.text({ type: 'text/csv' }));
app.use('/api', sessionRoutes({ query }));
app.use('/api', chatRoutes({ openai, query }));
app.use('/api', leadsRoutes({ query, dayjs, stringify }));

app.listen(PORT, ()=> console.log(`server is running on port ${PORT}`));
