# 🧪 TESTING FASE 4: Confirmaciones Reales

## ✅ Requisitos Previos

- [ ] Fase 2 y 3 funcionando (Firestore + sincronización)
- [ ] 2 navegadores o 2 dispositivos
- [ ] Console abierta (F12)
- [ ] Firebase configurado (FIREBASE_SETUP.md)

---

## 🚀 Test 1: Crear Pool y Ver Confirmación del Creador

### Objetivo
Verificar que el creador aparece en la sección de confirmaciones reales.

### Pasos

1. **Crear Pool:**
   ```
   a) Step-2: Agregar niños ["Juan"]
   b) Step-3: Agregar papás ["Mamá", "Papá"]
   c) Step-4: Roles (Mamá lleva, Papá trae)
   d) Step-5: Ubicación "Escuela"
   e) Step-6: Fecha/Hora (hoy 8:00 AM - 5:00 PM)
   f) Step-7: Revisar y confirmar
   ```

2. **Verificar Confirmación en Step-9:**
   ```
   a) Ir a Step-9 (Ver mis Pools)
   b) Buscar el card del pool "Escuela"
   c) VER sección nueva:
      ✅ Confirmaciones Reales (Fase 4)
      Mamá confirmó hoy a las X:XX AM
   d) Si aparece = ✅ PASO
   e) Si NO aparece = ❌ FALLA
   ```

3. **Validación:**
   ```
   ESPERADO:
   ✅ Nombre correcto (Mamá)
   ✅ Formato de hora: "hoy a las 10:30 AM"
   ✅ Timestamp ISO en Firestore
   ```

### Troubleshooting

| Problema | Solución |
|----------|----------|
| No ves sección de confirmaciones | Verificar que formatConfirmationTime() exista en Console |
| Hora incorrecta | Timezone local vs UTC - revisar new Date().toLocaleTimeString() |
| confirmations map vacío | Verificar que confirmationMap se crea en confirmPool() |

---

## 🚀 Test 2: Aceptar Invitación y Ver Confirmación de Otro Usuario

### Objetivo
Verificar que confirmaciones de otros usuarios aparecen con UID y timestamp.

### Pasos

1. **Dispositivo A (Creador):**
   ```
   a) Crear pool "Test Confirmaciones"
   b) Step-8: Copiar link
   c) Step-9: Anotar la hora de creación (ej: 10:30 AM)
   ```

2. **Dispositivo B (Invitado - Navegador Incógnito):**
   ```
   a) Abrir link en NAVEGADOR DIFERENTE
   b) Crear nuevo usuario (otro email/nombre)
      - Nombre: "Papá"
      - Este nombre debe estar en la lista de invitados
   c) Step-10: Aceptar
   d) Verificar en Console:
      ✅ "Papá confirmó a las X:XX AM"
   ```

3. **Dispositivo A (Recargar):**
   ```
   a) Ir a Step-9 (Ver mis Pools)
   b) Buscar el pool "Test Confirmaciones"
   c) Buscar sección "✅ Confirmaciones Reales"
   d) Debe verse:
      Mamá confirmó hoy a las 10:30 AM
      Papá confirmó hoy a las 10:32 AM
   e) Si ves ambas = ✅ PASO
   ```

4. **Validación:**
   ```
   ESPERADO:
   ✅ 2 confirmaciones visibles
   ✅ Mamá con timestamp más antiguo
   ✅ Papá con timestamp más reciente
   ✅ Ambas en formato "hoy a las X:XX AM"
   ```

### Logs en Console

```javascript
// Dispositivo B al aceptar:
✅ Papá confirmó a las 10:32:15

// Firestore debe contener:
confirmations: {
    'uid_123': {nombre: 'Mamá', ...},
    'uid_456': {nombre: 'Papá', ...}
}
```

---

## 🚀 Test 3: Múltiples Confirmaciones con Diferentes Horarios

### Objetivo
Verificar que múltiples confirmaciones se muestran correctamente ordenadas.

### Pasos

1. **Dispositivo A (Creador):**
   ```
   Crear pool con 3 papás:
   - Mamá
   - Papá
   - Tía
   ```

2. **Dispositivo B (Papá - 10:30 AM):**
   ```
   - Abrir link
   - Aceptar
   - Console: ✅ "Papá confirmó a las 10:30 AM"
   ```

3. **Dispositivo C (Tía - 10:35 AM):**
   ```
   - Abrir link (esperar 5 minutos)
   - Aceptar
   - Console: ✅ "Tía confirmó a las 10:35 AM"
   ```

4. **Dispositivo A (Recargar):**
   ```
   Step-9 debe mostrar:
   ✅ Confirmaciones Reales
   - Mamá confirmó hoy a las 10:25 AM (creadora)
   - Papá confirmó hoy a las 10:30 AM
   - Tía confirmó hoy a las 10:35 AM
   
   Validación:
   ✅ 3 confirmaciones
   ✅ Ordenadas cronológicamente
   ✅ Timestamps diferentes
   ```

### Validación

```
ESPERADO:
✅ Todas las confirmaciones visibles
✅ Cada una con nombre y hora
✅ Timestamps reflejan el orden real
✅ Sin duplicados
```

---

## 🚀 Test 4: Confirmaciones sin Firebase (Fallback)

### Objetivo
Verificar que confirmaciones funcionan con UIDs locales sin Firebase.

### Pasos

1. **Desactivar Firebase:**
   ```
   a) DevTools (F12) → Network
   b) Throttle: Offline
   c) O comentar firebase-config.js línea 1-10
   ```

