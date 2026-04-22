# 🧪 Guía Completa de Prueba del Sistema de Invitaciones

## ⚙️ Pre-requisitos

1. **Dos navegadores abiertos** (o dos pestañas de incógnito)
   - Pestaña 1: Usuario A (creador)
   - Pestaña 2: Usuario B (invitado)

2. **DevTools abierto** en ambos (F12)
   - Console visible para ver logs

3. **Firebase configurado** (opcional)
   - Si tienes `firebase-config.js`, usará Firestore
   - Si no, usará localStorage automáticamente

---

## 📝 Test 1: Crear Pool

### Usuario A (Pestaña 1)

#### Paso 1: Crear Perfil
```
1. Abre index.html
2. Llenar perfil (Step-0):
   - Nombre: "Juan García"
   - Teléfono: "351 1234567"
3. Click "Continuar"
4. Esperar a Step-1 (menú)
```

✅ Esperado:
- Se muestre Step-1 con el nombre "Juan García"

---

#### Paso 2: Crear Pool
```
1. Click "➕ Crear nuevo pool"
2. Step-2 - Agregar niños:
   - Agregar: "Carlos" (4 años)
   - Agregar: "Sofía" (6 años)
   - Click "Continuar"

3. Step-3 - Agregar padres:
   - Agregar: "Juan García"
   - Agregar: "María López"
   - Agregar: "Pedro Martínez"
   - Click "Continuar"

4. Step-4 - Asignar roles:
   - Lleva: "Juan García"
   - Trae: "María López"
   - Click "Continuar"

5. Step-5 - Ubicación:
   - Seleccionar "Escuela" (o escribir una)
   - Click "Continuar"

6. Step-6 - Fecha y horarios:
   - Fecha: Hoy
   - Hora ida: 8:00 AM
   - Hora vuelta: 5:00 PM
   - Click "Continuar"

7. Step-7 - Resumen:
   - Revisar datos
   - Click "Confirmar"

8. Step-8 - Confirmación:
   - ✅ Pool creado
   - Abrir DevTools → Console
   - Buscar log: "✅ Pool creado correctamente"
```

✅ Esperado en Console:
```
📦 Datos del pool incluidos en URL
✅ Pool creado correctamente
```

---

#### Paso 3: Ver Detalles del Pool
```
1. En Step-8, click "Ver todos mis pools"
2. Se abre Step-9 (lista de pools)
3. Ver la pool creada
4. Click en "🔍 Detalles"
5. Se abre Step-11 (detalles del pool)
```

✅ Esperado:
- Pool con estado "⏳ Pendiente"
- Botones nuevos: "📱 Compartir" y "📋 Copiar Link"

---

## 🔗 Test 2: Copiar Link

### Usuario A (Step-11 - Detalles del Pool)

```
1. En Step-11, buscar los botones inferiores
2. Click "📋 Copiar Link"
3. Notificación: "✅ Link copiado al portapapeles"
4. En Console: "✅ Link copiado: http://..."
```

✅ Esperado:
- Link en clipboard listo para compartir
- Formato: `https://... ?poolId=1700000000&pool={...}`

---

## 💬 Test 3: Compartir por WhatsApp

### Usuario A (Step-11 - Detalles del Pool)

```
1. Click "📱 Compartir"
2. Notificación: "📱 Abriendo WhatsApp..."
3. Se abre WhatsApp Web
4. Mensaje debe incluir:
   - Destino: "Escuela"
   - Fecha: Hoy
   - Horarios: 8:00 AM - 5:00 PM
   - Niños: "Carlos, Sofía"
   - Creador: "Juan García"
   - Link de invitación
```

✅ Esperado:
- Mensaje personalizado con todos los datos
- Link clickeable en WhatsApp Web

---

## 👤 Test 4: Usuario B Recibe Invitación

### Usuario B (Pestaña 2)

