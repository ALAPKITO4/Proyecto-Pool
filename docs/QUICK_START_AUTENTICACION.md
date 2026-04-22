# 🚀 QUICK START - Autenticación Segura

## ¡Haz esto AHORA para que funcione!

---

## 📋 5 Pasos Obligatorios (5 minutos)

### PASO 1: Actualizar Reglas de Firestore ⚠️ CRÍTICO

1. Abre: https://console.firebase.google.com
2. Selecciona proyecto: **pool-909a8**
3. Ve a: **Firestore Database** → **Reglas**
4. Borra **TODO** el contenido actual
5. Copia y pega EXACTAMENTE esto:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    match /pools/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    match /users/{uid} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == uid;
      allow update: if request.auth.uid == uid;
      allow delete: if request.auth.uid == uid;
    }
    
  }
}
```

6. Haz click: **Publicar**
7. Espera mensaje azul: "✅ Reglas publicadas"

**⚠️ SIN ESTO NO FUNCIONA NADA**

---

### PASO 2: Verificar Firebase Auth está habilitado

1. En Firebase Console
2. Ve a: **Authentication** → **Get Started**
3. Debe haber una sección con "Sign-in methods"
4. Verifica que estén habilitados:
   - ✅ Email/Password
   - ✅ Google
   - ✅ Apple

Si alguno está deshabilitado:
- Haz click en el método
- Haz click "Habilitar"
- Guarda

---

### PASO 3: Recargar la App

1. Cierra todas las pestañas de la app
2. Abre en una ventana privada (para limpiar cache)
3. Abre: Tu URL de la app
4. Deberías ver el **Step-0 nuevo** con 3 modos

---

### PASO 4: Test Rápido - Email/Password

1. Haz click: **"Registrarse"**
2. Llena:
   - Email: `test@example.com`
   - Usuario: `testuser2024`
   - Contraseña: `Password123!`
3. Acepta términos
4. Haz click: **"Registrarse"**
5. ✅ Debería ir a **Step-1**

### PASO 5: Verificar que funciona

1. En Step-1, haz click en **"📅 Ver mis pools"** (Step-9)
2. Luego haz click en **"➕ Crear nuevo pool"** (Step-2)
3. Completa: 1-2 niños, 1-2 padres, roles, ubicación, fecha/hora
4. Hasta llegar al botón **"Confirmar Pool"** (Step-7)
5. Haz click: **"Crear Pool"**
6. ✅ Debería guardar en Firestore
7. Haz click botón **"🚪 Salir"** (logout)
8. Deberías estar en **Step-0** de nuevo
9. Login nuevamente con `test@example.com` / `Password123!`
10. Ve a **"Ver mis pools"** 
11. ✅ El pool debería estar visible

---

## ✅ Confirmación de Éxito

Si llegaste aquí sin errores:

```
✅ Firestore rules actualizadas
✅ Auth está habilitado
✅ Registro funcionando
✅ Login funcionando
✅ Pools se guardan
✅ Logout funciona
✅ NO está roto nada
```

**¡Listo para usar!**

---

## 🐛 Si algo no funciona

### Error: "No se puede escribir en users collection"

**Causa:** Reglas de Firestore no publicadas
**Solución:**
1. Ve a Firestore → Reglas
2. Verifica que el contenido sea correcto (paso 1 arriba)
3. Haz click "Publicar"
4. Espera mensaje azul ✅
5. Recarga la app

### Error: "Usuario no puede crear cuenta"

**Causa:** Email/Password no habilitado en Firebase
**Solución:**
1. Ve a Firebase → Authentication
2. Haz click "Habilitación de proveedores"
3. Busca "Email/Password"
4. Haz click el icono de lápiz
5. Haz click toggle "Habilitado"
6. Haz click "Guardar"

### Error: "Google/Apple no abre popup"

**Causa:** No estás en HTTPS
**Solución:** 
- Si es localhost → debe funcionar
- Si es GitHub Pages → debe funcionar (es HTTPS)
- Si es otro hosting → debes configurar HTTPS

---

## 🧪 Test en Consola (F12)

Copia y pega en la consola:

```javascript
// Test 1: Firebase habilitado
console.log("Firebase:", FIREBASE_ENABLED);

