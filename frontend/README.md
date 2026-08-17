# EasyCount

Aplicación móvil para automatizar el conteo de dinero físico y la gestión de caja. Gestiona un catálogo maestro de denominaciones de moneda y el registro histórico de los arqueos realizados.

La app **consume una API REST propia** (backend Node.js + Express + SQLite + JWT) en lugar de usar una base de datos local.

## Arquitectura

```
┌──────────────────┐         HTTP (JSON)          ┌──────────────────────┐
│   App móvil      │  ─────────────────────────>  │  Backend (Express)   │
│  Expo Go / RN    │      Authorization: Bearer   │  SQLite + JWT        │
└──────────────────┘  <─────────────────────────  └──────────────────────┘
```

## Stack y versiones

**Frontend (app)**

| Componente        | Versión                 |
| ----------------- | ----------------------- |
| Expo SDK          | ~54.0.34                |
| React Native      | 0.81.5                  |
| React             | 19.1.0                  |
| expo-router       | ~6.0.23                 |
| NativeWind (Tailwind) | ^5.0.0-preview.4    |
| expo-secure-store | (última compatible)     |

**Backend** (ver `backend/README.md`)

| Componente     | Versión  |
| -------------- | -------- |
| Node.js        | v24.17.0 |
| Express        | ^5.2.1   |
| better-sqlite3 | ^13.0.3  |
| jsonwebtoken   | ^9.0.3   |
| bcryptjs       | ^3.0.3   |

## Reproducción del entorno

### 1. Requisitos

- Node.js >= 20 (probado en v24.17.0).
- npm >= 10.
- Dispositivo móvil con **Expo Go** (o emulador).

### 2. Levantar el backend

```bash
cd backend
npm install
npm start          # escucha en 0.0.0.0:4000
```

Verifica: `curl http://localhost:4000/api/health` → `{"status":"ok",...}`.

### 3. Levantar la app

```bash
npm install
npx expo start
```

Escanea el código QR con Expo Go.

### 4. Cómo llega la app al backend

La app resuelve la URL de la API automáticamente en desarrollo a partir de `Constants.expoConfig.hostUri` (la IP de tu PC en la red local), por lo que el dispositivo alcanza el backend en `http://<IP-PC>:4000/api` sin configuración adicional.

> **PC y dispositivo deben estar en la misma red Wi-Fi.** Si el firewall bloquea el puerto 4000, ábrelo.

Para apuntar a otra URL (producción, emulador, túnel), define la variable de entorno:

```bash
EXPO_PUBLIC_API_URL=https://tu-api.com/api npx expo start
```

## Endpoints consumidos por la app

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/denominations`, `POST /api/denominations`, `PATCH /api/denominations/:id`
- `GET /api/transactions`, `POST /api/transactions`

## Estructura del proyecto

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
