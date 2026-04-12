# SARA Frontend (React + Vite)

Interfaz web para trabajar con el backend `TFGDAM-main` (Spring Boot).

## Requisitos

- Node.js 18+
- npm 9+
- Backend levantado en `http://localhost:8080`

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
```

Por defecto, `npm run dev` publica en `http://localhost:5173` (Vite auto-incrementa a 5174, 5175, etc. si el puerto esta ocupado).

### Escritorio (Electron)

```bash
npm run electron:dev      # arranca electron en modo dev (usa vite dev server)
npm run electron:preview  # build + electron
npm run electron:build    # build + electron-builder (genera instalable)
```

Variables de entorno para Electron dev:

- `VITE_DEV_URL` (default `http://localhost:5173`): URL del vite dev server que Electron carga.
- `SARA_BACKEND_URL` (default `http://localhost:8080`): backend Spring Boot al que el proceso principal expone via IPC.
- `ELECTRON_BUILD=true` en el build de Vite para que use `base: './'` (rutas relativas, necesario para `file://`).

## Configuracion API

La app usa `VITE_API_BASE_URL` y por defecto apunta a `/api`.

- En desarrollo, `vite.config.js` proxifica `/api/*` hacia `http://localhost:8080/*`.
- Si despliegas sin proxy, define `VITE_API_BASE_URL` (por ejemplo `http://localhost:8080`) y habilita CORS en backend si aplica.

Ejemplo `.env`:

```bash
VITE_API_BASE_URL=/api
```

Registro opcional (solo si el backend expone ese endpoint):

```bash
VITE_AUTH_REGISTER_PATH=/auth/register
```

Login con Google (opcional):

```bash
VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
```

## Flujo actual

1. Login con JWT (`/auth/login`) y logout local (limpieza de token en frontend).
   - Si no hay sesion, solo se muestra la vista de login.
   - Si hay sesion, se oculta login y se muestra el resto de la app.
   - Boton "Crear cuenta" opcional si existe `VITE_AUTH_REGISTER_PATH`.
2. Gestion de modulos:
   - cargar lista de modulos accesibles (`GET /modules`)
   - seleccionar modulo activo desde selector
   - eliminar modulo (`DELETE /modules/{id}`)
3. Importacion:
   - PDF de RAs (`POST /imports/ra`) + consulta de job (`GET /imports/ra/{jobId}`) + guardado de RAs (`POST /modules/{id}/ras/import`)
   - XLSX de plantilla oficial (`POST /imports/excel-file`), con reemplazo de modulo si `moduleId` existe
4. Vista previa por modulo:
   - selector de modulo desde lista cargada (`GET /modules`)
   - estructura base (`GET /modules/{id}/preview`)
   - evaluaciones (`GET /modules/{id}/reports/evaluation/{n}`)
   - final (`GET /modules/{id}/reports/final`)
   - edicion de ejercicios por alumno/instrumento + guardado (`POST /grades`)
   - descarga Excel del modulo (`GET /modules/{id}/export/excel`)
   - selector de plantilla: base vacia, rellenada 1, rellenada 2
   - descarga plantilla base (`GET /modules/export/template/base`)
   - descarga plantilla rellenada (`GET /modules/export/template/filled?variant=1|2`)

## Endpoints consumidos

- `POST /auth/login`
- `POST /auth/google` (opcional, requiere `VITE_GOOGLE_CLIENT_ID` y backend configurado)
- `POST ${VITE_AUTH_REGISTER_PATH}` (opcional, solo si se configura)
- `GET /modules`
- `DELETE /modules/{id}`
- `POST /imports/ra`
- `GET /imports/ra/{jobId}`
- `POST /modules/{moduleId}/ras/import`
- `POST /imports/excel-file`
- `GET /modules/{id}/preview`
- `GET /modules/{id}/reports/evaluation/{n}`
- `GET /modules/{id}/reports/final`
- `POST /grades`
- `GET /modules/{id}/export/excel`
- `GET /modules/export/template/base`
- `GET /modules/export/template/filled?variant=1|2`

## Estructura relevante

- `src/App.jsx`: routing con React Router (`/login`, `/dashboard`, `/gradebook`, `/course-config`, `/activities`) y `ProtectedRoute`.
- `src/main.jsx`: entrypoint; llama `initApiBaseUrl()` antes de renderizar (resuelve URL backend via IPC en Electron).
- `src/layouts/MainLayout.jsx`: layout compartido (navegacion lateral + outlet).
- `src/pages/Login.jsx`: login con JWT.
- `src/pages/Dashboard.jsx`, `pages/Gradebook.jsx`, `pages/CourseConfig.jsx`, `pages/Activities.jsx`: vistas principales.
- `src/lib/api.js`: wrapper de `fetch`, token, manejo de errores y deteccion Electron (IPC).
- `electron/main.cjs`: proceso principal de Electron (abre ventana, expone backend URL y dialog nativo).
- `electron/preload.cjs`: bridge seguro (`contextBridge`) entre renderer y proceso principal.

## Notas

- En importacion PDF, el `moduleId` es obligatorio.
- En importacion XLSX, `moduleId` es opcional: si existe se reemplaza ese modulo; si no, se crea uno nuevo.
- Tras importar XLSX, el frontend selecciona automaticamente el `moduleId` devuelto por backend.
- El selector de modulos se carga desde `GET /modules` y depende del usuario autenticado.
- La UI ordena codigos de forma natural (`RA2` antes que `RA10`) en las tablas de preview.

