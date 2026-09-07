# EasyCount — Datos, almacenamiento offline y sincronización

Este documento cubre los entregables del taller sobre persistencia local: clasificación de
datos, almacenamiento cifrado de credenciales, base de datos local, lectura/escritura sin
conexión, cola de sincronización, resolución de conflictos y retención de datos personales.

---

## 1. Clasificación de los datos

Cada clase de dato se asigna a un mecanismo de almacenamiento según su sensibilidad y ciclo de vida.

| Clase de dato | Ejemplos | Sensibilidad | Mecanismo de almacenamiento |
| --- | --- | --- | --- |
| **Credenciales de sesión** | Token JWT | Alta | `expo-secure-store` (Keychain en iOS / Keystore en Android, cifrado por el sistema) |
| **Perfil de usuario** | `username`, `email` | Media | Solo en el servidor (no se persiste localmente) |
| **Catálogo de denominaciones** | valor, tipo, activa | Baja | SQLite local (caché de lectura) |
| **Conteos / transacciones** | total, observación, desglose | Media (datos del usuario) | SQLite local + servidor |
| **Cola de operaciones pendientes** | operaciones sin sincronizar | Media | SQLite local |
| **Metadatos de sincronización** | fecha de última sincronización | Baja | SQLite local (tabla `sync_meta`) |

La contraseña **nunca** se almacena en el cliente: solo se envía al servidor en el
registro/login y el servidor guarda su hash (`bcrypt`).

---

## 2. Credenciales en almacenamiento cifrado del sistema

El token JWT se guarda exclusivamente en `expo-secure-store` (`src/services/auth-store.ts`).

- Al iniciar sesión/registro se persiste con `SecureStore.setItemAsync`.
- Al abrir la app, `_layout.tsx` ejecuta `AuthStore.hydrate()` que lo recupera con
  `getItemAsync` **antes** de renderizar la navegación; por eso la sesión sobrevive al cierre
  y reapertura de la aplicación.
- Al cerrar sesión se elimina con `SecureStore.deleteItemAsync`.

El token se mantiene además en memoria (`AuthStore`) para no leer el almacén cifrado en cada
petición.

---

## 3. Base de datos local: elección y justificación

**Mecanismo elegido: `expo-sqlite` + `drizzle-orm` (con `drizzle-kit` para migraciones).**

### Criterios técnicos

- `expo-sqlite` es el driver SQLite nativo de Expo (incluido en Expo Go), sin binarios propios
  ni servicio externo; persiste entre reinicios y soporta WAL.
- El esquema es relacional (transacciones con desglose 1→N), que encaja mejor en SQL que en un
  almacén clave-valor.
- `drizzle-orm` da consultas tipadas en TypeScript y, con `drizzle-kit`, genera **migraciones
  SQL versionadas y reproducibles** en `drizzle/`.

### Salud del mantenimiento

- El esquema se declara en un único archivo (`db/schema.ts`) como fuente de verdad.
- Las migraciones son incrementales y versionadas; un cambio de esquema = una nueva migración
  generada, sin escribir DDL a mano.
- El tipado detecta errores de columnas/tablas en compilación.
- Alternativas descartadas: `AsyncStorage`/`expo-sqlite/kv-store` (no relacional, sin
  migraciones formales), `Realm`/`WatermelonDB` (dependencias más pesadas de lo que la app
  necesita).

### Esquema de la entidad principal (`transaction`)

```
transaction
├── id_transaction  INTEGER PK (autoincremento local)
├── client_id       TEXT UNIQUE  ← identificador único generado en el cliente (idempotencia)
├── date            TEXT (ISO)   ← fecha del conteo
├── total           REAL
├── observation     TEXT
├── synced          INTEGER      ← 0 pendiente, 1 ya enviado al servidor
└── created_at      TEXT

transaction_denomination  (desglose 1→N, ON DELETE CASCADE)
├── id_transaction_denomination INTEGER PK
├── id_transaction  INTEGER FK → transaction
├── id_denomination INTEGER
├── label           TEXT  (desnormalizado para lectura offline sin JOIN)
├── value           REAL  (desnormalizado)
├── quantity        INTEGER
└── subtotal        REAL

Tablas auxiliares: denomination (caché), pending_operation (cola), sync_meta.
```

---

## 4. Lectura sin conexión

