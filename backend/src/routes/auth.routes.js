const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth');

// Rutas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);

// Rutas protegidas con JWT
router.get('/me', verifyToken, authController.getProfile);
router.put('/limite-diario', verifyToken, authController.updateDailyLimit);

module.exports = router;
