import express from 'express';
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getIngredients,
    createIngredient,
    updateIngredient,
} from '../../controllers/admin/menuController.js';
import { authenticateAdmin, requireRole } from '../../middleware/adminAuth.js';
import { validate, schemas } from '../../middleware/validation.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Category routes
router.get('/categories', getCategories);
router.post('/categories', validate(schemas.createCategory), createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', requireRole('OWNER', 'MANAGER'), deleteCategory);

// Product routes
router.get('/products', getProducts);
router.post('/products', validate(schemas.createProduct), createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', requireRole('OWNER', 'MANAGER'), deleteProduct);

// Ingredient routes
router.get('/ingredients', getIngredients);
router.post('/ingredients', createIngredient);
router.put('/ingredients/:id', updateIngredient);

export default router;
