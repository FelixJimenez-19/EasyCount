# Capacidades nativas de EasyCount — Cámara y Notificaciones

Documentación de la incorporación de dos capacidades nativas siguiendo la guía de evaluación:
selección, vía de acceso, declaraciones, solicitud, degradación, integración, cumplimiento y pruebas.

---

## 1. Selección

| Capacidad | Paquete | Pertinencia y valor | Clasificación |
| --- | --- | --- | --- |
| **Cámara** | `expo-image-picker` | Adjuntar una **foto de respaldo** (recibo del punto de venta o arqueo de caja) a cada cierre. Aporta trazabilidad y evidencia ante diferencias de caja: sin la foto, un descuadre no tiene cómo verificarse. | **Opcional** — el conteo y el guardado funcionan sin ella; se degrada a galería o a "sin foto". |
| **Notificaciones** | `expo-notifications` | La app es **offline-first** (cola de salida + `SyncEngine`): el usuario guarda sin conexión y no sabe cuándo llega al servidor. La notificación local cierra ese vacío: "Tu cierre se sincronizó correctamente". | **Esencial para la promesa offline-first** — sin aviso, el modelo de sincronización diferida queda invisible para el usuario; con permiso denegado la app degrada al estado visible en Reportes. |

Ambas se solicitan **en el momento de uso** (al guardar un cierre), nunca al arrancar la app.

## 2. Vía de acceso (plugins y verificación)

Instalación con versiones compatibles con Expo SDK 54:

```sh
npx expo install expo-notifications expo-image-picker expo-file-system
```

Criterios aplicados para elegir los plugins:

- Son módulos **oficiales de Expo** con config plugins (CNG): los permisos se declaran de forma
  declarativa en `app.json` y se regeneran en cada prebuild, sin tocar `AndroidManifest.xml` ni
  `Info.plist` a mano.
- `expo-image-picker` reutiliza la **app de cámara/selector del sistema** (no requiere el permiso
  de micrófono; se bloquea explícitamente con `microphonePermission: false`).
- Se usa **notificaciones locales** (`scheduleNotificationAsync` con `trigger: null`), no push
  remoto: no se necesita FCM/APNs, token Expo ni credenciales EAS, y funciona en Expo Go.

Verificación realizada:

- `npx expo install` resolvió las versiones SDK-54 compatibles (`expo-notifications`,
  `expo-image-picker`, `expo-file-system`) sin conflictos de pares.
- Config plugin de `expo-notifications` (canal `sync`, color `#4ade80`) y de `expo-image-picker`
  (cadenas de propósito en español, micrófono bloqueado) declarados en `app.json`.
- `npx expo prebuild --no-install` generó `android/` e `ios/` y se verificó el contenido del
  `AndroidManifest.xml` y del `Info.plist` (§3). El proyecto ahora compila con
  `npx expo run:android` (dev build), donde las cadenas personalizadas sí aparecen en los
  diálogos del sistema (a diferencia de Expo Go).
- `npx tsc --noEmit` y `npm run lint` sin errores.
- Backend probado end-to-end (ver §6).

## 3. Declaraciones

En un proyecto Expo con CNG las declaraciones se escriben una sola vez en `app.json` y los
config plugins las generan en los archivos nativos al hacer prebuild/build. Verificado con
`npx expo prebuild --no-install` (las carpetas `android/` e `ios/` están en el repo):

### Android — `android/app/src/main/AndroidManifest.xml` (generado)

```xml
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.RECORD_AUDIO" tools:node="remove"/>
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
<uses-permission android:name="android.permission.VIBRATE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
```

- `CAMERA` y `POST_NOTIFICATIONS`: declaradas por la app (`expo.android.permissions` en app.json).
- `RECORD_AUDIO` con `tools:node="remove"`: el micrófono queda **eliminado del manifiesto final**
  (compliance: expo-image-picker lo añade por defecto y se bloquea con `microphonePermission: false`).
- `INTERNET`, `VIBRATE`, `SYSTEM_ALERT_WINDOW`: base de Expo/notificaciones (necesarias).
- `READ/WRITE_EXTERNAL_STORAGE`: legacy de expo-image-picker solo para Android ≤ 12; en Android 13+
  el photo picker no las usa.

### iOS — `ios/EasyCount/Info.plist` (generado)

El **identificador del permiso** es la clave de Info.plist; su valor es la **cadena que explica
por qué se requiere** (lo que iOS muestra en el diálogo):

```xml
<key>NSCameraUsageDescription</key>
<string>EasyCount usa la cámara para adjuntar una foto de respaldo (recibo o arqueo) a tus cierres de caja.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>EasyCount accede a tus fotos para adjuntar una imagen de respaldo a tus cierres de caja.</string>
```

`NSMicrophoneUsageDescription` no aparece (micrófono no usado). Las notificaciones en iOS no
requieren cadena de propósito (es un permiso del sistema sin diálogo personalizado).

## 4. Solicitud (momento de uso + explicación previa + 4 estados)

