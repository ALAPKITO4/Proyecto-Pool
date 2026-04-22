# 📋 Guía Completa: Estructura de Datos del Sistema de Estados

## 🎯 Objetivo

Explicar en detalle cómo funcionan los estados de participantes, cómo se guardan en Firestore y cómo se sincronizan en tiempo real.

---

## 📦 Estructura de Pool en Firestore

### Datos Completamente Actualizados

```javascript
{
  // === IDENTIFICADORES ===
  id: 1700000000,
  createdBy: "Juan García",
  createdByUid: "user_123",
  
  // === INFORMACIÓN BÁSICA ===
  location: "Escuela Primaria",
  date: "2026-04-19",
  startTime: "08:00",
  endTime: "09:00",
  
  // === PARTICIPANTES - ESTRUCTURA NUEVA ===
  participantes: [
    {
      nombre: "Juan García",                    // El creador
      telefono: "351 1234567",
      estado: "aceptado",                      // "pendiente" | "aceptado" | "rechazado"
      acceptedAt: "2026-04-19T08:00:00.000Z",
      rejectedAt: null
    },
    {
      nombre: "María López",                   // Otro padre
      telefono: "351 7654321",
      estado: "aceptado",
      acceptedAt: "2026-04-19T08:15:00.000Z",
      rejectedAt: null
    },
    {
      nombre: "Pedro Martínez",                // Rechazó
      telefono: "351 9999999",
      estado: "rechazado",
      acceptedAt: null,
      rejectedAt: "2026-04-19T08:30:00.000Z"
    },
    {
      nombre: "Laura García",                  // Pendiente aún
      telefono: "",
      estado: "pendiente",
      acceptedAt: null,
      rejectedAt: null
    }
  ],

  // === PARA COMPATIBILIDAD HACIA ATRÁS ===
  participants: ["Juan García", "María López", ...],
  confirmations: { "Juan García": true, ... },
  invitados: ["Laura García", ...],

  // === OTRO DATOS ===
  children: ["Lucas", "Sofía"],
  parents: ["Juan García", "María López", ...],
  driverParent: "Juan García",
  returnParent: "María López",
  creatorName: "Juan García",
  creatorPhone: "351 1234567",
  
  // === TIMESTAMPS ===
  estado: "pendiente",                       // Estado del pool (pendiente/confirmado/cancelado)
  createdAt: "2026-04-19T07:00:00.000Z",
  lastUpdated: "2026-04-19T08:30:00.000Z"
}
```

---

## 🔄 Flujo de Estados

### Cuando Crea el Pool (PASO 1)

```javascript
confirmPool() {
  const newPool = {
    id: Date.now(),
    location: appState.location,
    // ... otros datos ...
    
    // NUEVO: Se crea array participantes
    participantes: [
      // El creador se agrega con estado "aceptado"
      {
        nombre: currentUser.nombre,      // "Juan García"
        telefono: currentUser.telefono,   // "351 1234567"
        estado: "aceptado",              // ← El creador siempre acepta
        acceptedAt: new Date().toISOString()
      },
      
      // Los demás padres se agregan con estado "pendiente"
      {
        nombre: appState.parents[1],     // "María López"
        telefono: "",
        estado: "pendiente",             // ← Esperando respuesta
        acceptedAt: null
      },
      // ... más padres ...
    ],
    
    // Se guarda en Firestore
    createdBy: currentUser.nombre,
    creatorName: currentUser.nombre,
    createdByUid: currentUser.uid
  };
  
  // GUARDAR EN FIRESTORE
  await firebase.firestore()
    .collection('pools')
    .doc(String(newPool.id))
    .set(newPool);
}
```

**Resultado en Firestore:**
```
pools/1700000000 = {
  participantes: [
    { nombre: "Juan", estado: "aceptado", acceptedAt: "2026-04-19T08:00:00Z" },
    { nombre: "María", estado: "pendiente", acceptedAt: null }
  ]
}
```

