# 🚀 Guía de Despliegue en Vercel

Este proyecto está completamente configurado y optimizado para desplegarse en **Vercel** de dos formas:

1. **Despliegue Full-Stack Completo (Recomendado)**: Tanto el frontend (React + Vite) como el backend (Express API en funciones Serverless) se ejecutan bajo el mismo dominio en Vercel sin problemas de CORS.
2. **Frontend en Vercel + Backend en Render/Railway**: Si prefieres tener un contenedor de backend dedicado.

---

## Opción 1: Despliegue Full-Stack en Vercel (Recomendado)

### 1. Base de Datos PostgreSQL en la Nube (Gratis)
Como Vercel utiliza funciones serverless (sin disco local persistente), necesitas una base de datos PostgreSQL en la nube. Puedes crear una gratis en 2 minutos con cualquiera de estos proveedores:
- **[Neon.tech](https://neon.tech)** (Recomendado, muy rápido y sin tarjeta de crédito).
- **[Supabase](https://supabase.com)** (Excelente soporte y panel de control).
- **Vercel Postgres** (Directamente desde la pestaña *Storage* de tu proyecto en Vercel).
- **[Railway](https://railway.app)** o **[Render](https://render.com)**.

Copia la URL de conexión (`DATABASE_URL`), que tiene un formato similar a:
```
postgresql://usuario:contraseña@ep-xyz-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 2. Desplegar desde GitHub en Vercel Web Dashboard

1. Sube tu código a un repositorio en **GitHub**.
2. Ingresa a tu cuenta en [vercel.com](https://vercel.com) y pulsa en **"Add New..." -> "Project"**.
3. Selecciona tu repositorio `Control-Gastos`.
4. Deja la configuración por defecto:
   - **Framework Preset**: `Vite` o `Other` (detectado automáticamente).
   - **Root Directory**: `./` (la raíz del repositorio).
   - **Build Command**: `npm run build` (detectado automáticamente desde `vercel.json`).
   - **Output Directory**: `frontend/dist` (detectado automáticamente desde `vercel.json`).
5. En la sección **Environment Variables**, añade:
   - `DATABASE_URL`: Tu cadena de conexión a PostgreSQL.
   - `JWT_SECRET`: Una clave secreta para firmar tokens JWT (ejemplo: `mi_clave_super_segura_gastos_2026`).
6. Haz clic en **Deploy**.
7. ¡Listo! En menos de 1 minuto tendrás tu aplicación activa con HTTPS y un dominio `.vercel.app`.

> **Nota sobre las tablas**: Al conectarse por primera vez a tu base de datos PostgreSQL, la aplicación ejecutará automáticamente el esquema inicial (`schema.sql`) y las categorías por defecto (`seed.sql`).

---

### 3. Desplegar mediante Vercel CLI (Terminal)

Si prefieres la línea de comandos:

1. Instala Vercel CLI globalmente (si aún no lo tienes):
   ```bash
   npm install -g vercel
   ```
2. Inicia sesión en Vercel:
   ```bash
   vercel login
   ```
3. Ejecuta el comando de despliegue desde la raíz del proyecto:
   ```bash
   vercel
   ```
4. Para desplegar directamente a producción:
   ```bash
   vercel --prod
   ```
5. Configura las variables de entorno en Vercel Dashboard o con:
   ```bash
   vercel env add DATABASE_URL
   vercel env add JWT_SECRET
   ```

---

## Opción 2: Solo Frontend en Vercel (Backend en Render/Railway)

Si decides alojar el backend por separado en Render, Railway o VPS:

1. Despliega tu backend en Render/Railway con `DATABASE_URL` y `JWT_SECRET`.
2. En Vercel, al importar el proyecto:
   - Define **Root Directory**: `frontend`
3. Agrega la variable de entorno:
   - `VITE_API_BASE`: La URL de tu backend (ejemplo: `https://mi-backend.onrender.com`).
4. Despliega el proyecto.

---

## Estructura de Archivos para Vercel en este Proyecto

- `vercel.json`: Define el build del frontend (`frontend/dist`), los rewrites para SPA (`index.html`) y redirige las rutas de la API (`/api/*`, `/gastos*`, `/categorias*`, `/reportes*`, `/health`) hacia la función serverless.
- `api/index.js`: Punto de entrada serverless que ejecuta la aplicación Express y garantiza la conexión a PostgreSQL con reconexión memoizada.
- `frontend/src/services/api.js`: Utiliza `import.meta.env.VITE_API_BASE || ''` permitiendo rutas relativas automáticas en Vercel o URL absoluta externa.
- `backend/src/db/index.js`: Detecta automáticamente si PostgreSQL es remoto y activa SSL (`rejectUnauthorized: false`) para compatibilidad instantánea con Neon, Supabase y Vercel Postgres.
