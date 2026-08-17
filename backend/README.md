# EasyCount — Backend (API REST)

API REST del backend de EasyCount. Reemplaza el almacenamiento local (expo-sqlite) por un servidor propio.

## Stack y versiones

| Componente     | Versión  |
| -------------- | -------- |
| Node.js        | v24.17.0 |
| npm            | 11.13.0  |
| Express        | ^5.2.1   |
| better-sqlite3 | ^13.0.3  |
| jsonwebtoken   | ^9.0.3   |
| bcryptjs       | ^3.0.3   |
| cors           | ^2.8.6   |
| dotenv         | ^17.4.2  |

## Requisitos

- Node.js >= 20 (probado en v24.17.0).
- npm >= 10.

## Instalación

```bash
cd backend
npm install
cp .env.example .env   # opcional; define PORT, JWT_SECRET, JWT_EXPIRES_IN
```

## Ejecución

```bash
npm start        # node src/index.js
npm run dev      # con --watch (reinicio automático)
```

El servidor escucha en `0.0.0.0:4000` (para que un dispositivo real en la misma red lo alcance).

### Verificación rápida

```bash
curl http://localhost:4000/api/health
# {"status":"ok","service":"easycount-api","timestamp":"..."}
```

## Endpoints

| Método | Ruta                    | Auth | Descripción                          |
| ------ | ----------------------- | ---- | ------------------------------------ |
| GET    | `/api/health`           | No   | Health check (sin token)             |
| POST   | `/api/auth/register`    | No   | Registro de usuario                  |
| POST   | `/api/auth/login`       | No   | Login, devuelve JWT                  |
| GET    | `/api/auth/me`          | Sí   | Usuario autenticado                  |
| GET    | `/api/denominations`    | Sí   | Lista de denominaciones              |
| POST   | `/api/denominations`    | Sí   | Crear denominación                   |
| PATCH  | `/api/denominations/:id`| Sí   | Activar/desactivar denominación      |
| GET    | `/api/transactions`     | Sí   | Historial de transacciones (desglose)|
| POST   | `/api/transactions`     | Sí   | Guardar conteo                       |

Los endpoints protegidos requieren el header `Authorization: Bearer <token>`.

### Ejemplo de flujo

```bash
# 1. Registro
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"felix","email":"felix@test.com","password":"123456"}'

# 2. Login (obtén el token)
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"felix@test.com","password":"123456"}' | jq -r .token)

# 3. Consumir endpoint protegido
curl http://localhost:4000/api/denominations -H "Authorization: Bearer $TOKEN"
```

## Estructura

```
backend/
├── src/
│   ├── index.js             # entrada del servidor y montaje de rutas
│   ├── config.js            # variables de entorno
│   ├── db.js                # conexión SQLite, schema y seed
│   ├── middleware/auth.js   # firma/verificación JWT
│   └── routes/
│       ├── auth.js
│       ├── denominations.js
│       └── transactions.js
├── .env.example
├── .gitignore
└── package.json
```

La base de datos SQLite (`easycount.db`) se crea automáticamente en la primera ejecución y se siembra con las denominaciones de Ecuador.
