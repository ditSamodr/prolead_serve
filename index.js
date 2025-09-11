require('dotenv').config();
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const { Pool } = require('pg');
const app = express();
const { query } = require('./src/db.js');
app.use(express.json());
dotenv.config();



app.get(/^\/(?!api).*/, (req, res) => 
    res.sendFile(path.join(__dirname, '../Client/dist/index.html'))
); 


app.get('/api', (req, res, next) => {
    res.status(200).json({
        success: true,
        data: {
            message: 'Hello world 1'
        }
    })
});

app.get('/endpoint-2', (req, res, next) => {
    res.status(200).json({
        success: true,
        data: {
            message: 'Hello world 2'
        }
    })
});


// Get all products
app.get('/products', async (req, res) => {
  try {
    const allProducts = await pool.query("SELECT * FROM products ORDER BY id ASC");
    res.json(allProducts.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, ()=> console.log(`server is running on port ${PORT}`));

query('SELECT current_database()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database', err);
  } else {
    const dbName = res.rows[0].current_database;
    console.log(`Database Connected successfully to: ${dbName}`);
  }
});