# 🧪 Guía Completa de Testing - Sistema de Estados de Participantes

## ✅ Versión: 2.0 - Testing Validación

---

## 📋 Pre-requisitos de Test

✅ **Antes de empezar:**
- Abrir **Consola (F12)** en ambos navegadores
- Tener Firebase Firestore funcionando
- Tener dos navegadores o pestañas distintas (o incógnito)
- Usuario A: Creador
- Usuario B: Invitado que aceptará
- Usuario C (opcional): Invitado que rechazará

---

## 🧪 TEST 1: Crear Pool con Participantes

### Paso 1: Usuario A crea pool

**En Usuario A (Navegador 1):**

1. Click en "Crear Pool"
2. Completar formulario:
   - Ubicación: "Escuela Primaria"
   - Niños: "Lucas"
   - Padres: Agregar "María López" y "Pedro Martínez"
   - Conductor ida: "Usuario A"
   - Conductor vuelta: "María López"
3. Click "Confirmar Pool"

**Verificar Console (Navegador 1):**
```
✅ Pool creado correctamente
📦 Datos del pool incluidos en URL
🔔 Pool guardado en localStorage
📡 Guardando en Firestore...
✅ Pool guardado en Firestore
📊 RESUMEN DE PARTICIPANTES - Pool: Escuela Primaria
   ✅ Aceptados: 1/3
   ⏳ Pendientes: 2/3
   ❌ Rechazados: 0/3
   Participantes: Usuario A(aceptado), María López(pendiente), Pedro(pendiente)
```

**Verificar Firestore:**
```
pools/[poolId] {
  participantes: [
    { nombre: "Usuario A", estado: "aceptado", acceptedAt: "2026-04-19T..." },
    { nombre: "María López", estado: "pendiente", acceptedAt: null },
    { nombre: "Pedro Martínez", estado: "pendiente", acceptedAt: null }
  ]
}
```

**✅ TEST 1 PASADO** si:
- ✅ Aparece "Aceptados: 1/3"
- ✅ Firestore tiene `participantes` array
- ✅ Creador tiene `acceptedAt` timestamp

---

## 🧪 TEST 2: Aceptar desde Usuario B

### Paso 1: Copiar URL de invitación

**En Usuario A (Navegador 1):**
1. Click "Compartir Pool" o copiar URL actual
2. URL debería verse así:
```
https://app.poolapp.com?poolId=1700000000&poolData=eyJ...
```

### Paso 2: Usuario B abre invitación

**En Usuario B (Navegador 2):**
1. Pegar URL en navegador nuevo (o incógnito)
2. Debería ver Step-10 (pantalla de invitación)
3. Ver datos del pool

**Verificar Console (Navegador 2):**
```
🔍 Buscando pool: 1700000000
📦 Pool encontrado en URL
🔄 Subscribiendo a actualizaciones del pool: 1700000000
✅ Sincronización en tiempo real activa
```

### Paso 3: Usuario B Acepta

**En Usuario B (Navegador 2):**
1. Ver Step-10 con botones
2. Click en "✅ Aceptar"

**Verificar Console (Navegador 2):**
```
📝 Aceptando invitación - PoolId: 1700000000 Usuario: María López
✅ Pool encontrado: Escuela Primaria
✅ Encontrado participante: María López
📡 Guardando en Firestore...
✅ Guardado en Firestore - Participantes actualizados
📊 RESUMEN DE PARTICIPANTES - Pool: Escuela Primaria
   ✅ Aceptados: 2/3
   ⏳ Pendientes: 1/3
   ❌ Rechazados: 0/3
   Participantes: Usuario A(aceptado), María López(aceptado), Pedro(pendiente)
```

**Verificar Firestore (desde Firebase Console):**
```
participantes[1] {
  nombre: "María López",
  estado: "aceptado",                    // ← CAMBIÓ
  acceptedAt: "2026-04-19T10:45:00.000Z" // ← TIMESTAMP NUEVO
}
```

### Paso 4: Usuario A Ve Cambio AUTOMÁTICO

**En Usuario A (Navegador 1) - IMPORTANTE: Sin hacer nada**

**Si Usuario A está en Step-11 (Detalles del Pool):**
```
Debería ver AUTOMÁTICAMENTE:

Participantes
━━━━━━━━━━━━━━━━━━━━━
Usuario A                      ✅ Aceptado
María López                    ✅ Aceptado   ← APARECIÓ!
Pedro Martínez                 ⏳ Pendiente
```

**Console de Usuario A (Navegador 1):**
```
🔄 Pool actualizado en tiempo real: Escuela Primaria
📊 Participantes: Usuario A(aceptado), María López(aceptado), Pedro(pendiente)
🔄 Actualizando UI del pool
```

