# Control de Gastos Personales 

Aplicación web full-stack completa para la gestión, registro, categorización y analítica visual de gastos personales con alertas de presupuesto diario y exportación a PDF y Excel.

---

## Características Principales

### 1. Frontend (React + Vite + TailwindCSS)
- **Registro Rápido de Gastos**: Formulario intuitivo con validación de montos, descripción, selector de categoría y fecha automática prellenada (`YYYY-MM-DD`).
- **Gestión de Categorías**: CRUD interactivo para crear, personalizar con paleta de colores, editar y eliminar categorías.
- **Reportes Analíticos con Chart.js**:
  - Filtros dinámicos de períodos: **Diario**, **Semanal**, **Mensual** y **Anual**.
  - Tarjetas de resumen (KPI): Total Gastado, Cantidad de Transacciones, Promedio por Gasto, Gasto Máximo.
  - Gráfica de **Barras** para la evolución temporal de los gastos.
  - Gráfica de **Dona** (Doughnut) para el desglose porcentual y distribución por categoría.
  - Tabla detallada con porcentajes y barras de progreso.
- **Exportación en 1 Clic**:
  - **PDF** con membrete institucional, tablas estilizadas y métricas clave (`jspdf` + `jspdf-autotable`).
  - **Excel** estructurado en múltiples hojas (`xlsx`).
- **Alerta de Límite Diario**:
  - Límite configurable por el usuario.
  - Notificaciones en tiempo real y banner de alerta si el gasto del día supera o se aproxima al límite establecido.

### 2. Backend (Node.js + Express + JWT)
- **API REST Modular**:
  - `POST /gastos`: Registrar gasto (fecha automática si no se especifica).
  - `GET /gastos`: Listar gastos con filtros por rango de fechas y categoría.
  - `DELETE /gastos/:id`: Eliminar gasto.
  - `GET /categorias`: Listar categorías.
  - `POST /categorias`: Crear categoría.
  - `PUT /categorias/:id`: Editar categoría.
  - `DELETE /categorias/:id`: Eliminar categoría.
  - `GET /reportes?tipo=diario|semanal|mensual|anual`: Consultas agregadas con totales y desglose.
  - `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`: Autenticación con JWT y contraseñas cifradas con `bcryptjs`.
  - `PUT /api/auth/limite-diario`: Ajuste del presupuesto máximo diario del usuario.

### 3. Base de Datos (PostgreSQL)
- Esquema relacional con tablas `usuarios`, `categorias` y `gastos`.
- Índices para acelerar búsquedas por fecha y usuario.
- Modo dual/resiliente: inicialización automática en PostgreSQL y almacenamiento fallback integrado para arranque inmediato sin configuraciones previas complejas.

---

## Estructura del Proyecto

```
Control-Gastos/
├── docker-compose.yml         # Contenedor PostgreSQL preconfigurado
├── package.json               # Scripts de ejecución raíz
├── README.md                  # Documentación
├── backend/                   # Servidor API Express
│   ├── src/
│   │   ├── controllers/       # Controladores (auth, gastos, categorias, reportes)
│   │   ├── db/                # Conexión PG, schema.sql, seed.sql
│   │   ├── middleware/        # Middleware de autenticación JWT
│   │   ├── routes/            # Definición de rutas REST
│   │   └── server.js          # Entrada del servidor Express
│   ├── .env.example           # Plantilla de variables de entorno
│   └── package.json           # Dependencias del backend
└── frontend/                  # Aplicación SPA React
    ├── src/
    │   ├── components/        # Navbar, GastosView, CategoriasView, ReportesView, Modales
    │   ├── context/           # AuthContext (JWT, presupuesto, alertas)
    │   ├── services/          # Cliente API fetch
    │   ├── App.jsx            # Componente principal
    │   └── main.jsx           # Entrada de React
    ├── index.html             # HTML base
    ├── tailwind.config.js     # Configuración de Tailwind CSS
    └── package.json           # Dependencias del frontend
```

---

## Guía de Instalación y Uso

### Requisitos Previos
- **Node.js**: v18 o superior.
- **PostgreSQL** (opcional, si deseas base de datos nativa en lugar del modo integrado de desarrollo) o **Docker**.

---

### Paso 1: Configurar e Iniciar el Backend

1. Abre una terminal y navega al directorio del backend:
   ```bash
   cd backend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Crea tu archivo de variables de entorno copiando `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. *(Opcional)* Si tienes PostgreSQL local o Docker:
   - Para levantar PostgreSQL con Docker:
     ```bash
     docker compose up -d
     ```
   - O ajusta las credenciales en `backend/.env`:
     ```env
     DB_HOST=localhost
     DB_PORT=5432
     DB_USER=postgres
     DB_PASSWORD=tu_password
     DB_NAME=control_gastos
     ```

5. Inicia el servidor backend:
   ```bash
   npm start
   ```
   El servidor iniciará en: **`http://localhost:5000`**

---

### Paso 2: Configurar e Iniciar el Frontend

1. Abre otra terminal y navega a `frontend`:
   ```bash
   cd frontend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```

4. Abre tu navegador en:
   **`http://localhost:3000`**

---

## Consultas SQL de Reportes

Las agregaciones analíticas implementadas en el backend ejecutan consultas sobre la base de datos:

### Desglose por Categoría
```sql
SELECT 
  COALESCE(c.nombre, 'Sin categoría') AS categoria_nombre,
  COALESCE(c.color, '#6B7280') AS color,
  COUNT(g.id) AS cantidad,
  SUM(g.monto) AS total
FROM gastos g
LEFT JOIN categorias c ON g.categoria_id = c.id
WHERE g.fecha >= $1 AND g.fecha <= $2
GROUP BY c.nombre, c.color
ORDER BY total DESC;
```

### Agrupación Temporal
```sql
SELECT 
  DATE_TRUNC('day', fecha) AS dia,
  SUM(monto) AS total_dia
FROM gastos
WHERE fecha >= $1 AND fecha <= $2
GROUP BY dia
ORDER BY dia ASC;
```

---

## Credenciales Demo
Para probar la autenticación rápidamente:
- **Email:** `demo@gastos.com`
- **Contraseña:** `demo1234`
*(También puedes usar el botón de acceso rápido de 1 clic en la ventana de login).*
