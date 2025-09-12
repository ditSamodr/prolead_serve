const { createProductService, getAllProductService, updateProductService, deleteProductService } = require('../models/productModel.js');

const handleResponse = (res, status, message, data = null) =>{
    res.status(status).json({
        status, message, data,
    });
};

const getAllProduct = async(req, res, next)=>{
    try{
        const products = await getAllProductService();
        handleResponse(res, 200, "Product Fetched Succesfully", products);
    }catch(err){
        next(err);
    }
}

const createProduct = async(req, res, next)=>{
    const { title, price, sold, image } = req.body;
    try{
        const newProducts = await createProductService(title, price, sold, image);
        handleResponse(res, 201, "Product Created Succesfully", newProducts)
    }catch(err){
        next(err);
    }
};

const updateProduct = async(req, res, next)=>{
    const{ title, price, sold, image} = req.body;
    try {
        const updatedProducts = await updateProductService(req.params.id, title, price, sold, image);
        handleResponse(res, 200, "Product updated successfully", updatedProducts)
    } catch (err) {
        next(err);
        
    }
}

const deleteProduct = async(req, res, next)=>{
    try {
        const deletedProducts = await deleteProductService(req.params.id);
        handleResponse(res, 200, "Food deleted Succesfully", deletedProducts)
    } catch (err) {
        next(err);
    }
}

module.exports = { createProduct, getAllProduct, updateProduct, deleteProduct };