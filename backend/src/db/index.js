const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

// Configuración de PostgreSQL
const isRemotePg = Boolean(
  process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes('localhost') &&
  !process.env.DATABASE_URL.includes('127.0.0.1')
);

const pgConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: isRemotePg ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'control_gastos',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };

let pool = null;
let isPgConnected = false;

// Almacenamiento local de respaldo (fallback) persistente en archivo JSON
const LOCAL_DB_PATH = path.join(__dirname, 'local_db.json');

function loadLocalData() {
  if (fs.existsSync(LOCAL_DB_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf8'));
    } catch (e) {
      console.error('Error leyendo base local:', e);
    }
  }

  // Estructura por defecto con datos semilla
  const defaultData = {
    usuarios: [
      {
        id: 1,
        nombre: 'Usuario Demo',
        email: 'demo@gastos.com',
        // Hash de 'demo1234'
        password_hash: '$2a$10$KeS3KjhEaPsG4Z6Lj3xo7OrWUBxYSXNaabcKZWoJ8xUj2bACLef4e',
        limite_diario: 150.00,
        created_at: new Date().toISOString(),
      },
    ],
    categorias: [
      { id: 1, nombre: 'Alimentación', color: '#10B981', icono: 'Utensils', usuario_id: null, created_at: new Date().toISOString() },
      { id: 2, nombre: 'Transporte', color: '#3B82F6', icono: 'Car', usuario_id: null, created_at: new Date().toISOString() },
      { id: 3, nombre: 'Vivienda', color: '#8B5CF6', icono: 'Home', usuario_id: null, created_at: new Date().toISOString() },
      { id: 4, nombre: 'Entretenimiento', color: '#EC4899', icono: 'Film', usuario_id: null, created_at: new Date().toISOString() },
      { id: 5, nombre: 'Salud', color: '#EF4444', icono: 'Activity', usuario_id: null, created_at: new Date().toISOString() },
      { id: 6, nombre: 'Servicios', color: '#F59E0B', icono: 'Zap', usuario_id: null, created_at: new Date().toISOString() },
      { id: 7, nombre: 'Educación', color: '#06B6D4', icono: 'BookOpen', usuario_id: null, created_at: new Date().toISOString() },
      { id: 8, nombre: 'Otros', color: '#6B7280', icono: 'MoreHorizontal', usuario_id: null, created_at: new Date().toISOString() },
    ],
    gastos: [
      { id: 1, monto: 45.50, descripcion: 'Supermercado semanal', fecha: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), categoria_id: 1, usuario_id: 1, created_at: new Date().toISOString() },
      { id: 2, monto: 12.00, descripcion: 'Transporte público / Combustible', fecha: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), categoria_id: 2, usuario_id: 1, created_at: new Date().toISOString() },
      { id: 3, monto: 35.00, descripcion: 'Cena con amigos', fecha: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), categoria_id: 4, usuario_id: 1, created_at: new Date().toISOString() },
      { id: 4, monto: 80.00, descripcion: 'Factura de luz e internet', fecha: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), categoria_id: 6, usuario_id: 1, created_at: new Date().toISOString() },
      { id: 5, monto: 25.00, descripcion: 'Farmacia y vitaminas', fecha: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(), categoria_id: 5, usuario_id: 1, created_at: new Date().toISOString() },
    ],
    nextUserId: 2,
    nextCatId: 9,
    nextGastoId: 6,
  };

  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(defaultData, null, 2));
  } catch (e) {
    // Ignorar si el sistema de archivos es de solo lectura (como en Vercel Serverless)
  }
  return defaultData;
}

let localData = loadLocalData();

function saveLocalData() {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(localData, null, 2));
  } catch (e) {
    // Ignorar si el sistema de archivos es de solo lectura (como en Vercel Serverless)
  }
}

// Inicialización memoizada y segura para Serverless y Local
let initPromise = null;

async function initDb() {
  if (isPgConnected && pool) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      pool = new Pool(pgConfig);
      const client = await pool.connect();
      console.log(' Conectado exitosamente a PostgreSQL');
      isPgConnected = true;

      // Ejecutar esquemas
      const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      await client.query(schemaSql);

      // Ejecutar semillas si no hay categorías
      const checkCats = await client.query('SELECT COUNT(*) FROM categorias');
      if (parseInt(checkCats.rows[0].count, 10) === 0) {
        const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
        await client.query(seedSql);
        console.log(' Tablas inicializadas y datos semilla cargados en PostgreSQL');
      }

      client.release();
      return true;
    } catch (err) {
      console.warn(' No se pudo conectar a PostgreSQL (' + err.message + ').');
      console.info(' Modo Resiliente Activado: Usando almacenamiento local/memoria.');
      isPgConnected = false;
      return false;
    }
  })();

  return initPromise;
}

