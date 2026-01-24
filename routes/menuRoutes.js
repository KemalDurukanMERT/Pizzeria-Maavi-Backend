import express from 'express';
import {
    getMenu,
    getCategories,
    getProducts,
    getProduct,
    getIngredients,
} from '../controllers/menuController.js';

const router = express.Router();

// Public routes - no authentication required
router.get('/', getMenu);
router.get('/categories', getCategories);
router.get('/products', getProducts);
router.get('/products/:id', getProduct);
router.get('/ingredients', getIngredients);

export default router;