#### Paso 1: Copiar Link
```
1. En Pestaña 1 (Usuario A), copiar link desde Step-11
   - Click "📋 Copiar Link"
2. En Pestaña 2, pegar en la URL
   - http://localhost:8000/?poolId=...&pool={...}
3. Presionar Enter
```

✅ Esperado:
- Se abre Step-10 (Pantalla de Invitación)
- En Console: "🔍 Buscando pool: 1700000000"
- En Console: "📦 Pool encontrado en URL"

---

#### Paso 2: Crear Perfil en Usuario B
```
1. Step-10 muestra información pero botones están deshabilitados
2. Porque Usuario B aún no tiene perfil
3. Click "✅ Aceptar invitación"
4. Sistema redirige a Step-0 (crear perfil)

5. Llenar perfil en Step-0:
   - Nombre: "María López"
   - Teléfono: "351 7654321"
   - Click "Continuar"
```

✅ Esperado:
- Notificación: "⚠️ Debes completar tu perfil primero"
- Redirige a Step-0

---

#### Paso 3: Aceptar Invitación
```
1. Ahora Usuario B tiene perfil
2. Copy link de invitación nuevamente
3. Pegar en URL de Pestaña 2
4. Se abre Step-10

5. Revisar información:
   - "Invitado por: Juan García" ← DEBE APARECER
   - Destino: "Escuela"
   - Fecha y horarios correctos
   - Niños: "Carlos, Sofía"
   - Roles: "Juan García (ida), María López (vuelta)"
```

✅ Esperado:
- "Invitado por: Juan García" visible
- En Console: "🔄 Subscribiendo a actualizaciones del pool: 1700000000"

---

#### Paso 4: Click en "Aceptar invitación"
```
1. Click "✅ Aceptar invitación"
2. Esperar ~2 segundos
3. Automáticamente abre Step-11 (detalles)
```

✅ Esperado en Console:
```
📝 Aceptando invitación - PoolId: 1700000000
✅ Pool encontrado: Escuela
✅ Usuario encontrado, actualizando status
📡 Guardando en Firestore...  (o 📝 Firebase no disponible)
✅ Guardado en Firestore
✅ Te has unido al pool!
```

---

#### Paso 5: Verificar en Step-11
```
1. Usuario B está en Step-11
2. Revisar sección "👥 Participantes":
   - Debe aparecer "María López (Tú) confirmado"
3. Revisar "Tu participación":
   - Debe decir "Participante" (o el rol si aplica)
4. Ver botones de "📱 Compartir" y "📋 Copiar Link"
```

✅ Esperado:
- Usuario B aparece como participante
- Con timestamp "confirmado"

---

## 🔄 Test 5: Sincronización en Tiempo Real (Firebase)

### Ambos Usuarios (si Firebase está disponible)

#### Paso 1: Setup
```
Usuario A: Step-11 (abierto)
Usuario B: Step-11 (abierto)
```

#### Paso 2: Usuario A realiza acción
```
1. Usuario A: Click "Editar" en Step-9
2. Luego edita algún dato (ej: horario)
3. Guarda cambios
4. Firestore se actualiza
```

#### Paso 3: Usuario B ve cambios
```
1. Sin hacer nada, Usuario B en Step-11
2. En Console aparece:
   "🔄 Pool actualizado en tiempo real: Escuela"
   "🔄 Actualizando UI del pool"
3. Los datos mostrados se actualizan automáticamente
```

✅ Esperado:
- Cambios reflejados en menos de 1 segundo
- Sin necesidad de recargar página

---

## ❌ Test 6: Rechazar Invitación

### Usuario A crea otra pool

```
1. Usuario A: Step-1 → "Crear nuevo pool"
2. Rápidamente llenar todo (datos iguales)
3. Obtener nuevo link
```

### Usuario B rechaza invitación