// Wrapper unificado de query para Express
async function query(text, params = []) {
  if (isPgConnected && pool) {
    return pool.query(text, params);
  }

  // Fallback transparente para operaciones estándar en caso de no tener PG activo
  return executeLocalFallback(text, params);
}

function executeLocalFallback(text, params) {
  const cleanSql = text.trim().toUpperCase();

  // 1. SELECT categorias
  if (cleanSql.startsWith('SELECT') && cleanSql.includes('FROM CATEGORIAS')) {
    let rows = [...localData.categorias];
    if (params.length === 1 && typeof params[0] === 'number') {
      rows = rows.filter((c) => c.usuario_id === params[0] || c.usuario_id === null);
    }
    return { rows };
  }

  // 2. INSERT INTO categorias
  if (cleanSql.startsWith('INSERT INTO CATEGORIAS')) {
    const [nombre, color, icono, usuario_id] = params;
    const newCat = {
      id: localData.nextCatId++,
      nombre,
      color: color || '#3B82F6',
      icono: icono || 'Tag',
      usuario_id: usuario_id || null,
      created_at: new Date().toISOString(),
    };
    localData.categorias.push(newCat);
    saveLocalData();
    return { rows: [newCat], rowCount: 1 };
  }

  // 3. UPDATE categorias
  if (cleanSql.startsWith('UPDATE CATEGORIAS')) {
    const id = params[params.length - 1];
    const catIndex = localData.categorias.findIndex((c) => c.id === parseInt(id, 10));
    if (catIndex !== -1) {
      if (params.length >= 3) {
        localData.categorias[catIndex].nombre = params[0];
        localData.categorias[catIndex].color = params[1] || localData.categorias[catIndex].color;
      }
      saveLocalData();
      return { rows: [localData.categorias[catIndex]], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 4. DELETE FROM categorias
  if (cleanSql.startsWith('DELETE FROM CATEGORIAS')) {
    const id = parseInt(params[0], 10);
    localData.categorias = localData.categorias.filter((c) => c.id !== id);
    // De-link gastos
    localData.gastos.forEach((g) => {
      if (g.categoria_id === id) g.categoria_id = null;
    });
    saveLocalData();
    return { rowCount: 1, rows: [] };
  }

  // 5. INSERT INTO gastos
  if (cleanSql.startsWith('INSERT INTO GASTOS')) {
    const [monto, descripcion, fecha, categoria_id, usuario_id] = params;
    const newGasto = {
      id: localData.nextGastoId++,
      monto: parseFloat(monto),
      descripcion,
      fecha: fecha ? new Date(fecha).toISOString() : new Date().toISOString(),
      categoria_id: categoria_id ? parseInt(categoria_id, 10) : null,
      usuario_id: usuario_id ? parseInt(usuario_id, 10) : null,
      created_at: new Date().toISOString(),
    };
    localData.gastos.unshift(newGasto);
    saveLocalData();
    return { rows: [newGasto], rowCount: 1 };
  }

  // 5.1 SELECT SUM(monto) as total_hoy
  if (cleanSql.includes('TOTAL_HOY') || (cleanSql.includes('SUM(') && cleanSql.includes('FROM GASTOS'))) {
    const startDate = params[0] ? new Date(params[0]) : null;
    const endDate = params[1] ? new Date(params[1]) : null;
    const uId = params[2] !== undefined ? parseInt(params[2], 10) : null;

    let filtered = localData.gastos;
    if (uId !== null && !isNaN(uId)) {
      filtered = filtered.filter((g) => g.usuario_id === uId);
    }
    if (startDate && endDate) {
      filtered = filtered.filter((g) => {
        const d = new Date(g.fecha);
        return d >= startDate && d <= endDate;
      });
    }
    const totalHoy = filtered.reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0);
    return { rows: [{ total_hoy: totalHoy }] };
  }

  // 6. SELECT gastos
  if (cleanSql.startsWith('SELECT') && cleanSql.includes('FROM GASTOS')) {
    let rows = localData.gastos.map((g) => {
      const cat = localData.categorias.find((c) => c.id === g.categoria_id);
      return {
        ...g,
        categoria_nombre: cat ? cat.nombre : 'Sin categoría',
        categoria_color: cat ? cat.color : '#9CA3AF',
        categoria_icono: cat ? cat.icono : 'Tag',
      };
    });

    // Reportes query: WHERE g.fecha >= $1 AND g.fecha <= $2 AND g.usuario_id = $3
    if (cleanSql.includes('FECHA >=') && cleanSql.includes('FECHA <=') && params.length >= 3) {
      const startDate = new Date(params[0]);
      const endDate = new Date(params[1]);
      const uId = parseInt(params[2], 10);
      rows = rows.filter((g) => {
        const d = new Date(g.fecha);
        return g.usuario_id === uId && d >= startDate && d <= endDate;
      });
      rows.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      return { rows };
    }

    // Standard getGastos query: WHERE g.usuario_id = $1 ...
    if (cleanSql.includes('USUARIO_ID = $1') || (params.length > 0 && typeof params[0] === 'number')) {
      const uId = parseInt(params[0], 10);
      rows = rows.filter((g) => g.usuario_id === uId);

      let nextIdx = 1;
      if (cleanSql.includes('FECHA >= $')) {
        const fromDate = new Date(params[nextIdx]);
        rows = rows.filter((g) => new Date(g.fecha) >= fromDate);
        nextIdx++;
      }
      if (cleanSql.includes('FECHA <= $')) {
        const toDate = new Date(params[nextIdx]);
        rows = rows.filter((g) => new Date(g.fecha) <= toDate);
        nextIdx++;
      }
      if (cleanSql.includes('CATEGORIA_ID = $')) {
        const catId = parseInt(params[nextIdx], 10);
        rows = rows.filter((g) => g.categoria_id === catId);
        nextIdx++;
      }
    } else if (cleanSql.includes('USUARIO_ID =')) {
      const uId = params.find((p) => typeof p === 'number');
      if (uId !== undefined) {
        rows = rows.filter((g) => g.usuario_id === uId);
      }
    }

    rows.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    return { rows };
  }

  // 7. DELETE FROM gastos
  if (cleanSql.startsWith('DELETE FROM GASTOS')) {
    const id = parseInt(params[0], 10);
    const userId = params[1] !== undefined ? parseInt(params[1], 10) : null;
    const initialLen = localData.gastos.length;

    localData.gastos = localData.gastos.filter((g) => {
      if (userId !== null && !isNaN(userId)) {
        return !(g.id === id && g.usuario_id === userId);
      }
      return g.id !== id;
    });

    const deletedCount = initialLen - localData.gastos.length;
    saveLocalData();
    return { rowCount: deletedCount, rows: [] };
  }

  // 8. Auth / Usuarios
  if (cleanSql.includes('FROM USUARIOS WHERE EMAIL')) {
    const email = params[0];
    const user = localData.usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return { rows: user ? [user] : [] };
  }

  if (cleanSql.includes('FROM USUARIOS WHERE ID')) {
    const id = parseInt(params[0], 10);
    const user = localData.usuarios.find((u) => u.id === id);
    return { rows: user ? [user] : [] };
  }

  if (cleanSql.startsWith('INSERT INTO USUARIOS')) {
    const [nombre, email, password_hash, limite_diario] = params;
    const newUser = {
      id: localData.nextUserId++,
      nombre,
      email,
      password_hash,
      limite_diario: limite_diario ? parseFloat(limite_diario) : 100.00,
      created_at: new Date().toISOString(),
    };
    localData.usuarios.push(newUser);
    saveLocalData();
    return { rows: [newUser], rowCount: 1 };
  }

  if (cleanSql.startsWith('UPDATE USUARIOS')) {
    const [limite_diario, id] = params;
    const user = localData.usuarios.find((u) => u.id === parseInt(id, 10));
    if (user) {
      user.limite_diario = parseFloat(limite_diario);
      saveLocalData();
      return { rows: [user], rowCount: 1 };
    }
  }

  return { rows: [], rowCount: 0 };
}

module.exports = {
  query,
  initDb,
  isPgConnected: () => isPgConnected,
  getPool: () => pool,
};