// Test 2: Está autenticado
console.log("Autenticado:", isUserAuthenticated());

// Test 3: Ver estado
console.log("Auth state:", authState);

// Test 4: Ver usuario
console.log("Current user:", currentUser);

// Test 5: Ver paso actual
console.log("Step actual:", getCurrentStep());
```

Debería mostrar:
- Firebase: true
- Autenticado: true (si estás logged in)
- Auth state: {isAuthenticated: true, uid: "...", email: "...", ...}
- Current user: {uid: "...", nombre: "...", email: "..."}
- Step actual: 1 (si estás en Step-1)

---

## 📞 Problemas Conocidos

| Problema | Causa | Solución |
|----------|-------|----------|
| "Firebase no disponible" | Scripts cargando mal | Recarga F5 |
| "Cannot write to users" | Reglas desactualizadas | Publicar reglas (Paso 1) |
| "Username no disponible" | Ya existe | Usa otro username |
| "Demasiados intentos" | Límite de Firebase | Espera 5 min |
| Google/Apple popup no abre | No HTTPS | Usa HTTPS o localhost |
| Sesión no persiste | Recordarme no activado | Marca checkbox |
| Step-0 no cambia | onAuthStateChanged no disparó | Recarga la página |

---

## 📊 El Flujo Debe Ser Así

```
APP ABRE
    ↓
Step-0 (LOGIN SCREEN)
    ↓
Usuario elige: Email, Google o Apple
    ↓
LOGUEA
    ↓
Step-1 (MENÚ PRINCIPAL) ← DEBE ESTAR AQUÍ AUTOMÁTICAMENTE
    ↓
Puede crear pools, ver pools, etc
    ↓
Haz click "Salir" (logout)
    ↓
Step-0 (LOGIN SCREEN) ← DEBE ESTAR AQUÍ AUTOMÁTICAMENTE
    ↓
[Ciclo repite]
```

Si en algún punto NO llega a where esperaba → hay un error

---

## 🎯 Próximos Pasos (Opcional)

- [ ] Configura Google OAuth (si quieres usarlo en producción)
- [ ] Configura Apple OAuth (si quieres usarlo en producción)
- [ ] Deploy a GitHub Pages o Firebase Hosting
- [ ] Actualiza términos de servicio y privacidad
- [ ] Haz testing en móviles iOS/Android

---

## ⏱️ Tiempo Estimado

- Actualizar reglas: **1 minuto**
- Verificar Firebase: **1 minuto**
- Recargar app: **1 minuto**
- Test rápido: **3 minutos**
- **TOTAL: 6 minutos**

---

## 📝 Documentación Completa

- 📖 [SETUP_AUTENTICACION.md](SETUP_AUTENTICACION.md) - Guía detallada
- 🔧 [CAMBIOS_TECNICOS_DETALLADOS.md](CAMBIOS_TECNICOS_DETALLADOS.md) - Cambios de código
- 💡 [AUTENTICACION_SEGURA_IMPLEMENTADA.md](AUTENTICACION_SEGURA_IMPLEMENTADA.md) - Características

---

## ✅ Checklist Final

- [ ] Firestore rules publicadas
- [ ] Firebase Auth habilitado
- [ ] App recargada
- [ ] Test Email/Password pasó
- [ ] Test crear pool pasó
- [ ] Test logout/login pasó
- [ ] Consola sin errores (❌)

---

**¡Listo!** 🎉

Tu app ahora tiene autenticación segura con Firebase Auth.

**Última actualización:** 21 de abril de 2026
