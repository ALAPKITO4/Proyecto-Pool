# 🚀 GUÍA DE IMPLEMENTACIÓN - HARDENING DE SEGURIDAD

**Status:** ✅ Cambios Aplicados - Listo para Deploy

---

## 📋 CHECKLIST - Antes de Deploy

### ✅ Paso 1: Verificar Cambios en Código

```bash
# Revisar que los archivos fueron modificados correctamente
```

**Archivos modificados:**

1. ✅ `firestore.rules` - Reglas de acceso actualizado
2. ✅ `script.js` - 5 funciones mejoradas
3. ✅ `firestore-wrapper.js` - Validación de UID

**Validar en consola:**
```javascript
// Debe mostrar UID, NO 'anonymous'
DEBUG_showStatus()
// Buscar: "UID: (string largo)"
```

---

## 🔐 Paso 2: Actualizar Firestore Rules

**Ubicación:** Firebase Console → Firestore Database → Rules

1. Ir a: https://console.firebase.google.com/project/pool-909a8/firestore/rules
2. Copiar contenido de [firestore.rules](../firestore.rules)
3. Publicar cambios
4. Verificar que se publicó correctamente

**Verificación:**
```javascript
// En consola del navegador
console.log(window.db); // Debe retornar DB con reglas nuevas
```

---

## 🧪 Paso 3: Testing de Seguridad

### Test 1: Crear Pool (Debe funcionar)

```javascript
// Crear una pool normalmente
// 1. Step 0: Crear perfil
// 2. Step 1-6: Llenar datos
// 3. Step 7: Confirmar

// Verificar en Firestore Console:
// - createdByUid = UID real (no 'anonymous')
// - invitedUids = [] (vacío inicialmente)
// - participantUids = [tu_uid]
```

### Test 2: Aceptar Invitación (Debe validar UID)

```javascript
// 1. Abrir el link de invitación en navegador diferente (o incógnito)
// 2. Crear perfil diferente
// 3. Hacer click en "Aceptar"

// Verificar en console:
console.log('🔐 CONTROL DE ACCESO:');
console.log('   - isCreator:', false);
console.log('   - isParticipantByUid:', true);  // Debe ser true después de aceptar
```

### Test 3: Intentar Ver Pool Sin Acceso (Debe rechazar)

```javascript
// 1. Obtener poolId de una pool de otro usuario
// 2. Llamar: showPoolDetails(poolId) en consola

// Resultado esperado:
// ❌ "ACCESO DENEGADO - Usuario no tiene permiso"
```

### Test 4: Modificar localStorage (No debe funcionar)

```javascript
// 1. En consola:
const pools = JSON.parse(localStorage.getItem('pool_events'));
pools[0].invitados[0].nombre = "TuNombre"; // Cambiar nombre
localStorage.setItem('pool_events', JSON.stringify(pools));

// 2. Aceptar invitación → DEBE FALLAR
// 3. Porque Firestore valida que UID esté en invitedUids (no nombre)
```

---

## 📊 Paso 4: Validar Firestore Rules

**En Firestore Console → Rules:**

```javascript
// Verificar que estas validaciones existan:

✅ allow create: if request.auth.uid == request.resource.data.createdByUid
✅ allow read: if request.auth.uid in resource.data.invitedUids
✅ request.resource.data.createdByUid != 'anonymous'
✅ request.resource.data.invitados is list
```

**Probar reglas en Firestore Console:**

```json
// Test: Crear pool como usuario A
{
  "createdByUid": "uid_de_usuario_A",
  "createdBy": "Juan",
  "invitados": [],
  "participantes": [],
  "invitedUids": [],
  "participantUids": ["uid_de_usuario_A"],
  "estado": "pendiente"
}

// ✅ Debe pasar (uid_de_usuario_A == auth.uid)

// Test 2: Intentar crear como user A con createdByUid de user B
{
  "createdByUid": "uid_de_usuario_B",  // ❌ No coincide con auth.uid
  ...
}

// ❌ Debe fallar
```

---

## 🔍 Paso 5: Verificar en Producción

**Pasos después de deploy:**

1. **En GitHub Pages:**
   - Verificar que la app funciona normal
   - Crear una pool
   - Compartir link
   - Otro usuario acepta

2. **En Firestore Console:**
   - Ver que se guardó correctamente
   - Verificar UIDs están presentes
   - No hay 'anonymous'

3. **En Console del navegador:**
   ```javascript
   // Debe retornar valores con UID
   DEBUG_showStatus()
   
   // Búscar:
   // UID: (una cadena larga, no 'anonymous')
   ```

---

## ⚠️ Troubleshooting

### Problema: "Error: User must be authenticated for Firestore"

**Solución:**
```javascript
// El usuario NO está autenticado
// 1. Verificar que Firebase Auth está inicializado
console.log(window.auth); // Debe retornar auth object

// 2. Hacer login
isUserAuthenticated(); // Debe retornar true

// 3. Si sigue fallando, usar localStorage
FIREBASE_ENABLED = false;
```

### Problema: "ACCESO DENEGADO - Usuario no tiene permiso"

**Esperado si:**
- Intentas ver pool de otro usuario
- No aceptaste invitación

**Solución:**
- Aceptar invitación correctamente
- O ser creador de la pool

### Problema: Firestore rules no se actualizaron

**Solución:**
```bash
# 1. Verificar en Firebase Console que se publicaron
# 2. Recargar página (Ctrl+Shift+R)
# 3. Verificar versión de reglas:
console.log(window.db._settings.host); // Debe mostrar firestore
```

---

## 📈 Monitoreo Post-Deploy

**En Firebase Console:**

1. **Firestore → Quotas:**
   - Verificar que no hay muchos "writes denied" por reglas
   - Si hay, revisar logs

2. **Firestore → Metrics:**
   - Latencia de lecturas
   - Rate limit: debe estar bajo

3. **Firestore → Usage:**
   - Operaciones por tipo
   - Datos almacenados

---

## 🔄 Rollback (Si algo falla)

**Revertir a reglas antiguas (solo si es emergencia):**

```javascript
// En Firebase Console → Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /pools/{poolId} {
      allow read, write: if request.auth != null;
    }
  }
}

// ⚠️ NOTA: Esto REDUCE seguridad
// Solo usar como fallback temporal
```

---

## ✅ Verificación Final

Después de deploy, verificar esto en consola:

```javascript
// 1. Mostrar estado completo
DEBUG_showStatus()

// 2. Crear pool (debe tener UID real)
// 3. Ver que en Firestore:
//    - createdByUid = UID real
//    - participantUids = [UID]
//    - invitedUids = []

// 4. Compartir link
// 5. Otro usuario acepta
// 6. Ver que en Firestore:
//    - participantUids ahora tiene el UID del aceptante
//    - invitedUids tiene el UID del aceptante

// 7. Intentar acceso sin permiso (debe fallar)
```

---

## 📞 Soporte

**Si algo no funciona:**

1. Revisar console del navegador (F12)
2. Buscar errores en Firestore logs
3. Verificar que:
   - ✅ Firebase está inicializado
   - ✅ Usuario está autenticado (currentUser.uid existe)
   - ✅ Firestore rules están publicadas
   - ✅ URLs tienen poolId correcto

---

**Status:** ✅ LISTO PARA DEPLOY

**Próximas mejoras:** Implementar Cloud Functions para validación adicional (Fase 6)
