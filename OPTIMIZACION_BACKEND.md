DIAGNÓSTICO Y OPTIMIZACIÓN DEL BACKEND - EasyCount
====================================================

Fecha: Julio 2026
Framework: expo-sqlite (SQLite sync API) + React Native (Expo SDK 54)


╔══════════════════════════════════════════════════════════════╗
║  1. OPERACIÓN COSTOSA IDENTIFICADA                          ║
╚══════════════════════════════════════════════════════════════╝

Archivo: src/services/count-service.ts
Método:  saveTransaction() (línea 49 original)

Problema: Loop con INSERTs individuales dentro de saveTransaction.
Cada desglose de denominación generaba un db.runSync() separado.

ANTES (N+1 inserts):
  for (const item of desgloses) {
      db.runSync("INSERT INTO transactionn_denomination ... VALUES (?, ?, ?, ?);", [...]);
  }

Para 12 denominaciones contadas → 12 queries individuales.

DESPUÉS (batch insert, 1 sola query):
  INSERT INTO transactionn_denomination (...) VALUES (?, ?, ?, ?), (?, ?, ?, ?), ...;

Todas las filas se insertan en una sola sentencia SQL.
Reducción: de N inserts a 1 solo insert batch.

Comparación: 12 denominaciones → 12 queries → 1 query (reducción ~92%).


╔══════════════════════════════════════════════════════════════╗
║  2. CORRECCIÓN N+1 EN AUTENTICACIÓN                         ║
╚══════════════════════════════════════════════════════════════╝

Archivo: src/services/user-service.ts

2a. getCurrentUser() - N+1 → JOIN

ANTES (2 queries separadas):
  const session = db.getFirstSync("SELECT id_user FROM session WHERE id = 1;");
  const row = db.getFirstSync("SELECT ... FROM user WHERE id_user = ?;", [session.id_user]);

DESPUÉS (1 query con JOIN):
  SELECT u.id_user, u.username, u.email, u.created_at
  FROM session s
  INNER JOIN user u ON s.id_user = u.id_user
  WHERE s.id = 1;

Reducción: 2 queries → 1 query.

2b. isLoggedIn() - consulta redundante

ANTES: Llamaba a getCurrentUser() que ejecutaba 2 queries y cargaba
todos los campos del usuario (username, email, created_at) solo para
verificar si exists = true/false.

DESPUÉS: Una sola consulta ligera que solo verifica existencia de sesión:
  SELECT id_user FROM session WHERE id = 1;

Reducción: 2 queries pesadas → 1 query ligera (sin JOIN).


╔══════════════════════════════════════════════════════════════╗
║  3. CACHÉ CACHE-ASIDE                                       ║
╚══════════════════════════════════════════════════════════════╝

Archivo nuevo: src/utilities/cache.ts

Estrategia: cache-aside (lookup cache → miss → DB → store cache)

Características:
- Almacenamiento en memoria (Map)
- TTL configurable (default: 5 minutos)
- Invalidación explícita por clave o patrón
- Métodos: get<T>(key), set(key, data), invalidate(pattern?)

Aplicado en: src/services/count-service.ts

Método: getDenominaciones()
- Hit: retorna datos cacheados (0 queries SQL)
- Miss: consulta DB, almacena en caché

Invalidación en:
- addDenominacion() → invalida caché (cambia catálogo)
- toggleDenominacion() → invalida caché (cambia estado activo/inactivo)

Flujo cache-aside:
  ┌─────────┐   get()   ┌─────────┐   miss   ┌──────┐
  │ Service │ ────────> │  Cache  │ ───────> │  DB  │
  └─────────┘ <──────── │ (in-mem)│ <─────── └──────┘
     ▲        hit/return └─────────┘  store
     │                                       ▲
     └─── invalidate() ──────────────────────┘
          (on write)

Comparación en montaje de app (antes/después):
  - Antes: cada vez que se monta, 1 query SQL para catálogo
  - Después: primer montaje 1 query, montajes subsecuentes 0 queries
    (hasta TTL expiración o invalidación por escritura)


╔══════════════════════════════════════════════════════════════╗
║  4. EAGER LOADING vs LAZY LOADING                           ║
╚══════════════════════════════════════════════════════════════╝

4a. getTransaction() - EAGER LOADING (correcto)

Archivo: src/services/count-service.ts

La consulta carga transacciones CON su desglose mediante INNER JOIN:
  FROM transactionn_denomination td
  INNER JOIN transactionn t ON ...
  INNER JOIN denomination d ON ...

Justificación: La pantalla de reportes (report-screen.tsx) siempre muestra
el desglose completo de cada transacción. El eager loading evita generar
consultas adicionales por cada transacción (que sería el problema N+1 clásico).
Es correcto mantener eager loading aquí porque el patrón de consumo
siempre requiere los datos relacionados.

4b. isLoggedIn() - LAZY LOADING (corregido)

Ahora solo consulta la tabla session (sin JOIN a user). La validación
de autenticación no necesita datos del usuario, solo saber si hay
sesión activa. Esto es lazy loading correcto: cargar solo lo mínimo
necesario para la verificación.


╔══════════════════════════════════════════════════════════════╗
║  5. TAREAS ASÍNCRONAS (COLA DE TRABAJO / WORKER)            ║
╚══════════════════════════════════════════════════════════════╝

Actualmente todas las operaciones son síncronas (expo-sqlite sync API).
No hay tareas asíncronas implementadas.

Potencial uso futuro: Si se añade sincronización con un backend
remoto, las operaciones de red deberían ir en una cola de trabajo.
Se recomienda usar un patrón Queue con reintentos para:
- Sincronización post-registro
- Envío de transacciones al servidor
- Notificaciones push

Por ahora, al ser una app puramente local con SQLite, las operaciones
sync son adecuadas (sin latencia de red).


╔══════════════════════════════════════════════════════════════╗
║  6. RESUMEN DE ARCHIVOS MODIFICADOS                          ║
╚══════════════════════════════════════════════════════════════╝

CREADO:
  src/utilities/cache.ts          - Sistema de caché cache-aside

MODIFICADOS:
  src/services/count-service.ts   - Batch insert + caché + invalidación
  src/services/user-service.ts    - JOIN en getCurrentUser + isLoggedIn ligero

Sin cambios:
  src/database/database.ts
  app/index.tsx
  app/login.tsx
  app/register.tsx
  app/report-screen.tsx
  app/catalog-screen.tsx
  app/home.tsx


╔══════════════════════════════════════════════════════════════╗
║  7. COMPARACIÓN ANTES / DESPUÉS                              ║
╚══════════════════════════════════════════════════════════════╝

Operación: Guardar conteo con 8 denominaciones

  ANTES:
    1 INSERT transactionn
    8 INSERT transactionn_denomination (loop)
    ────────────────────────────────
    Total: 9 queries

  DESPUÉS:
    1 INSERT transactionn
    1 INSERT transactionn_denomination (batch de 8 filas)
    ────────────────────────────────
    Total: 2 queries
    Reducción: 78% menos queries

Operación: Cargar catálogo (2do acceso+)

  ANTES: 1 query cada acceso
  DESPUÉS: 0 queries (cache hit)
  Reducción: 100% (mientras el caché esté vigente)

Operación: Verificar sesión (isLoggedIn)

  ANTES: 2 queries (session + user con todos los campos)
  DESPUÉS: 1 query ligera (solo session.id_user)
  Reducción: 50% menos queries, sin JOIN innecesario
