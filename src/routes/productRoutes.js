const express = require('express');
const router = express.Router();
const { createProduct, getAllProduct, updateProduct, deleteProduct } = require('../controller/productController.js');


router.post("/products", createProduct);
router.get("/products", getAllProduct);
router.put("/products/:id",updateProduct);
router.delete("/products/:id", deleteProduct);
module.exports = router;