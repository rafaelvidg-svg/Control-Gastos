const express = require('express');
const router = express.Router();
const gastosController = require('../controllers/gastos.controller');
const { verifyToken } = require('../middleware/auth');

// Listar gastos pertenecientes al usuario autenticado
router.get('/', verifyToken, gastosController.getGastos);

// Registrar nuevo gasto para el usuario autenticado
router.post('/', verifyToken, gastosController.createGasto);

// Eliminar un gasto perteneciente al usuario autenticado
router.delete('/:id', verifyToken, gastosController.deleteGasto);

module.exports = router;
