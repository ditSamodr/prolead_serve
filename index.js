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

app.post('/api/chat', async (req, res)=>{
  const { message } = req.body;

  if(!message){
    return res.status(400).json({ error: 'Message is Required '});
  }

  try{
    const { message } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: message}],
    });

    //res.json({ reply: response.choises[0].message.content });
    const reply = response.choices?.[0]?.message?.content || "No reply from AI";
    
    res.json({ reply });
  }catch(error){
    console.error("Error calling OpenAI API: ", error);
    res.status(500).json({ error: 'Failed to get response from AI. ' });    
  }
});