---

### Cuando Abre Invitación (PASO 2)

```javascript
checkForSharedPool() {
  // 1. Se obtiene el pool desde la URL o Firestore
  const event = await PoolStorage.getPoolById(poolId);
  
  // 2. Se muestra Step-10 (pantalla de invitación)
  goToStep(10);
  
  // 3. SE ACTIVA SINCRONIZACIÓN EN TIEMPO REAL ← IMPORTANTE
  subscribeToPoolUpdates(poolId);
}

function subscribeToPoolUpdates(poolId) {
  const poolRef = firebase.firestore()
    .collection('pools')
    .doc(String(poolId));
  
  // onSnapshot escucha cambios en tiempo real
  const unsubscribe = poolRef.onSnapshot((doc) => {
    const event = doc.data();
    
    // Se actualiza el pool local
    poolsEvents = poolsEvents.map(e => 
      e.id === poolId ? event : e
    );
    
    // Console: muestra participantes actuales
    console.log('📊 Participantes: ' + 
      event.participantes
        .map(p => `${p.nombre}(${p.estado})`)
        .join(', ')
    );
  });
}
```

**Estado en Cliente:**
```javascript
poolsEvents[0] = {
  id: 1700000000,
  participantes: [
    { nombre: "Juan", estado: "aceptado" },
    { nombre: "María", estado: "pendiente" }  ← Escuchando cambios
  ]
}
```

---

### Cuando Acepta (PASO 3)

```javascript
async function acceptPoolInvitation() {
  const poolId = appState.poolId;  // "1700000000"
  const event = poolsEvents.find(e => e.id == poolId);
  
  // 1. Buscar al usuario en participantes
  let found = false;
  event.participantes = event.participantes.map(p => {
    if (isNameMatch(p.nombre, currentUser.nombre)) {  // "María López"
      
      // 2. Cambiar estado a "aceptado"
      p.estado = "aceptado";
      p.acceptedAt = new Date().toISOString();
      found = true;
    }
    return p;
  });
  
  // 3. GUARDAR EN FIRESTORE ← CRÍTICO
  const poolRef = firebase.firestore()
    .collection('pools')
    .doc(String(poolId));
  
  await poolRef.update({
    participantes: event.participantes,  // ← Actualizar array
    lastUpdated: new Date().toISOString()
  });
  
  // 4. Mostrar resumen en Console
  showParticipantsSummary(poolId);
}
```

**En Firestore ANTES:**
```
participantes: [
  { nombre: "Juan", estado: "aceptado" },
  { nombre: "María", estado: "pendiente" }
]
```

**En Firestore DESPUÉS:**
```
participantes: [
  { nombre: "Juan", estado: "aceptado" },
  { nombre: "María", estado: "aceptado" }    ← CAMBIÓ!
]
```

**Resumen mostrado en Console:**
```
📊 RESUMEN DE PARTICIPANTES - Pool: Escuela
   ✅ Aceptados: 2/2
   ⏳ Pendientes: 0/2
   ❌ Rechazados: 0/2
```

---

### Cuando el Creador Está Mirando (PASO 4)

```javascript
// El creador tiene Step-11 abierto
showPoolDetails(1700000000) {
  const event = poolsEvents.find(e => e.id === 1700000000);
  
  // onSnapshot se DISPARA automáticamente cuando Firestore cambia
  const unsubscribe = poolRef.onSnapshot((doc) => {
    // Doc.data() tiene los datos NUEVOS
    event = doc.data();
    
    // Se actualiza poolsEvents
    poolsEvents = poolsEvents.map(e => 
      e.id === 1700000000 ? event : e
    );
    
    // Se reinderiza Step-11
    renderPoolDetails(event);
    
    console.log('🔄 Pool actualizado en tiempo real');
  });
}

function renderPoolDetails(event) {
  const html = event.participantes
    .map(p => {
      let badge = '';
      if (p.estado === 'aceptado') {
        badge = '✅ Aceptado';
      } else if (p.estado === 'rechazado') {
        badge = '❌ Rechazado';
      } else {
        badge = '⏳ Pendiente';
      }
      
      return `<div>${p.nombre} ${badge}</div>`;
    })
    .join('');
  
  document.getElementById('participantsList').innerHTML = html;
}
```

