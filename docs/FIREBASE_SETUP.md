# 🔥 Configuración de Firebase para POOL

Esta guía te ayudará a configurar Firebase para que POOL funcione con una base de datos real en lugar de solo localStorage.

## ¿Por qué Firebase?

✅ **Gratis**: Plan Spark (gratuito) incluye:
- 1 GB almacenamiento en Firestore
- 50,000 lecturas/día
- 20,000 escrituras/día
- Autenticación con Google

✅ **Multi-dispositivo**: Los datos se sincronizan en tiempo real

✅ **Seguro**: Con reglas de Firestore, solo los participantes pueden ver sus pools

✅ **Fácil**: Firebase maneja toda la infraestructura

## 📋 Pasos para Configurar Firebase

### 1️⃣ Crear Proyecto en Firebase

1. Ve a **[firebase.google.com](https://firebase.google.com)**
2. Haz click en **"Ir a la consola"** (arriba a la derecha)
3. Haz click en **"Crear proyecto"**
4. Nombre: **pool-app**
5. Desmarca "Habilitar Google Analytics" (opcional)
6. Click en **"Crear proyecto"**
7. Espera ~2 minutos a que se cree

### 2️⃣ Activar Firestore Database

1. En la sección **"Compilación"** del menú izquierdo
2. Click en **"Cloud Firestore"**
3. Click en **"Crear base de datos"**
4. **Ubicación**: Selecciona la más cercana a ti (ej: `southamerica-east1` para Sudamérica)
5. **Modo de seguridad**: Selecciona **"Iniciar en modo prueba"**
   - Por ahora permite lectura/escritura desde cualquier parte
   - Más adelante agregaremos reglas de seguridad
6. Click en **"Crear"**

### 3️⃣ Activar Google Sign-In

1. En la sección **"Compilación"** del menú izquierdo
2. Click en **"Authentication"**
3. Click en **"Comenzar"**
4. En la pestaña **"Métodos de inicio de sesión"**
5. Click en **"Google"**
6. Toggle **Habilitado** (ON)
7. Ingresa:
   - Email del proyecto: (dejarlo por defecto)
   - Nombre público: **POOL**
8. Click en **"Guardar"**

### 4️⃣ Obtener Credenciales Web

1. Haz click en el engranaje ⚙️ arriba a la izquierda → **"Configuración del proyecto"**
2. Ve a la pestaña **"General"**
3. En **"Tus aplicaciones"**, haz click en **"</>** (icono web)
4. Nombre: **pool-app** (o cualquier nombre)
5. Copia la configuración que aparece:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "pool-app-xxxxx.firebaseapp.com",
     projectId: "pool-app-xxxxx",
     storageBucket: "pool-app-xxxxx.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef1234567890"
   };
   ```

### 5️⃣ Pegar Credenciales en firebase-config.js

1. Abre el archivo **firebase-config.js** en tu editor
2. Reemplaza los valores:
   ```javascript
   const FIREBASE_CONFIG = {
       apiKey: "TU_API_KEY_AQUÍ",
       authDomain: "TU_AUTH_DOMAIN_AQUÍ",
       projectId: "TU_PROJECT_ID_AQUÍ",
       storageBucket: "TU_STORAGE_BUCKET_AQUÍ",
       messagingSenderId: "TU_MESSAGING_SENDER_ID_AQUÍ",
       appId: "TU_APP_ID_AQUÍ"
   };
   ```
3. Guarda el archivo

### 6️⃣ Configurar Reglas de Firestore (Seguridad)

1. En Firebase Console, ve a **Cloud Firestore**
2. Click en **"Reglas"**
3. Reemplaza TODO el contenido con:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Colección: pools
    // Solo participantes del pool pueden leer
    match /pools/{poolId} {
      allow read: if 
        request.auth.uid == resource.data.createdByUid ||
        request.auth.uid in resource.data.participantsUids;
      allow create: if request.auth.uid != null;
      allow update: if request.auth.uid == resource.data.createdByUid;
      allow delete: if request.auth.uid == resource.data.createdByUid;
    }
    
    // Colección: users
    // Cada usuario solo puede leer/escribir su propio documento
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

4. Click en **"Publicar"**

---

## 🧪 Probar la Configuración

### Prueba 1: App Abre Sin Errores
```
1. Abre la app: http://localhost:3000
2. Abre la consola del navegador (F12)
3. Busca estos mensajes:
   ✅ Firebase inicializado correctamente
   ✅ firestore-wrapper.js cargado
   ✅ firebase-auth-ui.js cargado
