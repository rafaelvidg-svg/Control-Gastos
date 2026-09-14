const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportes.controller');
const { verifyToken } = require('../middleware/auth');

// Obtener reportes por período del usuario autenticado (diario, semanal, mensual, anual)
router.get('/', verifyToken, reportesController.getReportes);

module.exports = router;