**✅ TEST 2 PASADO** si:
- ✅ María aparece con "✅ Aceptado"
- ✅ El cambio apareció AUTOMÁTICO sin recargar
- ✅ Console muestra "Pool actualizado en tiempo real"
- ✅ Firestore tiene `estado: "aceptado"` y timestamp

---

## 🧪 TEST 3: Rechazar desde Usuario C

### Paso 1: Usuario C abre invitación

**En Usuario C (Navegador 3 o incógnito):**
1. Usar URL del pool creado por Usuario A
2. Debería ver Step-10

**Verificar Console (Navegador 3):**
```
🔍 Buscando pool: 1700000000
✅ Sincronización en tiempo real activa
```

### Paso 2: Usuario C Rechaza

**En Usuario C (Navegador 3):**
1. Click en "❌ Rechazar"

**Verificar Console (Navegador 3):**
```
🚫 Rechazando invitación - PoolId: 1700000000 Usuario: Pedro
❌ Cambiando estado a rechazado: Pedro
📡 Guardando rechazo en Firestore...
✅ Rechazo guardado en Firestore
📊 RESUMEN DE PARTICIPANTES - Pool: Escuela Primaria
   ✅ Aceptados: 2/3
   ⏳ Pendientes: 0/3
   ❌ Rechazados: 1/3
   Participantes: Usuario A(aceptado), María López(aceptado), Pedro(rechazado)
```

### Paso 3: Usuario A Ve Cambio

**En Usuario A (Navegador 1):**

**Si aún tiene Step-11 abierto, verá:**
```
Participantes
━━━━━━━━━━━━━━━━━━━━━
Usuario A                      ✅ Aceptado
María López                    ✅ Aceptado
Pedro Martínez                 ❌ Rechazado   ← CAMBIÓ!
```

**Console de Usuario A:**
```
🔄 Pool actualizado en tiempo real: Escuela Primaria
📊 Participantes: Usuario A(aceptado), María López(aceptado), Pedro(rechazado)
🔄 Actualizando UI del pool
```

**✅ TEST 3 PASADO** si:
- ✅ Pedro aparece con "❌ Rechazado"
- ✅ Firestore tiene `estado: "rechazado"` 
- ✅ Tiene timestamp `rejectedAt`

---

## 🧪 TEST 4: Múltiples Cambios Rápidos

### Paso 1: Usuario A está viendo Step-11

**En Usuario A (Navegador 1):**
- Abrir pool (Step-11) y DEJAR ABIERTO

### Paso 2: Usuario B y C aceptan/rechazan rápido

**En Usuario B (Navegador 2):**
- Abrir invitación
- ESPERAR 2 segundos
- Click "Aceptar"

**En Usuario C (Navegador 3):**
- Mientras B está aceptando, abrir invitación
- ESPERAR
- Click "Rechazar"

### Paso 3: Verificar Sincronización

**En Usuario A (Navegador 1) - SIN HACER NADA:**
- Debería ver cambios aparecer uno tras otro
- Debería ver en Console:
```
🔄 Pool actualizado en tiempo real
🔄 Pool actualizado en tiempo real
🔄 Pool actualizado en tiempo real
```

**✅ TEST 4 PASADO** si:
- ✅ Múltiples cambios se sincronizaron
- ✅ UI se actualizó para cada cambio
- ✅ No hubo necesidad de recargar

---

## 🧪 TEST 5: Persistencia en Firestore

### Paso 1: Anotar Pool ID

**En Console:**
```javascript
console.log(poolsEvents[0].id);
// Resultado: 1700000000
```

### Paso 2: Cerrar todo

**En Navegador 1, 2, 3:**
- Click X en el navegador
- Cerrar completamente

### Paso 3: Reabrír

**Usuario A:**
1. Volver a entrar a la app
2. Ir a "Mis Pools"
3. Abrir el pool 1700000000

**Verificar:**
```
Los datos DEBEN estar:
- María López: ✅ Aceptado (no cambió a Pendiente)
- Pedro Martínez: ❌ Rechazado
```

**✅ TEST 5 PASADO** si:
- ✅ Los datos persistieron después de cerrar
- ✅ Firestore fue la fuente de verdad

---

## 🧪 TEST 6: Casos de Error

### Caso 6A: Usuario no registrado en pool

**Setup:**
- Usuario D que no está en `participantes`
- Abre URL de pool

**Pasos:**
1. Usuario D abre URL de invitación
2. Usuario D click "Aceptar"

**Verificar Console:**
```
⚠️ Tu nombre no está en la lista
```