**UI Actualizada AUTOMÁTICAMENTE:**
```
Participantes
━━━━━━━━━━━━━━━━━━━━━
Juan García                    ✅ Aceptado
María López                    ✅ Aceptado   ← CAMBIÓ AQUÍ!
```

---

### Cuando Rechaza (PASO 5)

```javascript
async function rejectPoolInvitation() {
  const poolId = appState.poolId;  // "1700000000"
  const event = poolsEvents.find(e => e.id == poolId);
  
  if (!event || !event.participantes) {
    console.warn('Pool no encontrado');
    return;
  }
  
  // 1. Buscar participante
  event.participantes.forEach(p => {
    if (isNameMatch(p.nombre, currentUser.nombre)) {  // "Pedro Martínez"
      
      // 2. Cambiar estado a "rechazado"
      p.estado = "rechazado";
      p.rejectedAt = new Date().toISOString();
    }
  });
  
  // 3. GUARDAR EN FIRESTORE
  const poolRef = firebase.firestore()
    .collection('pools')
    .doc(String(poolId));
  
  await poolRef.update({
    participantes: event.participantes,
    lastUpdated: new Date().toISOString()
  });
  
  // 4. Mostrar resumen
  showParticipantsSummary(poolId);
}
```

**En Firestore:**
```
participantes: [
  { nombre: "Juan", estado: "aceptado" },
  { nombre: "María", estado: "aceptado" },
  { nombre: "Pedro", estado: "rechazado" }    ← RECHAZO GUARDADO
]
```

---

## 🔍 Campos Importantes

### Estado de Participante

| Campo | Tipo | Ejemplo | Significado |
|-------|------|---------|------------|
| `nombre` | String | "María López" | Nombre del participante |
| `telefono` | String | "351 7654321" | Teléfono para WhatsApp |
| `estado` | String enum | "aceptado" | `"pendiente"` \| `"aceptado"` \| `"rechazado"` |
| `acceptedAt` | ISO String | "2026-04-19T08:15:00.000Z" | Cuándo aceptó |
| `rejectedAt` | ISO String | "2026-04-19T08:30:00.000Z" | Cuándo rechazó |

---

## 📊 Ejemplo Completo de Pool en Firestore

### Pool Creado
```json
{
  "id": 1700000000,
  "location": "Escuela Primaria",
  "date": "2026-04-19",
  "startTime": "08:00",
  "endTime": "09:00",
  "createdBy": "Juan García",
  "creatorName": "Juan García",
  "createdByUid": "user_juan_123",
  "parents": ["Juan García", "María López", "Pedro Martínez", "Laura García"],
  "children": ["Lucas (Juan)", "Sofía (María)", "Tomás (Pedro)", "Emma (Laura)"],
  "driverParent": "Juan García",
  "returnParent": "María López",
  "participantes": [
    {
      "nombre": "Juan García",
      "telefono": "351 1234567",
      "estado": "aceptado",
      "acceptedAt": "2026-04-19T08:00:00.000Z",
      "rejectedAt": null
    },
    {
      "nombre": "María López",
      "telefono": "351 7654321",
      "estado": "pendiente",
      "acceptedAt": null,
      "rejectedAt": null
    },
    {
      "nombre": "Pedro Martínez",
      "telefono": "351 9876543",
      "estado": "pendiente",
      "acceptedAt": null,
      "rejectedAt": null
    },
    {
      "nombre": "Laura García",
      "telefono": "",
      "estado": "pendiente",
      "acceptedAt": null,
      "rejectedAt": null
    }
  ],
  "estado": "pendiente",
  "createdAt": "2026-04-19T07:30:00.000Z",
  "lastUpdated": "2026-04-19T07:30:00.000Z"
}
```

