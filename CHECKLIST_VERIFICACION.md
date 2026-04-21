# ✅ CHECKLIST DE VERIFICACIÓN - FIREBASE FIX

## Verificación Previa (Antes de probar)

### Archivos Modificados
- [ ] `firestore-wrapper.js` - Línea 32: `{ merge: true }` agregado
- [ ] `index.html` - Líneas 600-607: Removidas (duplicadas)
- [ ] `script.js` - Línea ~1983: Nueva función `subscribeToPoolUpdates()`
- [ ] `script.js` - Línea 2626: `loadPoolsEvents()` ahora async
- [ ] `script.js` - Línea 2083: `subscribeToPoolUpdates()` llamada en `showPoolDetails()`

### Archivos Documentación Creados
- [ ] `FIREBASE_FIX_RESUMEN.md` - Documentación técnica
- [ ] `VERIFICACION_RAPIDA.md` - Guía de pruebas
- [ ] `RESUMEN_EJECUTIVO.md` - Resumen para stakeholders

---

## 🧪 Test 1: Verificar Firebase Conectado

### En la Consola (F12)
```javascript
// Ejecutar este comando:
DEBUG_showStatus()

// Verificar que muestre:
✅ 🔥 FIREBASE
   Habilitado: ✅ Sí
   Conectado: ✅ Sí
   Auth: ✅ Sí
   Usuario autenticado: (puede ser ⚠️ si no iniciaste sesión)
```

**Checklist:**
- [ ] Consola no muestra errores en rojo (❌)
- [ ] Firebase Habilitado: ✅ Sí
- [ ] Firebase Conectado: ✅ Sí
- [ ] window.db existe y es accesible
- [ ] Pools se muestran en DEBUG_showStatus()

---

## 🧪 Test 2: Crear Pool (Dispositivo A)

### Paso 1: Crear Perfil
- [ ] Abrir `index.html`
- [ ] Ingreso de nombre: "Carlos"
- [ ] Ingreso de teléfono: "351-1234567"
- [ ] Click: "Continuar"
- [ ] Ir a Step-1 (inicio)

### Paso 2: Crear Pool
- [ ] Click: "➕ Crear nuevo pool"
- [ ] Step-2: Agregar niño "Juan"
- [ ] Step-3: Agregar padres "Carlos" y "María"
- [ ] Step-4: Lleva = "Carlos", Trae = "María"
- [ ] Step-5: Ubicación = "Escuela"
- [ ] Step-6: Fecha (cualquiera), Hora: 08:00 - 17:00
- [ ] Step-7: Click "Confirmar"
- [ ] Step-8: Aparece confirmación
- [ ] **VERIFICACIÓN:**
  - [ ] Consola muestra: "✅ Pool guardado en Firebase con { merge: true }"
  - [ ] Consola muestra: "✅ localStorage actualizado"
  - [ ] Pool se ve en "Ver mis pools"

### Paso 3: Abrir Detalles (Dispositivo A en Step-11)
- [ ] Click en pool creado → Step-11
- [ ] **VERIFICACIÓN:**
  - [ ] Consola muestra: "📡 Iniciando listener para pool [ID]"
  - [ ] Consola muestra: "✅ Listener activo para pool [ID]"
  - [ ] En Firestore Console puedo ver el pool: pools/[ID]

---

## 🧪 Test 3: Aceptar Invitación (Dispositivo B)

### Preparación: 2 Navegadores Lado a Lado
- [ ] Navegador 1: Dispositivo A (Carlos) con Step-11 abierto
- [ ] Navegador 2: Dispositivo B vacío (para invitado)
- [ ] Ambas consolas abiertas (F12)

### Paso 1: Copiar Link en Dispositivo A
- [ ] En Dispositivo A, copiar URL del navegador (con ?poolId=...)
- [ ] Ejemplo: `http://localhost:...?poolId=1234&pool={...}`

### Paso 2: Abrir Link en Dispositivo B
- [ ] Pegar URL en Dispositivo B
- [ ] Debe aparecer Step-10 (invitación)
- [ ] **VERIFICACIÓN:**
  - [ ] Se muestra: "Invitado por: Carlos"
  - [ ] Se muestra: ubicación, fecha, hora, niños, roles
  - [ ] Consola B muestra: "✅ Pool encontrado..."

### Paso 3: Aceptar en Dispositivo B
- [ ] Crear perfil en B: nombre "María", teléfono diferente
- [ ] Click: "✅ Aceptar invitación"
- [ ] **VERIFICACIÓN INMEDIATA (Dispositivo B):**
  - [ ] Consola muestra: "📝 ACEPTANDO INVITACIÓN"
  - [ ] Consola muestra: "✅ Pool encontrado: Escuela"
  - [ ] Consola muestra: "✅ Guardando en Firestore..."
  - [ ] Consola muestra: "✅ localStorage actualizado"
  - [ ] Consola muestra: "✅ ACEPTACIÓN COMPLETADA"
  - [ ] Navega a Step-11 (detalles)

### Paso 4: Verificar Sincronización (Dispositivo A)
- [ ] **ESPERAR 2-3 SEGUNDOS**
- [ ] Consola A debe mostrar:
  - [ ] "🔄 ACTUALIZACIÓN EN TIEMPO REAL"
  - [ ] "   Pool: Escuela"
  - [ ] "   ✅ Array local actualizado"
  - [ ] "📊 ESTADO DE PARTICIPANTES:"
  - [ ] "   ✅ Aceptados: 2"
  - [ ] "   ⏳ Pendientes: 0"
  - [ ] "   ✅ Carlos(aceptado) - aceptado"
  - [ ] "   ✅ María(aceptado) - aceptado"
