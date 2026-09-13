const express = require('express');
const router = express.Router();
const gastosController = require('../controllers/gastos.controller');
const { optionalToken } = require('../middleware/auth');

// Listar gastos con filtros opcionales por rango de fecha
router.get('/', optionalToken, gastosController.getGastos);

// Registrar nuevo gasto
router.post('/', optionalToken, gastosController.createGasto);

// Eliminar un gasto
router.delete('/:id', optionalToken, gastosController.deleteGasto);

module.exports = router;
