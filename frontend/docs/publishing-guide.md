# Guía de publicación en Google Play — EasyCount

Runbook para publicar EasyCount (Android) en Google Play con EAS Build + EAS Submit.
Caso: **cuenta personal de desarrollador**, **solo Android**, subida **automatizada** con `eas submit`.

## Datos del proyecto

| Dato | Valor |
| --- | --- |
| package / applicationId | `com.felix.easycount` |
| EAS projectId | `7c1ea765-d85e-402b-a311-b65ed712cf27` |
| `runtimeVersion` | `fingerprint` |
| Canal OTA de producción | `production` |
| SDK Expo | 54 (RN 0.81, `targetSdk = 36` / Android 16) |
| Tracking de versiones | `appVersionSource: remote`, `autoIncrement: true` (sube `versionCode` en cada build production) |

Requisito de Play cumplido: desde el **31-ago-2026** las apps nuevas deben apuntar a **API 36**. SDK 54 ya compila con `targetSdk = 36`, así que no hay que tocar nada.

## Enlaces

**Cuenta de Google Play**
- Registro (pago único 25 USD): https://play.google.com/apps/publish/signup/
- Panel de Play Console: https://play.google.com/console

**Google Service Account (para `eas submit`)**
- Guía oficial de Expo: https://expo.fyi/creating-google-service-account
- Crear Service Account (Google Cloud): https://console.cloud.google.com/iam-admin/serviceaccounts
- Habilitar **Google Play Android Developer API**: https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com

**EAS**
- Panel del proyecto (Credenciales): https://expo.dev/projects/7c1ea765-d85e-402b-a311-b65ed712cf27
- CLI alternativo: `eas credentials -p android` (perfil `production`)

## Fase 0 — Cuenta de desarrollador

1. Crear cuenta en Google Play Console (pago único 25 USD).
2. Elegir tipo de cuenta **Personal**.
3. Verificar identidad y verificar acceso a un dispositivo Android con la app **Play Console**.

> **Cuenta Personal creada después del 13-nov-2023:** Google exige una prueba cerrada con **12 testers durante 14 días continuos** antes de habilitar Producción. Las cuentas de Organización están exentas.

## Fase 1 — Crear la app en Play Console

- **Create app**: nombre, idioma, app/juego, gratuita o de pago, declaraciones.
- El `package` (`com.felix.easycount`) es definitivo y no se puede cambiar después.

## Fase 2 — Ficha de tienda y cumplimiento (obligatorio para publicar)

Materiales ya generados en el repo:
- `assets/store/icon-512.png` — ícono de tienda 512×512.
- `assets/store/feature-graphic-1024x500.png` — banner 1024×500.

Falta preparar:
- **Nombre**, **descripción corta** (80) y **completa** (4000).
- **Capturas de pantalla** (mínimo 2, hasta 8).
- **Política de privacidad** publicada en URL pública (ver `docs/privacy-policy.md`).
- **Data safety** (ver `docs/data-safety-answers.md`).
- **Content rating** (cuestionario), **Público objetivo**, **Ads**, **App access** (credenciales de prueba por el login).

## Fase 3 — Firma (App Signing)

- Dejar que **Google gestione la firma** (Play App Signing).
- EAS genera el keystore de subida en el primer `eas build` production.

## Fase 4 — Google Service Account

1. Crear proyecto en Google Cloud → habilitar **Google Play Android Developer API**.
2. Crear **Service Account** → generar clave **JSON** (descargar).
3. En Play Console → **Users & permissions** → invitar el email del service account con permisos de *Release*.
4. Subir la key a EAS:
   - Panel → **Credentials** → Android → *Service credentials* → *Add a Google service account key*, o
   - `eas credentials -p android` (perfil `production`) → Google Service Account.

> La key se guarda en EAS. **No** se pone `serviceAccountKeyPath` en `eas.json` ni se commitea el JSON.

## Fase 5 — Build de producción

```sh
eas build -p android --profile production
```

- Genera un **.aab** (App Bundle). `autoIncrement` sube el `versionCode` solo.
- **No** se instala directo en el dispositivo (a diferencia del APK del perfil `preview`).

## Fase 6 — Subir

```sh
eas submit -p android --profile production
```

- Atajo (build + submit en un paso): `eas build -p android --profile production --auto-submit`.
- La primera subida cae en **Internal testing** (configurado en `eas.json` → `submit.production.android.track = "internal"`).

Ruta de tracks para cuenta Personal:

1. **Internal testing** — prueba rápida.
2. **Closed testing** (`alpha`) — 12 testers durante 14 días continuos.
3. **Apply for production access** — responder el cuestionario en Play Console.
4. **Production** — crear release y hacer rollout (% → 100%).

Para apuntar a otro track, cambiar en `eas.json`:

```json
"submit": { "production": { "android": { "track": "alpha" } } }
```
Valores válidos: `internal`, `alpha`, `beta`, `production`.

## Fase 7 — Después de publicar

- Cambios **visuales / solo JS** → OTA, sin recompilar:
  ```sh
  eas update --channel production --message "..."
  ```
- Cambios **nativos** (íconos, permisos, librerías, SDK) → nuevo build + submit:
  ```sh
  eas build -p android --profile production && eas submit -p android --profile production
  ```

## Checklist rápido

- [ ] Cuenta Play (Personal) + verificación de identidad y dispositivo.
- [ ] App creada en Play Console con `com.felix.easycount`.
- [ ] `assets/store/icon-512.png` y `feature-graphic-1024x500.png` subidos.
- [ ] Capturas de pantalla listas.
- [ ] Política de privacidad publicada en URL.
- [ ] Data safety, Content rating, Target audience, App access completados.
- [ ] Google Service Account + key subida a EAS.
- [ ] `eas build -p android --profile production`.
- [ ] `eas submit -p android --profile production` → Internal testing.
- [ ] Closed testing (12 testers × 14 días) → Apply for production → Production.