- [ ] **UI debe actualizar:**
  - [ ] Badge "✅ Aceptado" aparece junto a María
  - [ ] Participantes están en color verde
  - [ ] NO hay necesidad de recargar la página

---

## 🧪 Test 4: Rechazar Invitación (Opcional)

### Paso 1: Nueva Invitación
- [ ] Dispositivo A: Crear otro pool con nuevo invitado "Roberto"
- [ ] Copiar link

### Paso 2: Rechazar en Dispositivo B
- [ ] Dispositivo B: Pegar link, cambiar perfil a "Roberto"
- [ ] Click: "❌ Rechazar"
- [ ] **VERIFICACIÓN:**
  - [ ] Consola B: "🚫 RECHAZANDO INVITACIÓN"
  - [ ] Dispositivo B vuelve a Step-1
  - [ ] Si Dispositivo A tiene Step-11 abierto:
    - [ ] Consola A: "🔄 ACTUALIZACIÓN EN TIEMPO REAL"
    - [ ] Badge: "❌ Rechazado" junto a Roberto

---

## 🔍 Test 5: Verificar Firestore (Firebase Console)

### Acceder a Firebase Console
- [ ] Ir a: https://console.firebase.google.com
- [ ] Proyecto: "pool-909a8"
- [ ] Firestore Database

### Verificar Colección "pools"
- [ ] Debe haber documento con ID del pool
- [ ] Debe tener estructura:
  ```
  {
    id: 1234,
    location: "Escuela",
    participantes: [
      { nombre: "Carlos", estado: "aceptado", ... },
      { nombre: "María", estado: "aceptado", ... }
    ],
    lastUpdated: "2026-04-20T...",
    ...
  }
  ```
- [ ] `lastUpdated` debe ser reciente (hace segundos)

### Verificar Que `{ merge: true }` Funciona
- [ ] Abrir documento en Firestore
- [ ] Editar manualmente algún campo (ej: cambiar ubicación)
- [ ] En app, hacer que invitado acepte nuevamente
- [ ] **VERIFICACIÓN:**
  - [ ] Firestore NO perdió el cambio de ubicación
  - [ ] Campo `participantes` se actualizó correctamente
  - [ ] Otros campos se mantuvieron intactos

---

## 📊 Test 6: Múltiples Dispositivos/Navegadores

### Preparación
- [ ] Abrir en 3 navegadores diferentes (Chrome, Firefox, Safari)
- [ ] O en 3 dispositivos (PC, Tablet, Phone)

### Test
- [ ] Dispositivo 1: Crear pool
- [ ] Dispositivo 2: Abrir link y aceptar
- [ ] Dispositivo 3: Abrir link y rechazar
- [ ] Todos verán cambios en tiempo real (sin recargar)

### Verificación
- [ ] ✅ Sincronización funciona entre navegadores
- [ ] ✅ Sincronización funciona entre dispositivos
- [ ] ✅ Sin necesidad de recargar páginas
- [ ] ✅ localStorage tiene datos de respaldo

---

## 🐛 Troubleshooting Si Algo Falla

### ❌ Consola muestra error de Firebase
```
Error: "Firebase SDK no cargó correctamente"

Solución:
1. Verificar que <script> tags en index.html están presentes
2. Revisar que firebase-config.js tiene credenciales correctas
3. Recargar página (Ctrl+Shift+R)
```

### ❌ { merge: true } no funciona
```
Error: "TypeError: set is not a function"

Solución:
1. Verificar firestore-wrapper.js línea 32
2. Asegurar que tiene paréntesis correctos: set({...}, { merge: true })
3. Recargar app
```

### ❌ Sincronización en tiempo real no funciona
```
Error: "onSnapshot no dispara"

Solución:
1. Verificar: DEBUG_showStatus() → Firebase Conectado ✅
2. Verificar que Step-11 está abierto (listener solo activo allí)
3. Verificar Firestore Console que documento existe
4. Esperar 2-3 segundos después de cambio
```

### ❌ Participantes no se ven actualizados
```
Error: "Participante muestra estado viejo"

Solución:
1. Abrir Firestore Console
2. Verificar que `participantes[x].estado` es "aceptado"
3. Si en Firestore está actualizado pero en UI no:
   - Recargar Step-11
   - Cerrar listener: window._poolUnsubscribers[poolId]()
   - Abrir detalles nuevamente
```

---

## 📋 Resumen Final

### ✅ Si Todo Está Verde (Pasa todos los tests)

```
✅ Firebase conectado y funcionando
✅ { merge: true } preserva datos
✅ subscribeToPoolUpdates() activo
✅ onSnapshot notifica cambios
✅ UI se actualiza en tiempo real
✅ Múltiples dispositivos sincronizados
✅ localStorage como backup
✅ Fallback automático

🎉 ¡SISTEMA LISTO PARA PRODUCCIÓN!
```

### ⚠️ Si Algo Falla

1. Consulta [VERIFICACION_RAPIDA.md](VERIFICACION_RAPIDA.md)
2. Consulta [FIREBASE_FIX_RESUMEN.md](FIREBASE_FIX_RESUMEN.md)
3. Revisa la sección "Troubleshooting" arriba
4. Ejecuta `DEBUG_showStatus()` en consola

---

**Fecha de Verificación:** ___________  
**Estado:** ☐ Pendiente ☐ En Pruebas ☐ ✅ Pasó Todos  
**Notas:** _____________________________________________________________

