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

let products = [];

// app.get(/^\/(?!api).*/, (req, res) => 
//     res.sendFile(path.join(__dirname, '../Client/dist/index.html'))
// ); 

app.use(cors());

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


app.use("/api", productRoute);

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const allProducts = await db.query("SELECT * FROM products ORDER BY id ASC");
    res.json(allProducts.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.post('/api/products', async(req, res) => {
    const newProduct = {
        id: Date.now().toString(), // Simple unique ID
        ...req.body
    };
    products.push(newProduct);
    console.log('New product received:', newProduct);
    res.status(201).json(newProduct); // Respond with the newly created product
});


const PORT = process.env.PORT || 5001;
app.listen(PORT, ()=> console.log(`server is running on port ${PORT}`));

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