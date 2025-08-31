# 🔑 INSTRUCCIONES PARA EL PROPIETARIO DE LA APP

**Estimado propietario de la aplicación "Ingresos Go":**

Para que las **suscripciones funcionen correctamente** en la app, necesitamos configurar la verificación automática con Google Play. Como developer, no tengo permisos para hacer estos pasos, por lo que necesito que usted los realice.

## ⏰ **URGENTE - Requerido antes del lanzamiento**

Sin estos pasos, las suscripciones **NO funcionarán** en producción.

---

## 📋 **PASO 1: Crear proyecto en Google Cloud Console**

1. **Abra**: https://console.cloud.google.com/
2. **Use la MISMA cuenta** de Gmail que tiene en Google Play Console
3. **Crear nuevo proyecto**:
   - Haga clic en el menú de proyectos (arriba)
   - Seleccione **"New Project"**
   - **Nombre del proyecto**: `ingresos-go-backend`
   - Haga clic en **"Create"**

---

## 📋 **PASO 2: Crear Service Account**

1. **En Google Cloud Console**:
   - Menú hamburguesa → **"APIs & Services"** → **"Credentials"**

2. **Crear Service Account**:
   - Haga clic en **"Create Credentials"** → **"Service Account"**
   - **Service account name**: `google-play-verification`
   - **Description**: `Verificación de compras de Google Play`
   - Haga clic en **"Create and Continue"**

3. **Configurar permisos**:
   - **Select a role**: `Service Account User`
   - Haga clic en **"Continue"** y luego **"Done"**

---

## 📋 **PASO 3: Generar archivo JSON**

1. **En la lista de Service Accounts**, haga clic en el que acaba de crear
2. **Pestaña "Keys"**
3. **"Add Key"** → **"Create new key"**
4. **Seleccione "JSON"** → **"Create"**
5. **Se descargará automáticamente** un archivo `.json` - ¡guárdelo!

---

## 📋 **PASO 4: Conectar con Google Play Console**

1. **Abra**: https://play.google.com/console/
2. **Setup** → **"API access"**
3. **"Link a Google Cloud project"**:
   - Seleccione el proyecto `ingresos-go-backend`
   - Haga clic en **"Link"**
4. **Grant access al Service Account**:
   - Busque: `google-play-verification@ingresos-go-backend.iam.gserviceaccount.com`
   - **Marque estos permisos**:
     - ✅ **View financial data**
     - ✅ **View app information and download bulk reports**
   - Haga clic en **"Invite user"**

---

## 📋 **PASO 5: Enviar archivo al desarrollador**

**¡IMPORTANTE!** Una vez completados los pasos anteriores:

1. **Renombre** el archivo JSON descargado a: `google-play-service-account.json`
2. **Envíemelo de forma segura** (email, drive, etc.)
3. **NO lo publique** en ningún lugar público

---

## 🔒 **Seguridad**

- Este archivo contiene **credenciales privadas**
- **NUNCA** lo comparta públicamente
- Solo el desarrollador de backend lo necesita
- Se usa para verificar que las compras son reales

---

## ❓ **¿Necesita ayuda?**

Si tiene dudas en algún paso:
- **WhatsApp/Email**: [Aquí pon tu contacto]
- **Urgencia**: Este proceso es necesario antes del lanzamiento

---

## ✅ **Al completar**

Una vez que me envíe el archivo `google-play-service-account.json`:
- ✅ Las suscripciones funcionarán automáticamente
- ✅ Se verificarán las compras reales con Google Play
- ✅ No habrá usuarios "premium falsos"

**¡Gracias por su colaboración!**

---

**Desarrollador:** Angel Daniel  
**Fecha:** ${new Date().toLocaleDateString()}  
**App:** Ingresos Go (com.ingresosgo.app)