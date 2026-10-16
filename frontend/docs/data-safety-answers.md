# Guía: formulario "Seguridad de los datos" (Data safety) — Google Play

Guía para responder el cuestionario **Data safety** del Play Console según el
comportamiento real de EasyCount (verificado en el código).

> **Conclusión clave:** la App **no recopila ni comparte datos del usuario** en el
> sentido de Google Play, porque **nada sale del dispositivo**. Google define
> "recopilar" como *transmitir datos fuera del dispositivo*.

## Por qué "No recopila datos" (evidencia en el código)

- **Login 100 % local:** las cuentas se guardan en SQLite del dispositivo y la
  contraseña se verifica con SHA-256. Sin servidor ni tokens
  (`src/services/user-service.ts`).
- **Sesión en almacenamiento seguro local:** `expo-secure-store`
  (`src/services/auth-store.ts`).
- **Fotos de evidencia:** cámara/galería copian la imagen al directorio privado
  de la App (`Paths.document/evidence`), sin subida
  (`src/services/evidence-service.ts`).
- **Notificaciones locales:** `scheduleNotificationAsync`. No hay registro de
  push tokens ni envío a servidores (`src/services/notification-service.ts`).
- **Sin red:** no existen `fetch` / `axios` / URLs de API en `src/`.

## Respuestas sugeridas, sección por sección

### 1. Recopilación y seguridad de datos
- **¿Tu app recopila o comparte alguno de los tipos de datos requeridos?**
  → **No** (seleccionar "No").
- **Seguridad de los datos**
  - ¿Los datos se cifran en tránsito? → **N/A** (no se transmiten datos).
  - ¿El usuario puede solicitar la eliminación de sus datos? → **Sí**
    (borrar desde la App / desinstalar; no hay copia en servidores).

### 2. Tipos de datos
Al no recopilarse datos transmitidos, no se marca **ninguna** categoría
(ubicación, info personal, info financiera, fotos y videos, archivos, contactos,
actividad, etc.). No aplica.

### 3. ¿Datos compartidos con terceros?
→ **No**.

## Preguntas relacionadas (fuera del cuestionario de datos, pero obligatorias)

- **Acceso a fotos y videos:** indicar que la selección de imágenes se hace con
  el **selector del sistema** (no requiere permiso amplio); el ícono de
  declaración puede llevar a una nota de que el acceso es opcional y local.
- **Cámara:** permiso declarado en `app.json`
  (`android.permission.CAMERA`) — uso opcional para adjuntar evidencia.
- **Anuncios:** la App **no** contiene anuncios.
- **Contenido dirigido a niños (Target audience):** adultos / uso general
  (no dirigida a menores).

## Si en el futuro agregas backend, sync en la nube o analítica

Entonces **sí** deberás actualizar esta sección y declarar, como mínimo:
- **Info personal** (correo, nombre de usuario) — recopilada.
- **Fotos** — recopiladas (si se suben).
- **Cifrado en tránsito** — sí/HTTPS.
- **Política de privacidad** actualizada en consecuencia.

## Anexos que Play pedirá

- **URL de la Política de Privacidad** (ver `docs/privacy-policy.md`, debe estar
  publicada en una URL pública antes de publicar).
- **Clasificación de contenido** (cuestionario aparte).
- **Acceso a la app (App access):** si hay login, entregar credenciales de prueba
  para revisión (o indicar que la cuenta se crea dentro de la App).
