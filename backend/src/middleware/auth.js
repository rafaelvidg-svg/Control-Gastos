const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'control_gastos_jwt_secret_key_2025';

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Acceso no autorizado: Token ausente' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Formato de token no válido. Use: Bearer <token>' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}

// Middleware opcional para rutas que pueden funcionar con o sin usuario autenticado
function optionalToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      try {
        const decoded = jwt.verify(parts[1], JWT_SECRET);
        req.user = decoded;
      } catch (e) {
        // Ignorar si el token es inválido en modo opcional
      }
    }
  }
  next();
}

module.exports = {
  verifyToken,
  optionalToken,
  JWT_SECRET,
};
