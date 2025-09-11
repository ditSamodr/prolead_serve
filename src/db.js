const { Pool } = require('pg');

console.log(process.env.DB_USER);
console.log(process.env.DB_HOST);

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const query = (text, params) => pool.query(text, params);

pool.on("connect", () => {
    console.log("Connection pool is established");
});

module.exports = {
  query,
};