La solicitud nunca ocurre al abrir la app; ocurre en el flujo concreto:

- **Notificaciones**: al pulsar **"Guardar Conteo"** (`home.tsx → openSaveModal`), antes de
  abrir el modal de confirmación, se muestra una **explicación propia** ("EasyCount guarda tus
  cierres incluso sin conexión…") con las opciones *Activar avisos* / *Ahora no*.
- **Cámara**: al pulsar **"Tomar foto"** en el modal de confirmación (`home.tsx → attachEvidence`),
  con la explicación "Para adjuntar una foto de respaldo (recibo o arqueo)…" y las opciones
  *Usar cámara* / *Elegir de la galería* / *Cancelar*.

Manejo de los cuatro estados (normalizados en `src/services/permissions.ts`):

| Estado | Detección | Comportamiento |
| --- | --- | --- |
| **Concedido** | `granted === true` | Se usa la capacidad con normalidad: aviso tras sincronizar / captura de foto. En iOS, `PROVISIONAL` y `EPHEMERAL` también cuentan como funcional. |
| **Restringido / No disponible** | la consulta o el lanzamiento lanzan error (sin cámara, sin app de cámara, módulo no disponible) | Se **oculta la funcionalidad**: el botón "Tomar foto" desaparece (queda Galería) y el flujo de avisos se salta, **sin presentarse como error técnico**. |
| **Denegado** | `granted === false && canAskAgain === true` | Se **explica el motivo** en el modal propio y se ofrece un botón **"Volver a solicitar"** (que vuelve a invocar `requestPermissionsAsync`) junto a la alternativa degradada (*Continuar sin avisos* / *Elegir de la galería*). |
| **Denegación permanente** | `granted === false && canAskAgain === false` | Se **explica la situación** y se proporciona un enlace directo **"Abrir ajustes del sistema"** (`Linking.openSettings()`), más la alternativa degradada. |

> **TRAMPA**: en denegación permanente el diálogo del sistema nunca vuelve a aparecer; por eso
> el código **no** vuelve a llamar a `requestPermissionsAsync()` en ese estado, solo redirige a
> los Ajustes del sistema.

## 5. Degradación (comportamiento ante indisponibilidad)

| Situación | Cámara | Notificaciones |
| --- | --- | --- |
| Restringido / no disponible | El botón "Tomar foto" **se oculta**; queda la galería (sin mensaje de error técnico). | El flujo de avisos se salta por completo; el cierre se guarda normal. |
| Denegado (una vez) | Modal que explica el motivo + **"Volver a solicitar"** + alternativa de galería. | Modal que explica el motivo + **"Volver a solicitar"** + "Continuar sin avisos" (estado visible en Reportes). |
| Denegación permanente | Modal con **"Abrir ajustes del sistema"** + alternativa de galería. | Modal con **"Abrir ajustes del sistema"** + "Continuar sin avisos". |
| Usuario cancela la captura | El cierre se guarda **sin foto** (la evidencia es opcional). | — |
| Sin conexión (independiente del permiso) | La foto queda en `document/evidence/`, la fila local en SQLite y la operación en la cola de salida. | El aviso solo se dispara cuando la cola **logra** sincronizar; si no, se reintenta con backoff. |
| Sin permisos en absoluto | La app funciona 100 %: contar, guardar, sincronizar. | Ídem: todo el flujo core es independiente de los permisos. |

## 6. Integración (persistencia local + envío al backend)

**Cámara / evidencia fotográfica:**

1. `EvidenceService.capturePhoto()` copia la foto del caché del picker a almacenamiento
   persistente (`Paths.document/evidence/<uuid>.jpg`, vía `expo-file-system` API nueva).
2. `TransactionRepository.save()` guarda `evidence_uri` en SQLite (migración drizzle
   `20260917025443_burly_nova`: `ALTER TABLE transaction ADD evidence_uri`) y encola en la cola
   de salida `create_transaction` con `evidence: { fileName, base64 }`.
3. `SyncEngine.processOp()` envía la evidencia en el `POST /api/transactions`.
4. El backend (`routes/transactions.js`) valida el tamaño (≤ 8 MB base64), decodifica y escribe
   el archivo en `backend/uploads/`, guarda `evidence_path` en la tabla `transactionn`
   (migración ligera en `db.js`) y lo sirve en `GET /api/uploads/:file` (express.static).
5. `GET /api/transactions` devuelve la ruta; Reportes muestra el icono de cámara y la imagen
   completa en el desglose expandido (fuente local `file://` o URL del servidor).

**Notificaciones / sincronización:**

1. `NotificationService.notifySyncComplete(count)` se llama desde `SyncEngine.processQueue()`
   cuando al menos una operación `create_transaction` terminó con éxito.
2. Sin permiso concedido, el servicio no emite nada (degradación silenciosa).

## 7. Cumplimiento

- **Sin permisos de acceso amplio innecesarios**: no se declara `READ_MEDIA_IMAGES`,
  `READ_EXTERNAL_STORAGE` amplio, ubicación ni contactos. `RECORD_AUDIO` queda **bloqueado**
  explícitamente (`microphonePermission: false` en el plugin de expo-image-picker).
- Solo se declaran los dos permisos usados: `CAMERA` y `POST_NOTIFICATIONS`.
- **Nivel de API objetivo**: el proyecto usa Expo SDK 54, cuyo `targetSdkVersion` por defecto es
  **36 (Android 16)**, por encima del requisito vigente de Google Play (API 35 para envíos
  nuevos). Verificable tras prebuild con `npx expo config --type introspect`.
- La evidencia viaja comprimida (calidad 0.5) y con tope en el servidor; el `express.json`
  del backend se amplió a 12 MB solo en la ruta JSON general (aceptable para este alcance).

## 8. Pruebas (5 casos de la guía — ejecutar en dispositivo físico)

> Las notificaciones push requieren dev build, pero **las locales y la cámara funcionan en Expo Go**.
> Resultados registrados al ejecutar: `npx expo start` → escanear QR con Expo Go (o dev build).

### Cómo ejecutarlas en el móvil

**Opción A — Dev build (recomendada, muestra tus textos en español):**

1. En el móvil: Ajustes → Acerca del teléfono → toca 7 veces "Número de compilación" (activa opciones de desarrollador).
2. Ajustes → Opciones de desarrollador → activa **Depuración por USB**.
3. Conecta el móvil por USB al PC y acepta el aviso "¿Permitir depuración USB?".
4. En el PC: `npx expo run:android` (la primera compilación tarda unos minutos). La app se instala como "EasyCount" propia.
5. Verifica que el backend esté corriendo (`http://localhost:4000/api/health`) para los casos con sincronización.

**Opción B — Expo Go (más rápida):** `npx expo start` y escanear el QR. Funciona para los casos de
permisos, pero los diálogos del sistema muestran el texto genérico de Expo Go en vez de tus cadenas.

**Resetear permisos entre casos (Android):** Ajustes → Aplicaciones → EasyCount → Permisos
(quitar cámara/notificaciones), o borra datos con Ajustes → Aplicaciones → EasyCount → Almacenamiento
→ Borrar datos. Por adb: `adb shell pm clear com.anonymous.EasyCount`.

**Cómo provocar cada estado en el diálogo del sistema:**

- *Denegar una vez*: pulsar "No permitir" una vez (en notificaciones) o "Don't allow" (cámara).
- *Denegación permanente*: negar **en el diálogo del sistema** dos veces. Importante: la segunda
  negación se produce tocando **"Volver a solicitar"** en el modal de la app y volviendo a negar
  en el diálogo del SO. Cancelar el modal de la app **no cuenta** como negación. En Android 11+,
  tras la segunda negación el SO marca el permiso con "no volver a preguntar" y a partir de ahí
  el diálogo **ya no vuelve a aparecer** (la "trampa"): la app detecta el estado y ofrece
  "Abrir ajustes del sistema". Alternativa equivalente: negar una vez y desactivar el permiso en
  Ajustes → Aplicaciones → EasyCount → Permisos.
- *Sin conexión*: activar el modo avión antes de guardar un cierre.

### Los cinco casos

| # | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| 1 | **Concesión** | Guardar un conteo → aceptar "Activar avisos" → aceptar permiso del sistema → adjuntar "Tomar foto" → aceptar cámara → confirmar cierre. | Se guarda con foto; al sincronizar llega la notificación local "Sincronización completada"; Reportes muestra la foto. |
| 2 | **Denegación única** | "Ahora no" en notificaciones y denegar la cámara una vez en el diálogo del sistema → volver a entrar al flujo. | Aparece el modal que explica el motivo con **"Volver a solicitar"**; la alternativa degradada funciona (Continuar sin avisos / galería) y el cierre se guarda igual. |
| 3 | **Denegación permanente** | "Tomar foto" → "Usar cámara" → negar en el diálogo del SO (1.ª negación) → en el modal de la app tocar **"Volver a solicitar"** → negar de nuevo en el diálogo del SO (2.ª negación) → volver a tocar "Tomar foto". | Aparece el modal de explicación con **"Abrir ajustes del sistema"** que lleva directo a los Ajustes de la app; el diálogo del SO ya no vuelve a aparecer. |
| 4 | **Revocación posterior** | Conceder, luego revocar desde Ajustes del sistema y volver a la app → guardar otro cierre. | La app detecta el estado actualizado (no usa un permiso "recordado") y aplica el comportamiento correspondiente del estado detectado. |
| 5 | **Sin conexión / degradación total** | Sin permisos y con modo avión → guardar un cierre con foto de galería. | El cierre queda en SQLite + cola; Reportes muestra "Sin conexión · datos locales"; al reconectar sincroniza y llega el aviso (si el permiso estaba concedido). |

**Estado**: casos definidos y flujo implementado; pendientes de ejecutar en el dispositivo físico
y anotar los resultados en esta tabla.
