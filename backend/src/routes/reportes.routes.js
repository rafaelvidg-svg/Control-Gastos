const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportes.controller');
const { optionalToken } = require('../middleware/auth');

// Obtener reportes por período (diario, semanal, mensual, anual)
router.get('/', optionalToken, reportesController.getReportes);

module.exports = router;