2. **Crear Pool:**
   ```
   a) Crear pool con 2 papás
   b) Ir a Step-9
   c) Buscar confirmaciones:
      ✅ "Tu Nombre confirmó hoy a las X:XX AM"
   ```

3. **Aceptar desde Otro Navegador (Sin Firebase):**
   ```
   a) Incógnito: Crear nuevo usuario
   b) Aceptar invitación
   c) Console debe mostrar:
      ✅ "Otro Nombre confirmó a las X:XX AM"
   ```

4. **Validación:**
   ```
   ESPERADO:
   ✅ Confirmaciones funcionan sin Firebase
   ✅ UIDs son 'anonymous' o locales
   ✅ Pero nombres y horas se muestran bien
   ✅ Timestamps ISO generados correctamente
   ```

### Logs Esperados

```javascript
// Sin Firebase:
⚠️ Firebase no disponible
✅ Juan confirmó a las 10:30 AM
```

---

## 🚀 Test 5: Confirmaciones Multi-Dispositivo Real

### Objetivo
Simular 3 usuarios en 3 dispositivos confirmando un pool.

### Escenario

```
DISPOSITIVO 1 (Laptop - Mamá):
- Crea pool "Escuela mañana"
- Lleva: Mamá, Trae: Papá

DISPOSITIVO 2 (iPhone - Papá):
- Recibe link por WhatsApp
- Abre
- Ve invitación
- Acepta

DISPOSITIVO 3 (iPad - Abuela):
- Recibe link por email
- Abre
- Ve invitación
- Acepta

DISPOSITIVO 1 (Actualizar):
- Step-9: Ve 3 confirmaciones:
  ✅ Mamá confirmó hoy a las 8:00 AM
  ✅ Papá confirmó hoy a las 8:05 AM
  ✅ Abuela confirmó hoy a las 8:10 AM
```

### Pasos

1. **Dispositivo 1 (Mamá - Laptop):**
   ```
   Crear pool con:
   - Niños: ["Juan"]
   - Papás: ["Mamá", "Papá", "Abuela"]
   Confirmar y copiar link
   ```

2. **Dispositivo 2 (Papá - iPhone):**
   ```
   - Abrir link
   - Crear perfil: "Papá"
   - Aceptar
   - Console: ✅ "Papá confirmó"
   ```

3. **Dispositivo 3 (Abuela - iPad):**
   ```
   - Abrir link
   - Crear perfil: "Abuela"
   - Aceptar
   - Console: ✅ "Abuela confirmó"
   ```

4. **Dispositivo 1 (Volver):**
   ```
   - Ir a Step-9
   - Verificar:
     ✅ "✅ Confirmaciones Reales"
     ✅ Mamá, Papá, Abuela en orden
     ✅ Cada una con timestamp
   ```

### Validación

```
ESPERADO:
✅ 3 confirmaciones visibles
✅ Timestamps reflejan orden de aceptación
✅ Nombres correctos
✅ Persistencia en Firestore
✅ Sin errores en Console
```

---

## 📊 Tabla de Resultados

```markdown
| Test | Dispositivo A | Dispositivo B | Console | UI | Estado |
|------|--------------|--------------|---------|----|----|
| 1: Creador | Pool creado ✅ | N/A | confirmationMap ✅ | Sección visible ✅ | ✅ |
| 2: Otro Usuario | Pool esperando | Acepta ✅ | "X confirmó" ✅ | 2 confirmaciones ✅ | ✅ |
| 3: Múltiples | Pool 3 papás | 2 aceptan | Cada uno log ✅ | 3 en orden ✅ | ✅ |
| 4: Sin Firebase | Offline ✅ | Offline ✅ | Anónimo ✅ | Funciona ✅ | ✅ |
| 5: Multi-Device | Laptop ✅ | iPhone ✅ iPad ✅ | 3 logs ✅ | 3 confirmaciones ✅ | ✅ |
```

---

## ✅ Checklist Final

- [ ] Test 1: Confirmación del creador visible
- [ ] Test 2: Confirmación de otro usuario visible
- [ ] Test 3: Múltiples confirmaciones en orden
- [ ] Test 4: Funciona sin Firebase (fallback)
- [ ] Test 5: Multi-dispositivo funciona
- [ ] Cero errores en Console
- [ ] Timestamps en formato correcto
- [ ] Nombres correctos
- [ ] Persistencia en Firestore + localStorage

---

## 🎯 Si Todo Sale Bien ✅

- ✅ Fase 4 validada
- ✅ Confirmaciones reales funcionan
- ✅ UIDs y timestamps guardados
- ✅ UI clara y legible
- ✅ Multi-dispositivo funcional
- 🚀 **Listo para Fase 5: Ubicación Compartida**

---

## ❌ Si Algo Falla

1. **No ves sección de confirmaciones**
   - Verificar: `if (event.confirmations && Object.keys(...)`
   - Buscar: `formatConfirmationTime` en Console

2. **Timestamps incorrectos**
   - Revisar timezone del navegador
   - new Date().toLocaleTimeString('es-ES') debe dar hora local

3. **UIDs no se guardan**
   - Verificar: `currentUser.uid` existe
   - Fallback a 'anonymous'

4. **No persiste en Firestore**
   - Revisar: PoolStorage.savePool() llamado
   - Verificar reglas de seguridad en console.firebase.google.com

---

¡Suerte en los tests! 🚀

Próximo: [FASE5_TESTING.md](FASE5_TESTING.md) - Ubicación Compartida