La pantalla **Reportes / Historial** (`report-screen.tsx`) lee siempre de la base de datos
local. Cuando hay conexión, `CountService.getTransactions()` refresca la caché desde el
servidor y guarda la marca `last_sync_at`; sin conexión, muestra lo último cacheado.

El indicador de antigüedad es visible:

- **"Actualizado hace X min"** (verde) cuando hay datos sincronizados.
- **"Sin conexión · datos locales"** (ámbar) cuando `expo-network` reporta que no hay red.
- **"Sin datos sincronizados aún"** cuando la caché está vacía.

---

## 5. Escritura sin conexión

Guardar un conteo (y activar/desactivar una denominación) es **offline-first**:

1. Se escribe la entidad en SQLite local de inmediato (optimista).
2. Se encola una operación en `pending_operation` con un **`client_id` único (UUID v4,
   `expo-crypto`)**.
3. `SyncEngine.kick()` intenta sincronizar; si no hay red, la operación queda en cola.

El `client_id` identifica de forma única cada operación del cliente y es la clave para la
idempotencia en el servidor.

---

## 6. Sincronización

`SyncEngine` (`src/services/sync-engine.ts`):

- Escucha cambios de red con `Network.addNetworkStateListener` y procesa la cola al recuperar
  la conexión.
- **Reintentos de espera creciente** (backoff exponencial): 1s, 2s, 4s, 8s, 16s…
- **Número máximo de intentos**: 5 (`max_attempts`); superado, la operación se marca agotada y
  deja de reintentarse.
- Los errores 4xx se descartan como permanentes (no reintenta); los errores de red/5xx se
  reintentan.

---

## 7. Resolución de conflictos

**Estrategia adoptada: *last-write-wins* (la escritura más reciente gana)**, complementada con
idempotencia por `client_id`.

- Para **denominaciones** (dato mutable): cada operación lleva un `updatedAt` generado en el
  cliente. El servidor (`PATCH /denominations/:id`) aplica el cambio **solo si** `updatedAt` es
  más reciente que el valor guardado; si es más antiguo responde `409` y conserva su valor.
- Para **transacciones** (dato solo-append): el servidor (`POST /transactions`) es idempotente
  por `client_id`; si la operación ya fue aplicada, devuelve la existente y no duplica.

**Qué sacrifica esta estrategia:**

- Las ediciones **concurrentes sin conexión** no se fusionan: la escritura con timestamp más
  antiguo se pierde silenciosamente (no hay merge de campos ni historial de versiones).
- Se asume que los relojes de los dispositivos están razonablemente sincronizados (se comparan
  timestamps del cliente).
- Es la opción más simple y predecible para una app de un único usuario por caja, donde el
  conflicto real es raro y la consistencia eventual es aceptable.

---

## 8. Cierre de sesión y datos personales

Al cerrar sesión (`UserService.logout`) se **elimina la totalidad del almacén local**:

- `expo-secure-store`: se borra el token JWT.
- SQLite local: se vacían `transaction`, `transaction_denomination`, `denomination`,
  `pending_operation` y `sync_meta`.

### Qué se almacena, con qué finalidad y durante cuánto tiempo

| Dato | Finalidad | Dónde | Retención |
| --- | --- | --- | --- |
| Token JWT | Autenticar las peticiones a la API | SecureStore (cifrado) | Hasta cerrar sesión o caducar (`JWT_EXPIRES_IN=5d`) |
| `username`, `email` | Identificar la cuenta | Solo servidor | Hasta que el usuario borre su cuenta (no hay endpoint de borrado aún) |
| Contraseña (solo hash `bcrypt`) | Verificar el login | Solo servidor | Igual que la cuenta |
| Denominaciones | Operar el conteo | SQLite (caché) + servidor | Caché: hasta cerrar sesión; servidor: persistente |
| Conteos/transacciones | Historial de cierres de caja | SQLite + servidor | Caché: hasta cerrar sesión; servidor: persistente |
| Cola de operaciones | Reintentar sincronización | SQLite | Hasta sincronizar, agotar intentos o cerrar sesión |
| `last_sync_at` | Mostrar antigüedad de datos | SQLite | Hasta cerrar sesión |

> La caché local se limpia por completo al cerrar sesión, por lo que los datos del usuario no
> quedan en el dispositivo tras salir de la cuenta.
