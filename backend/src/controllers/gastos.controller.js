const db = require('../db');

// Convierte un Date a string ISO sin aplicar offset UTC
// Así las fechas se guardan y comparan siempre en hora local
function toLocalISOString(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.` +
    `${String(date.getMilliseconds()).padStart(3, '0')}`
  );
}

// Listar gastos con filtros opcionales (fecha_inicio, fecha_fin, categoria_id)
async function getGastos(req, res) {
  try {
    const { fecha_inicio, fecha_fin, categoria_id } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Acceso no autorizado: Usuario no identificado' });
    }

    let queryText = `
      SELECT 
        g.id, 
        g.monto, 
        g.descripcion, 
        g.fecha, 
        g.categoria_id, 
        g.usuario_id, 
        g.created_at,
        c.nombre AS categoria_nombre,
        c.color AS categoria_color,
        c.icono AS categoria_icono
      FROM gastos g
      LEFT JOIN categorias c ON g.categoria_id = c.id
      WHERE g.usuario_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    if (fecha_inicio) {
      queryText += ` AND g.fecha >= $${paramIndex}`;
      params.push(new Date(fecha_inicio).toISOString());
      paramIndex++;
    }

    if (fecha_fin) {
      queryText += ` AND g.fecha <= $${paramIndex}`;
      // Considerar fin del día si solo viene YYYY-MM-DD
      const endDate = new Date(fecha_fin);
      if (!fecha_fin.includes('T')) {
        endDate.setHours(23, 59, 59, 999);
      }
      params.push(endDate.toISOString());
      paramIndex++;
    }

    if (categoria_id) {
      queryText += ` AND g.categoria_id = $${paramIndex}`;
      params.push(parseInt(categoria_id, 10));
      paramIndex++;
    }

    queryText += ' ORDER BY g.fecha DESC';

    const result = await db.query(queryText, params);
    return res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener gastos:', error);
    return res.status(500).json({ error: 'Error al listar gastos' });
  }
}

// Registrar nuevo gasto (la fecha se llena automáticamente si no se envía)
async function createGasto(req, res) {
  try {
    const { monto, descripcion, categoria_id, fecha } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Debes iniciar sesión para registrar gastos' });
    }

    if (!monto || isNaN(monto) || parseFloat(monto) <= 0) {
      return res.status(400).json({ error: 'El monto es obligatorio y debe ser mayor que 0' });
    }

    // Fecha actual por defecto (en hora local, no UTC)
    const gastoFecha = fecha ? toLocalISOString(new Date(fecha)) : toLocalISOString(new Date());
    const catId = categoria_id ? parseInt(categoria_id, 10) : null;
    const parsedMonto = parseFloat(monto);

    const result = await db.query(
      `INSERT INTO gastos (monto, descripcion, fecha, categoria_id, usuario_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, monto, descripcion, fecha, categoria_id, usuario_id, created_at`,
      [parsedMonto, descripcion ? descripcion.trim() : '', gastoFecha, catId, userId]
    );

    const nuevoGasto = result.rows[0];

    // Obtener datos de la categoría para responder con nombre y color
    let categoriaInfo = null;
    if (catId) {
      const catRes = await db.query('SELECT nombre, color, icono FROM categorias WHERE id = $1', [catId]);
      if (catRes.rows.length > 0) {
        categoriaInfo = catRes.rows[0];
      }
    }

    // Verificar si el gasto del día actual supera el límite configurado del usuario
    let alertaLimite = null;
    let limiteDiario = 100.00;

    const userRes = await db.query('SELECT limite_diario FROM usuarios WHERE id = $1', [userId]);
    if (userRes.rows.length > 0 && userRes.rows[0].limite_diario) {
      limiteDiario = parseFloat(userRes.rows[0].limite_diario);
    }

    // Sumar gastos de hoy del usuario exclusivamente
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const sumTodayQuery = `
      SELECT COALESCE(SUM(monto), 0) as total_hoy
      FROM gastos
      WHERE fecha >= $1 AND fecha <= $2 AND usuario_id = $3
    `;
    const sumParams = [toLocalISOString(todayStart), toLocalISOString(todayEnd), userId];

    const sumRes = await db.query(sumTodayQuery, sumParams);
    const totalHoy = parseFloat(sumRes.rows[0]?.total_hoy || 0);

    alertaLimite = {
      superado: totalHoy > limiteDiario,
      limite_diario: limiteDiario,
      total_gastado_hoy: totalHoy,
      diferencia: totalHoy - limiteDiario,
    };

    return res.status(201).json({
      gasto: {
        ...nuevoGasto,
        categoria_nombre: categoriaInfo ? categoriaInfo.nombre : 'Sin categoría',
        categoria_color: categoriaInfo ? categoriaInfo.color : '#9CA3AF',
        categoria_icono: categoriaInfo ? categoriaInfo.icono : 'Tag',
      },
      alerta_limite: alertaLimite,
    });
  } catch (error) {
    console.error('Error registrando gasto:', error);
    return res.status(500).json({ error: 'Error al registrar el gasto' });
  }
}

// Eliminar un gasto
async function deleteGasto(req, res) {
  try {
    const { id } = req.params;
    const gastoId = parseInt(id, 10);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Debes iniciar sesión para eliminar gastos' });
    }

    const queryText = 'DELETE FROM gastos WHERE id = $1 AND usuario_id = $2';
    const params = [gastoId, userId];

    const result = await db.query(queryText, params);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Gasto no encontrado o no pertenece a tu usuario' });
    }

    return res.json({ message: 'Gasto eliminado exitosamente', id: gastoId });
  } catch (error) {
    console.error('Error eliminando gasto:', error);
    return res.status(500).json({ error: 'Error al eliminar gasto' });
  }
}

module.exports = {
  getGastos,
  createGasto,
  deleteGasto,
};