```
1. Usuario B: Pegar nuevo link en Step-10
2. Ver "Invitado por: Juan García"
3. Click "❌ Rechazar"
4. Notificación: "👋 Invitación rechazada"
5. Automáticamente redirecciona a Step-1
```

✅ Esperado:
- No aparece en "Mis pools" de Usuario B
- Firebase/localStorage NO se modifica
- Vuelve a menú principal

---

## 🧹 Test 7: Botones de Compartir desde Step-11

### Usuario A en Step-11

```
1. Estar en Step-11 (detalles del pool)
2. Bajar hasta los botones de acción
3. Ver nuevos botones:
   - "📱 Compartir" ← Abre WhatsApp
   - "📋 Copiar Link" ← Copia al portapapeles
4. Verificar que funcionan
```

✅ Esperado:
- Botones siempre presentes en Step-11
- Funcionan independientemente de otros botones

---

## 📊 Test 8: Validación de Datos

### Verificar en Console

```
1. Abrir DevTools → Console
2. Buscar logs con emojis:
   📝 = Información
   📡 = Firebase
   ✅ = Éxito
   ❌ = Error
   ⚠️ = Advertencia
   🔄 = Sincronización
   📱 = Compartir
   📋 = Copiar
```

### Verificar en Storage

```
1. Abrir DevTools → Application → Local Storage
2. Buscar: "pool_events"
3. Debe tener un objeto JSON con array de pools
4. Cada pool debe tener:
   - id
   - createdBy / creatorName ← NUEVO
   - creatorPhone ← NUEVO
   - invitados[] con estados
   - confirmations{} ← NUEVO para aceptaciones
```

---

## 🔍 Debugging Común

### Problema: "Pool no encontrado"
**Causa:** Link no incluye datos
**Solución:** Usar "📋 Copiar Link" desde Step-11

### Problema: "Tu nombre no está en la lista"
**Causa:** Nombre en perfil no coincide con invitación
**Solución:** Editar perfil para que coincida exactamente

### Problema: No aparece "Invitado por:"
**Causa:** Campo `creatorName` no guardado
**Solución:** Recrear pool (debe tener nuevos campos)

### Problema: Sincronización no funciona
**Causa:** Firebase no configurado o FIREBASE_ENABLED=false
**Solución:** Revisar firebase-config.js y ver console

### Problema: Link no funciona en móvil
**Causa:** Puede estar incompleto al copiar
**Solución:** Usar "📱 Compartir" directamente a WhatsApp

---

## ✅ Checklist Final

- [ ] Usuario A crea pool correctamente
- [ ] Usuario A puede copiar link
- [ ] Usuario A puede compartir por WhatsApp
- [ ] Usuario B recibe invitación con nombre del creador
- [ ] Usuario B completa perfil
- [ ] Usuario B acepta invitación
- [ ] Usuario B aparece en participantes
- [ ] Sincronización funciona (si Firebase)
- [ ] Usuario B puede rechazar invitación
- [ ] Todos los botones funcionan
- [ ] No hay errores en Console
- [ ] localStorage contiene datos correctos

---

## 📞 Logs a Esperar

### Crear Pool
```
📦 Datos del pool incluidos en URL
✅ Pool creado correctamente
```

### Abrir Invitación
```
🔍 Buscando pool: 1700000000
📦 Pool encontrado en URL
🔄 Subscribiendo a actualizaciones del pool: 1700000000
```

### Aceptar Invitación
```
📝 Aceptando invitación - PoolId: 1700000000
✅ Pool encontrado: Escuela
✅ Usuario encontrado, actualizando status
📡 Guardando en Firestore...
✅ Guardado en Firestore
```

### Rechazar Invitación
```
🚫 Rechazando invitación
👋 Invitación rechazada
```

### Sincronización Real
```
🔄 Pool actualizado en tiempo real: Escuela
🔄 Actualizando UI del pool
```

---

**Documentación de Prueba Completa**
**Fecha:** 19 de Abril de 2026
