const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const db = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const gastosRoutes = require('./routes/gastos.routes');
const categoriasRoutes = require('./routes/categorias.routes');
const reportesRoutes = require('./routes/reportes.routes');

// Rutas de autenticación
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

// Rutas de Gastos (montadas tanto en /api/gastos como en /gastos según requerimiento)
app.use('/api/gastos', gastosRoutes);
app.use('/gastos', gastosRoutes);

// Rutas de Categorías
app.use('/api/categorias', categoriasRoutes);
app.use('/categorias', categoriasRoutes);

// Rutas de Reportes
app.use('/api/reportes', reportesRoutes);
app.use('/reportes', reportesRoutes);

// Health check y estado del sistema
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    db_mode: db.isPgConnected() ? 'PostgreSQL' : 'Fallback Local Persistente',
    timestamp: new Date().toISOString(),
  });
});

// Manejador de errores no capturados
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message,
  });
});

// Iniciar base de datos y servidor HTTP
async function startServer() {
  await db.initDb();
  app.listen(PORT, () => {
    console.log(` Servidor de Control de Gastos corriendo en http://localhost:${PORT}`);
    console.log(` Modo de base de datos: ${db.isPgConnected() ? 'PostgreSQL Activo' : 'Fallback Local Activo'}`);
  });
}

startServer();
