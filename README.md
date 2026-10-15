# 👋 Bienvenido a EasyCount

**EasyCount** es una aplicación móvil para automatizar el conteo de dinero físico y la gestión de caja. Con ella puedes contar billetes y monedas, calcular el total automáticamente, guardar cada arqueo y consultar el historial de cierres.

La app funciona **100% en el dispositivo**: no necesita un servidor ni conexión a internet. Todos los datos (usuarios, denominaciones y arqueos) se guardan en una base de datos **SQLite local** dentro del propio teléfono mediante `expo-sqlite`.

```
┌──────────────────────────────┐
│        App móvil (Expo)      │
│  React Native + expo-router  │
│  ┌────────────────────────┐  │
│  │  SQLite local          │  │
│  │  (easycount.db)        │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

> No hay backend ni API REST. La capa de servicios (`CountService`, `UserService`) habla directamente con SQLite.

---

## 📋 Requisitos

| Herramienta           | Versión mínima      | Probado con |
| --------------------- | ------------------- | ----------- |
| Node.js               | 20.x                | v24.17.0    |
| npm                   | 10.x                | 11.13.0     |
| Git                   | cualquiera reciente | —           |
| Expo Go (en el móvil) | SDK 54              | —           |

No se requiere instalar una base de datos aparte: `expo-sqlite` crea y administra el archivo `easycount.db` en el almacenamiento de la app.

---

## 🚀 Levantar la app (paso a paso)

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd EasyCount
```

### 2. Instalar dependencias y arrancar

```bash
cd frontend
npm install
npx expo start
```

Escanea el **código QR** con la app **Expo Go** en tu celular (o presiona `a`/`i` para emulador).

Al iniciar, la app crea automáticamente la base de datos y siembra las denominaciones de Ecuador si aún no existen.

---

## 💾 Cómo se guardan los datos

La base de datos se crea sola en la primera ejecución (`src/database/database.ts`) con las tablas:

| Tabla                     | Contenido                                  |
| ------------------------- | ------------------------------------------ |
| `denomination`            | Billetes y monedas (se siembran al inicio) |
| `transactionn`            | Cada arqueo/conteo guardado                |
| `transactionn_denomination` | Desglose de cada conteo                  |
| `user`                    | Usuarios registrados                       |
| `session`                 | Sesión activa (fila `id = 1`)              |

**Registro/Login:** el usuario se guarda localmente. La contraseña se almacena con hash **SHA-256** (`src/utilities/crypto.ts`) y la sesión se representa con una fila en `session`. No hay tokens JWT ni red.

### ⚠️ Importante sobre los datos

- Los datos viven **solo en el teléfono**. Si desinstalas la app, se **borran**.
- No hay sincronización entre dispositivos: cada teléfono tiene su propia base.
- Al compilar como **APK / build propio**, la base persiste entre actualizaciones de la app.
- En **Expo Go**, la base vive dentro de Expo Go; se pierde si desinstalas Expo Go.

---

## 🧰 Stack y versiones

| Componente            | Versión          |
| --------------------- | ---------------- |
| Expo SDK              | ~54.0.36         |
| React Native          | 0.81.5           |
| React                 | 19.1.0           |
| expo-router           | ~6.0.23          |
| expo-sqlite           | ~16.0.10         |
| crypto-js             | ^4.2.0           |
| NativeWind (Tailwind) | ^5.0.0-preview.4 |

---

## 📁 Estructura del proyecto

```
EasyCount/
└── frontend/                # App móvil (Expo + React Native)
    ├── app/                 # pantallas (expo-router) y componentes UI
    │   ├── _layout.tsx      # inicializa la base de datos antes de renderizar
    │   ├── index.tsx        # tabs: conteo / reportes / catálogo / acerca
    │   ├── login.tsx, register.tsx
    │   ├── home.tsx, denomrow.tsx
    │   ├── report-screen.tsx
    │   ├── catalog-screen.tsx, catalog-section.tsx
    │   └── about.tsx
    ├── src/
    │   ├── database/
    │   │   └── database.ts       # conexión SQLite, tablas y seed
    │   ├── services/
    │   │   ├── count-service.ts  # denominaciones y transacciones (SQLite)
    │   │   └── user-service.ts   # registro/login/sesión (SQLite)
    │   └── utilities/
    │       ├── crypto.ts         # hash de contraseñas (SHA-256)
    │       └── cache.ts          # caché cache-aside para el catálogo
    └── package.json
```

---

## 🛠️ Solución de problemas

| Problema                        | Causa probable                          | Solución                                  |
| ------------------------------- | --------------------------------------- | ----------------------------------------- |
| Los datos no se guardan         | Error al abrir la BD                    | Revisa la consola de Metro en busca de `Error al iniciar la base de datos` |
| `Sesión inválida` al abrir      | Sesión borrada tras reinstalar          | Vuelve a iniciar sesión                   |
| `El correo ya está registrado`  | Email duplicado en la BD local          | Usa otro correo o inicia sesión           |
| Quiero reiniciar la app limpia  | Necesitas borrar los datos              | Desinstala/reinstala la app (o limpia los datos desde Ajustes) |
