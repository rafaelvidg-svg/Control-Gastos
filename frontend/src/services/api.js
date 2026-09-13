// Capa de comunicación con la API REST del backend

const API_BASE = ''; // Usa el proxy de Vite o rutas relativas

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Autenticación
  async login(email, password) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');
    return data;
  },

  async register(nombre, email, password, limite_diario) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password, limite_diario }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al registrar usuario');
    return data;
  },

  async getProfile() {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Error al obtener perfil');
    return res.json();
  },

  async updateDailyLimit(limite_diario) {
    const res = await fetch(`${API_BASE}/api/auth/limite-diario`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ limite_diario }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al actualizar límite');
    return data;
  },

  // Gastos
  async getGastos(params = {}) {
    const query = new URLSearchParams();
    if (params.fecha_inicio) query.append('fecha_inicio', params.fecha_inicio);
    if (params.fecha_fin) query.append('fecha_fin', params.fecha_fin);
    if (params.categoria_id) query.append('categoria_id', params.categoria_id);

    const url = `${API_BASE}/gastos${query.toString() ? '?' + query.toString() : ''}`;
    const res = await fetch(url, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Error al consultar gastos');
    return res.json();
  },

  async createGasto(gastoData) {
    const res = await fetch(`${API_BASE}/gastos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(gastoData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al registrar gasto');
    return data;
  },

  async deleteGasto(id) {
    const res = await fetch(`${API_BASE}/gastos/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al eliminar gasto');
    return data;
  },

  // Categorías
  async getCategorias() {
    const res = await fetch(`${API_BASE}/categorias`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Error al consultar categorías');
    return res.json();
  },

  async createCategoria(catData) {
    const res = await fetch(`${API_BASE}/categorias`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(catData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al crear categoría');
    return data;
  },

  async updateCategoria(id, catData) {
    const res = await fetch(`${API_BASE}/categorias/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(catData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al actualizar categoría');
    return data;
  },

  async deleteCategoria(id) {
    const res = await fetch(`${API_BASE}/categorias/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al eliminar categoría');
    return data;
  },

  // Reportes
  async getReportes(tipo = 'mensual') {
    const res = await fetch(`${API_BASE}/reportes?tipo=${tipo}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Error al generar reportes');
    return res.json();
  },
};
