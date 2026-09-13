const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

// Registrar nuevo usuario
async function register(req, res) {
  try {
    const { nombre, email, password, limite_diario } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
    }

    // Verificar si el correo ya existe
    const existing = await db.query('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const dailyLimit = limite_diario ? parseFloat(limite_diario) : 100.00;

    const result = await db.query(
      'INSERT INTO usuarios (nombre, email, password_hash, limite_diario) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, limite_diario, created_at',
      [nombre.trim(), email.toLowerCase().trim(), password_hash, dailyLimit]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, nombre: user.nombre },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      usuario: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        limite_diario: parseFloat(user.limite_diario),
      },
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({ error: 'Error interno al registrar usuario' });
  }
}

// Iniciar sesión
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, nombre: user.nombre },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        limite_diario: parseFloat(user.limite_diario || 100),
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error interno al iniciar sesión' });
  }
}

// Perfil de usuario actual
async function getProfile(req, res) {
  try {
    const result = await db.query('SELECT id, nombre, email, limite_diario, created_at FROM usuarios WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const user = result.rows[0];
    return res.json({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      limite_diario: parseFloat(user.limite_diario || 100),
      created_at: user.created_at,
    });
  } catch (error) {
    console.error('Error en getProfile:', error);
    return res.status(500).json({ error: 'Error interno al obtener perfil' });
  }
}

// Actualizar límite diario
async function updateDailyLimit(req, res) {
  try {
    const { limite_diario } = req.body;
    if (limite_diario === undefined || isNaN(limite_diario) || parseFloat(limite_diario) <= 0) {
      return res.status(400).json({ error: 'Monto de límite diario inválido' });
    }

    const val = parseFloat(limite_diario);
    await db.query('UPDATE usuarios SET limite_diario = $1 WHERE id = $2', [val, req.user.id]);

    return res.json({
      message: 'Límite diario actualizado con éxito',
      limite_diario: val,
    });
  } catch (error) {
    console.error('Error en updateDailyLimit:', error);
    return res.status(500).json({ error: 'Error interno al actualizar límite' });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  updateDailyLimit,
};
