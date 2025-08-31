# Configuración de Google Play Service Account

## 🔑 Paso 1: Crear Service Account en Google Cloud Console

1. **Ve a Google Cloud Console**: https://console.cloud.google.com/
2. **Crea o selecciona un proyecto** asociado a tu app de Google Play
3. **Ve a APIs & Services → Credentials**
4. **Crea Service Account**:
   - Name: `google-play-verification`
   - Role: `Service Account User`
5. **Genera la clave JSON**:
   - En el service account creado, ve a "Keys"
   - Add Key → Create new key → JSON
   - **Descarga el archivo JSON**

## 🔧 Paso 2: Configurar en Google Play Console

1. **Ve a Google Play Console**: https://play.google.com/console
2. **Setup → API access**
3. **Link a Google Cloud project** (usa el mismo proyecto del paso 1)
4. **Grant access to service accounts**:
   - Selecciona tu service account
   - Permisos: **View financial data, View app information and download bulk reports**

## 📁 Paso 3: Agregar archivo al backend

1. **Renombra** el archivo JSON descargado a: `google-play-service-account.json`
2. **Colócalo** en la carpeta: `backend/config/`
3. **Estructura final**:
   ```
   backend/
   ├── config/
   │   └── google-play-service-account.json  ← Aquí
   ├── routes/
   ├── services/
   └── server.js
   ```

## 🚨 IMPORTANTE: Seguridad

- **NUNCA** subas este archivo a Git/GitHub
- **Agrega** `google-play-service-account.json` al `.gitignore`
- **En producción** (Render): Usa variables de entorno o secrets

## 🧪 Modo Desarrollo

Si **NO** tienes el archivo service account:
- El sistema funcionará en **modo mock**
- Aceptará cualquier purchase token válido
- Perfecto para testing local

## ✅ Verificar funcionamiento

Una vez configurado:
1. **Reinicia** tu backend
2. **Verifica** en los logs: `✅ Google Play API inicializada correctamente`
3. **Si ves mock**: Significa que falta el service account file

---

## 📋 Archivo esperado: `google-play-service-account.json`

```json
{
  "type": "service_account",
  "project_id": "your-project",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "service-account@your-project.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```