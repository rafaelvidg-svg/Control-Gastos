const express = require('express');
const router = express.Router();
const categoriasController = require('../controllers/categorias.controller');
const { optionalToken, verifyToken } = require('../middleware/auth');

// Listar categorías (funciona público o autenticado)
router.get('/', optionalToken, categoriasController.getCategorias);

// Crear categoría
router.post('/', optionalToken, categoriasController.createCategoria);

// Editar categoría
router.put('/:id', optionalToken, categoriasController.updateCategoria);

// Eliminar categoría
router.delete('/:id', optionalToken, categoriasController.deleteCategoria);

module.exports = router;
