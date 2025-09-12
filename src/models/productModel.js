const db = require('../db.js');
//const create


//CRAETE
const createProductService = async(title, price, sold, image) =>{
    const result = await db.query("INSERT INTO products (title, price, sold, image) VALUES ($1, $2, $3, $4) RETURNING *", [title, price, sold, image]);
    return result.rows[0];
};

//READ
const getAllProductService = async() =>{
    const result = await db.query("SELECT * FROM products");
    return result.rows;
};

//UPDATE
const updateProductService = async(id, title, price, sold, image) =>{
    const result = await db.query("UPDATE products SET title=$1, price=$2, sold=$3, image=$4 WHERE id=$5 RETURNING *", [title, price, sold, image, id]);
    return result.rows[0];
}

//DELETE
const deleteProductService = async(id) =>{
    const result = await db.query("DELETE FROM products WHERE id=$1 RETURNING *", [id]);
    return result.rows[0];
}

module.exports = { createProductService, getAllProductService, updateProductService, deleteProductService };