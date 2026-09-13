const db = require('../db');

// Función auxiliar para calcular rangos de fechas según tipo
function getDateRange(tipo) {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (tipo) {
    case 'diario':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      break;
    case 'semanal':
      // Inicio de la semana actual (Lunes)
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
      break;
    case 'mensual':
      // Inicio del mes actual
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
    case 'anual':
      // Inicio del año actual
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      break;
    default:
      // Por defecto mensual
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
  }

  return { startDate, endDate };
}

async function getReportes(req, res) {
  try {
    const tipo = (req.query.tipo || 'mensual').toLowerCase();
    const userId = req.user ? req.user.id : null;
    const { startDate, endDate } = getDateRange(tipo);

    // 1. Obtener todos los gastos del período
    const gastosRes = await db.query(
      `SELECT 
         g.id, 
         g.monto, 
         g.descripcion, 
         g.fecha, 
         g.categoria_id,
         COALESCE(c.nombre, 'Sin categoría') AS categoria_nombre,
         COALESCE(c.color, '#6B7280') AS categoria_color
       FROM gastos g
       LEFT JOIN categorias c ON g.categoria_id = c.id
       WHERE g.fecha >= $1 AND g.fecha <= $2
       ${userId ? 'AND (g.usuario_id = $3 OR g.usuario_id IS NULL)' : ''}
       ORDER BY g.fecha ASC`,
      userId ? [startDate.toISOString(), endDate.toISOString(), userId] : [startDate.toISOString(), endDate.toISOString()]
    );

    const gastos = gastosRes.rows.map(g => ({
      ...g,
      monto: parseFloat(g.monto),
      fecha: new Date(g.fecha),
    }));

    // 2. Cálculos generales
    const total_general = gastos.reduce((acc, curr) => acc + curr.monto, 0);
    const total_registros = gastos.length;
    const promedio_por_gasto = total_registros > 0 ? total_general / total_registros : 0;
    const gasto_maximo = total_registros > 0 ? Math.max(...gastos.map(g => g.monto)) : 0;

    // 3. Desglose por Categoría
    const categoriasMap = {};
    gastos.forEach(g => {
      const catKey = g.categoria_nombre;
      if (!categoriasMap[catKey]) {
        categoriasMap[catKey] = {
          categoria_id: g.categoria_id,
          nombre: catKey,
          color: g.categoria_color,
          total: 0,
          cantidad: 0,
        };
      }
      categoriasMap[catKey].total += g.monto;
      categoriasMap[catKey].cantidad += 1;
    });

    const desglose_categorias = Object.values(categoriasMap)
      .map(c => ({
        ...c,
        porcentaje: total_general > 0 ? ((c.total / total_general) * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // 4. Datos para gráfico de evolución temporal (Línea de tiempo)
    let timelineLabels = [];
    let timelineValues = [];

    if (tipo === 'diario') {
      // Agrupar en intervalos de horas principales
      const hours = [0, 4, 8, 12, 16, 20, 24];
      timelineLabels = ['00:00 - 04:00', '04:00 - 08:00', '08:00 - 12:00', '12:00 - 16:00', '16:00 - 20:00', '20:00 - 24:00'];
      const buckets = [0, 0, 0, 0, 0, 0];
      gastos.forEach(g => {
        const h = g.fecha.getHours();
        const bIndex = Math.min(Math.floor(h / 4), 5);
        buckets[bIndex] += g.monto;
      });
      timelineValues = buckets;
    } else if (tipo === 'semanal') {
      const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      timelineLabels = days;
      const buckets = [0, 0, 0, 0, 0, 0, 0];
      gastos.forEach(g => {
        // En JS: 0=Domingo, 1=Lunes ... 6=Sábado
        const day = g.fecha.getDay();
        const adjustedIdx = day === 0 ? 6 : day - 1;
        buckets[adjustedIdx] += g.monto;
      });
      timelineValues = buckets;
    } else if (tipo === 'mensual') {
      // Días del mes actual
      const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
      timelineLabels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
      const buckets = new Array(daysInMonth).fill(0);
      gastos.forEach(g => {
        const day = g.fecha.getDate();
        if (day >= 1 && day <= daysInMonth) {
          buckets[day - 1] += g.monto;
        }
      });
      timelineValues = buckets;
    } else if (tipo === 'anual') {
      timelineLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const buckets = new Array(12).fill(0);
      gastos.forEach(g => {
        const month = g.fecha.getMonth();
        buckets[month] += g.monto;
      });
      timelineValues = buckets;
    }

    // 5. Verificación de límite diario del usuario
    let limiteDiario = 100.00;
    if (userId) {
      const userRes = await db.query('SELECT limite_diario FROM usuarios WHERE id = $1', [userId]);
      if (userRes.rows.length > 0 && userRes.rows[0].limite_diario) {
        limiteDiario = parseFloat(userRes.rows[0].limite_diario);
      }
    }

    return res.json({
      periodo: {
        tipo,
        fecha_inicio: startDate.toISOString(),
        fecha_fin: endDate.toISOString(),
      },
      resumen: {
        total_general: parseFloat(total_general.toFixed(2)),
        total_registros,
        promedio_por_gasto: parseFloat(promedio_por_gasto.toFixed(2)),
        gasto_maximo: parseFloat(gasto_maximo.toFixed(2)),
        limite_diario: limiteDiario,
      },
      desglose_categorias,
      timeline: {
        labels: timelineLabels,
        data: timelineValues.map(v => parseFloat(v.toFixed(2))),
      },
      gastos_detalle: gastos,
    });
  } catch (error) {
    console.error('Error calculando reportes:', error);
    return res.status(500).json({ error: 'Error interno al generar el reporte' });
  }
}

module.exports = {
  getReportes,
};
