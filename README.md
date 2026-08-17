# 👋 Bienvenido a EasyCount

**EasyCount** es una aplicación móvil para automatizar el conteo de dinero físico y la gestión de caja. Con ella puedes contar billetes y monedas, calcular el total automáticamente, guardar cada arqueo y consultar el historial de cierres.

Está compuesta por dos partes:

- **App móvil** (React Native + Expo) — la interfaz que usas desde el teléfono.
- **Backend propio** (Node.js + Express + SQLite + JWT) — una API REST que almacena los datos.

```
┌──────────────────┐         HTTP (JSON)          ┌──────────────────────┐
│   App móvil      │  ─────────────────────────>  │  Backend (Express)   │
│  Expo Go / RN    │      Authorization: Bearer   │  SQLite + JWT        │
└──────────────────┘  <─────────────────────────  └──────────────────────┘
```

> La app **no** usa una base de datos local: todo lo consume desde la API.

---

## 📋 Requisitos

| Herramienta          | Versión mínima      | Probado con   |
| -------------------- | ------------------- | ------------- |
| Node.js              | 20.x                | v24.17.0      |
| npm                  | 10.x                | 11.13.0       |
| Git                  | cualquiera reciente | —             |
| Expo Go (en el móvil)| SDK 54              | —             |

No se requiere instalar una base de datos aparte: el backend usa **SQLite** (archivo local que se crea solo).

---

## 🚀 Configuración del entorno (paso a paso)

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd EasyCount
```

### 2. Levantar el backend (API)

Abre una terminal y ejecuta:

```bash
cd backend
npm install
cp .env.example .env   # opcional: define PORT, JWT_SECRET y JWT_EXPIRES_IN
npm start              # o npm run dev (reinicio automático)
```

Debes ver algo como:

```
EasyCount API escuchando en http://0.0.0.0:4000
Health check: http://localhost:4000/api/health
```

**Verifica que funciona:**

```bash
curl http://localhost:4000/api/health
# Respuesta esperada: {"status":"ok","service":"easycount-api","timestamp":"..."}
```

> La base de datos (`backend/easycount.db`) se crea sola en la primera ejecución y se siembra con las denominaciones de Ecuador.

### 3. Levantar la app móvil

En **otra terminal** (deja el backend corriendo), desde la raíz del proyecto:

```bash
npm install
npx expo start
```

Escanea el **código QR** con la app **Expo Go** en tu celular.

---

## 📱 Conectar el celular al backend

La app detecta automáticamente la IP de tu PC en la red local (a través de `Constants.expoConfig.hostUri`) y apunta a `http://<IP-DE-TU-PC>:4000/api`.

Para que esto funcione, asegúrate de que:

1. **El celular y la PC estén en la misma red Wi-Fi.**
2. El **backend esté corriendo** antes de abrir la app.
3. El **puerto 4000 esté accesible** (si hay firewall, ábrelo).

Puedes verificar la URL que está usando la app en la consola de Metro:

```
[EasyCount] API base URL: http://10.0.0.31:4000/api
```

### Usar una URL manual (opcional)

Si el auto-detección no funciona (túnel, emulador, producción), fuerza la URL con una variable de entorno:

```bash
EXPO_PUBLIC_API_URL=http://10.0.0.31:4000/api npx expo start
```

---

## 🧰 Stack y versiones

**Frontend (app)**

| Componente            | Versión              |
| --------------------- | -------------------- |
| Expo SDK              | ~54.0.34             |
| React Native          | 0.81.5               |
| React                 | 19.1.0               |
| expo-router           | ~6.0.23              |
| NativeWind (Tailwind) | ^5.0.0-preview.4     |
| expo-secure-store     | ~15.0.8              |

**Backend** (más detalle en [`backend/README.md`](backend/README.md))

| Componente     | Versión  |
| -------------- | -------- |
| Node.js        | v24.17.0 |
| Express        | ^5.2.1   |
| better-sqlite3 | ^13.0.3  |
| jsonwebtoken   | ^9.0.3   |
| bcryptjs       | ^3.0.3   |

---

## 🔌 Endpoints que consume la app

| Método | Ruta                       | Auth | Descripción                         |
| ------ | -------------------------- | ---- | ----------------------------------- |
| POST   | `/api/auth/register`       | No   | Registro de usuario                 |
| POST   | `/api/auth/login`          | No   | Login (devuelve JWT)                |
| GET    | `/api/auth/me`             | Sí   | Usuario autenticado                 |
| GET    | `/api/denominations`       | Sí   | Lista de denominaciones             |
| POST   | `/api/denominations`       | Sí   | Crear denominación                  |
| PATCH  | `/api/denominations/:id`   | Sí   | Activar/desactivar denominación     |
| GET    | `/api/transactions`        | Sí   | Historial de conteos                |
| POST   | `/api/transactions`        | Sí   | Guardar conteo                      |

---

## 🛠️ Solución de problemas

| Problema                            | Causa probable                          | Solución                                        |
| ----------------------------------- | --------------------------------------- | ----------------------------------------------- |
| `Network request failed`            | Backend no está corriendo               | Ejecuta `cd backend && npm start`               |
| `Network request failed`            | Celular y PC en redes distintas         | Conecta ambos a la misma Wi-Fi                  |
| `Network request failed`            | Firewall bloquea el puerto 4000         | Abre el puerto 4000 (ufw/firewall)              |
| URL incorrecta en la app            | IP no detectada                         | Usa `EXPO_PUBLIC_API_URL=...` manualmente       |
| `401 No autorizado`                 | Token ausente/expirado                  | Vuelve a iniciar sesión                         |
| `El correo ya está registrado`      | Email duplicado                         | Usa otro correo o inicia sesión                 |

---

## 📁 Estructura del proyecto

```
EasyCount/
├── app/                     # pantallas (expo-router) y componentes UI
│   ├── _layout.tsx          # hidratación del token (SecureStore) y navegación
│   ├── index.tsx            # tabs: conteo / reportes / catálogo / acerca
│   ├── login.tsx, register.tsx
│   ├── home.tsx, denomrow.tsx
│   ├── report-screen.tsx
│   ├── catalog-screen.tsx, catalog-section.tsx
│   └── about.tsx
├── src/
│   ├── config/api.ts        # resolución de la URL base de la API
│   └── services/
│       ├── api-client.ts    # fetch wrapper (agrega Bearer token, maneja errores)
│       ├── auth-store.ts    # token JWT en memoria + SecureStore
│       ├── user-service.ts  # auth contra la API
│       └── count-service.ts # denominaciones y transacciones contra la API
└── backend/                 # API REST (Express + SQLite + JWT)
    └── src/ (index, config, db, middleware, routes)
```