### Después de Aceptación de María
```json
{
  "...": "...",
  "participantes": [
    {
      "nombre": "Juan García",
      "estado": "aceptado",
      "acceptedAt": "2026-04-19T08:00:00.000Z"
    },
    {
      "nombre": "María López",
      "estado": "aceptado",         // ← CAMBIÓ DE pendiente A aceptado
      "acceptedAt": "2026-04-19T08:15:00.000Z"  // ← Registra cuándo
    },
    {
      "nombre": "Pedro Martínez",
      "estado": "pendiente"
    },
    {
      "nombre": "Laura García",
      "estado": "pendiente"
    }
  ],
  "lastUpdated": "2026-04-19T08:15:00.000Z"  // ← Actualizado
}
```

### Después de Rechazo de Pedro
```json
{
  "...": "...",
  "participantes": [
    {
      "nombre": "Juan García",
      "estado": "aceptado",
      "acceptedAt": "2026-04-19T08:00:00.000Z"
    },
    {
      "nombre": "María López",
      "estado": "aceptado",
      "acceptedAt": "2026-04-19T08:15:00.000Z"
    },
    {
      "nombre": "Pedro Martínez",
      "estado": "rechazado",        // ← CAMBIÓ DE pendiente A rechazado
      "rejectedAt": "2026-04-19T08:25:00.000Z"  // ← Registra cuándo
    },
    {
      "nombre": "Laura García",
      "estado": "pendiente"
    }
  ],
  "lastUpdated": "2026-04-19T08:25:00.000Z"
}
```

---

## 🧪 Pruebas Técnicas

### Test 1: Cambios se guardan

```javascript
// Abrir Console en ambos navegadores
// Navegador 1 (Creador)
showPoolDetails(1700000000);
// Console: onSnapshot escuchando...

// Navegador 2 (Invitado)
document.getElementById('acceptBtn').click();
// ESPERAR 2 segundos

// Navegador 1 - DEBERÍA VER
// 🔄 Pool actualizado en tiempo real: Escuela
// María López está ahora con ✅ Aceptado
```

### Test 2: Timestamps se registran

```javascript
// En Console de Navegador 1
const pool = poolsEvents[0];
pool.participantes.forEach(p => {
  console.log(
    `${p.nombre}: ${p.estado} - ` +
    `Aceptado: ${p.acceptedAt}, Rechazado: ${p.rejectedAt}`
  );
});

// Output esperado
// María López: aceptado - Aceptado: 2026-04-19T08:15:00.000Z, Rechazado: null
// Pedro Martínez: rechazado - Aceptado: null, Rechazado: 2026-04-19T08:25:00.000Z
```

### Test 3: Se sincroniza en Firestore

```javascript
// En Firebase Console
// pools/1700000000 → participantes array
// ✅ Verificar que los cambios estén en Firebase
// ✅ Verificar que lastUpdated se actualiza
// ✅ Verificar que timestamps están presentes
```

---

## 🎯 Resumen

| Acción | Qué Pasa | Dónde Se Guarda | Quién Lo Ve |
|--------|----------|-----------------|------------|
| Crear pool | Se crea `participantes` con creador "aceptado" | Firestore | Creador y Invitados |
| Abrir invitación | Se activa `onSnapshot` para sincronización | Memory + Listeners | Invitado |
| Aceptar | Estado cambia a "aceptado", se guarda en Firestore | Firestore | Todos (en tiempo real) |
| Rechazar | Estado cambia a "rechazado", se guarda en Firestore | Firestore | Todos (en tiempo real) |
| El creador mira | Ve cambios AUTOMÁTICOS vía onSnapshot | No necesita refrescar | Creador |

---

**Versión:** 2.0 - Estructura de Estados
**Fecha:** 19 de Abril de 2026