```

### Prueba 2: Google Sign-In Funciona
```
1. En Step-0, click en "Iniciar sesión con Google"
2. Se abre popup de Google
3. Selecciona tu cuenta
4. Vuelves a la app y ves tu nombre
5. En Step-1 aparece botón "🚪 Salir"
```

### Prueba 3: Crear Pool y Ver en Firebase
```
1. Crea un pool normalmente
2. Ve a Firebase Console → Cloud Firestore
3. En colección "pools" deberías ver tu pool creado
4. Haz click en el documento para ver los datos
```

### Prueba 4: Multi-Dispositivo
```
1. Crea un pool en navegador A (autenticado con Google)
2. Abre en navegador B (incógnito, otro usuario)
3. Ambos ven el pool en su colección
4. Los datos están sincronizados en Firebase
```

---

## 🐛 Solucionar Problemas

### "Firebase no disponible"
- ¿Copiaste las credenciales correctamente en `firebase-config.js`?
- ¿Todos los valores son strings (entre comillas)?
- Recarga la página (Ctrl+F5)

### "auth/operation-not-supported-in-this-environment"
- Esto es normal en localhost con ciertas configuraciones
- La app fallback a localStorage automáticamente
- Desplegada en HTTPS (GitHub Pages) funcionará correctamente

### "Pool no se guarda en Firebase"
- ¿Está autenticado el usuario?
- ¿Firestore está habilitado?
- Revisa la consola (F12) para errores
- Comprueba que el modo sea "Prueba" (permite lectura/escritura)

### No veo el botón de Google Sign-In
- ¿Activaste Authentication en Firebase?
- ¿Habilitaste Google como método?
- Recarga la página

---

## 📊 Ver Datos en Firebase Console

### En Firebase Console:

1. **Cloud Firestore** → Ve todos los pools creados
2. **Authentication** → Ve usuarios que iniciaron sesión con Google
3. **Storage** → Aquí se guardarían fotos (no implementado aún)
4. **Logs** → Para debugging de reglas de Firestore

---

## ⚙️ Próximos Pasos (Fases)

### ✅ Fase 1 (AHORA): Setup Firebase
- Firebase SDK agregado
- Google Sign-In en Step-0
- Credenciales en firebase-config.js

### 🔄 Fase 2: Sincronización de Pools
- Pools se guardan en Firestore
- Se cargan desde Firestore
- Fallback a localStorage

### 🔄 Fase 3: Confirmaciones en Tiempo Real
- Listeners de Firestore (onSnapshot)
- UI se actualiza al instante
- Los cambios se ven en todos los dispositivos

### 🔄 Fase 4: Ubicación Compartida
- navigator.geolocation
- GPS del driver/return parent
- Mapa en tiempo real

### 🔄 Fase 5+: Estados, Notificaciones, etc.

---

## 💰 Costo de Firebase

**Plan Spark (GRATIS)**:
- 1 GB de almacenamiento
- 50,000 lecturas/día
- 20,000 escrituras/día
- Suficiente para pequeños grupos

**Estimación para POOL**:
- 10 pools/mes
- 5 participantes/pool
- ~500 lecturas/mes
- **TOTALMENTE GRATIS** ✅

Si crece mucho, puedes actualizar a plan **Blaze** (pago por uso, muy barato).

---

## 🎯 Resumen

1. ✅ Crear proyecto Firebase
2. ✅ Activar Firestore
3. ✅ Activar Google Auth
4. ✅ Copiar credenciales a `firebase-config.js`
5. ✅ Publicar reglas de Firestore
6. ✅ Probar en la app
7. ✅ ¡Listo!

La app funcionará con o sin Firebase (fallback a localStorage), así que aunque cometas un error, la app sigue funcionando. 😊

---

## 📞 Soporte

Si tienes dudas:
- Revisa la consola del navegador (F12 → Console)
- Mira los logs en Firebase Console
- Comprueba que las credenciales sean correctas

¡Bienvenido a POOL con Firebase! 🚀
