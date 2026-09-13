const db = require('../db');

// Listar categorías (globales + del usuario si está autenticado)
async function getCategorias(req, res) {
  try {
    const userId = req.user ? req.user.id : null;
    let queryText = 'SELECT * FROM categorias WHERE usuario_id IS NULL';
    let params = [];

    if (userId) {
      queryText = 'SELECT * FROM categorias WHERE usuario_id = $1 OR usuario_id IS NULL ORDER BY id ASC';
      params = [userId];
    } else {
      queryText = 'SELECT * FROM categorias ORDER BY id ASC';
    }

    const result = await db.query(queryText, params);
    return res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    return res.status(500).json({ error: 'Error al obtener categorías' });
  }
}

// Crear categoría
async function createCategoria(req, res) {
  try {
    const { nombre, color, icono } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre de la categoría es requerido' });
    }

    const result = await db.query(
      'INSERT INTO categorias (nombre, color, icono, usuario_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre.trim(), color || '#3B82F6', icono || 'Tag', userId]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creando categoría:', error);
    return res.status(500).json({ error: 'Error al crear la categoría' });
  }
}

// Editar categoría
async function updateCategoria(req, res) {
  try {
    const { id } = req.params;
    const { nombre, color, icono } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre de la categoría es requerido' });
    }

    const result = await db.query(
      'UPDATE categorias SET nombre = $1, color = COALESCE($2, color), icono = COALESCE($3, icono) WHERE id = $4 RETURNING *',
      [nombre.trim(), color || null, icono || null, parseInt(id, 10)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Error actualizando categoría:', error);
    return res.status(500).json({ error: 'Error al actualizar categoría' });
  }
}

// Eliminar categoría
async function deleteCategoria(req, res) {
  try {
    const { id } = req.params;
    const catId = parseInt(id, 10);

    // Desasociar gastos primero o permitir que queden como sin categoría
    await db.query('UPDATE gastos SET categoria_id = NULL WHERE categoria_id = $1', [catId]);

    const result = await db.query('DELETE FROM categorias WHERE id = $1 RETURNING id', [catId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    return res.json({ message: 'Categoría eliminada exitosamente', id: catId });
  } catch (error) {
    console.error('Error eliminando categoría:', error);
    return res.status(500).json({ error: 'Error al eliminar la categoría' });
  }
}

module.exports = {
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
};