**✅ TEST 6A PASADO** si:
- ✅ Se muestra error apropiado
- ✅ No se guarda nada en Firestore

### Caso 6B: Pool no encontrado

**Setup:**
- URL con poolId inválido

**Pasos:**
1. Ir a: `?poolId=999999999`
2. Click "Aceptar"

**Verificar Console:**
```
⚠️ Pool no encontrado
```

**✅ TEST 6B PASADO** si:
- ✅ Mensaje de error
- ✅ No crashea la app

---

## 📊 Checklist de Validación

### Aceptar

- [ ] El participante aparece en Console con estado "aceptado"
- [ ] Firestore tiene `estado: "aceptado"`
- [ ] Firestore tiene timestamp `acceptedAt`
- [ ] El creador ve cambio AUTOMÁTICO
- [ ] La UI muestra "✅ Aceptado"

### Rechazar

- [ ] El participante aparece con estado "rechazado"
- [ ] Firestore tiene `estado: "rechazado"`
- [ ] Firestore tiene timestamp `rejectedAt`
- [ ] El creador ve cambio AUTOMÁTICO
- [ ] La UI muestra "❌ Rechazado"

### Sincronización

- [ ] El creador ve cambios SIN recargar página
- [ ] El resumen en Console actualiza automáticamente
- [ ] Múltiples cambios se sincronizan correctamente
- [ ] Los datos persisten después de cerrar

### Errores

- [ ] Mensaje apropiado si usuario no está registrado
- [ ] Mensaje apropiado si pool no existe
- [ ] No hay errores en la Console (rojo)

---

## 🔧 Debugging - Comandos Útiles

### Ver Pool Actual
```javascript
poolsEvents[0]
```

### Ver Participantes
```javascript
poolsEvents[0].participantes
```

### Ver Quién Aceptó
```javascript
poolsEvents[0].participantes.filter(p => p.estado === 'aceptado')
```

### Ver Quién Rechazó
```javascript
poolsEvents[0].participantes.filter(p => p.estado === 'rechazado')
```

### Ver Timestamps
```javascript
poolsEvents[0].participantes.forEach(p => 
  console.log(`${p.nombre}: Aceptado: ${p.acceptedAt}, Rechazado: ${p.rejectedAt}`)
)
```

### Simular Cambio en Firestore
```javascript
// En Console para probar que onSnapshot funciona
const testPool = poolsEvents[0];
testPool.participantes[0].estado = 'rechazado';
firebase.firestore()
  .collection('pools')
  .doc(String(testPool.id))
  .update({ participantes: testPool.participantes })
  .then(() => console.log('✅ Cambio de prueba guardado'));
```

---

## 📈 Métricas de Éxito

| Métrica | Objetivo | ¿Cómo Verificar? |
|---------|----------|-----------------|
| Tiempo de sync | < 2 segundos | Anotar hora de aceptación, medir tiempo en otro navegador |
| Errores | 0 errores en Console | Buscar `❌ Error` en Console |
| Persistencia | 100% de datos guardados | Cerrar y reabrír |
| Usuarios simultáneos | 5+ sin issues | Abrir 5 navegadores |
| Cambios perdidos | 0 cambios perdidos | Verificar Firestore después de cada acción |

---

## 🚀 Casos de Uso Comunes

### Creador Quiere Saber Quién Aceptó

**En Console:**
```javascript
poolsEvents[0].participantes
  .filter(p => p.estado === 'aceptado')
  .map(p => `${p.nombre} (${new Date(p.acceptedAt).toLocaleString()})`)
  .forEach(x => console.log(x))

// Output:
// Usuario A (19/4/2026 10:00:00)
// María López (19/4/2026 10:15:00)
```

### Resumen Visual en Console
```javascript
showParticipantsSummary(poolsEvents[0].id)

// Output:
// 📊 RESUMEN DE PARTICIPANTES - Pool: Escuela Primaria
//    ✅ Aceptados: 3/5
//    ⏳ Pendientes: 1/5
//    ❌ Rechazados: 1/5
```

---

## ✅ Resumen

**Cuando está TODO funcionando:**

1. ✅ Creador crea pool
2. ✅ Invitados abren URL
3. ✅ Aceptan/Rechazan
4. ✅ Creador ve cambios AUTOMÁTICOS
5. ✅ Datos en Firestore
6. ✅ Timestamps registrados
7. ✅ Sin recargar página
8. ✅ Sin errores

**Próximo paso:** Ejecutar estos tests y reportar cualquier problema encontrado.

---

**Testing Versión:** 2.0
**Fecha:** 19 de Abril de 2026
