# 🧪 TESTING FASE 2: Sincronización Básica

## ✅ Requisitos Previos

- [ ] Firebase configurado (ver FIREBASE_SETUP.md)
- [ ] 2 navegadores o 2 dispositivos
- [ ] Console de Firefox/Chrome abierta (F12)
- [ ] Redes estable (para Firestore)

---

## 🚀 Test 1: Cargar Pools desde Firestore

### Objetivo
Verificar que pools creados en un dispositivo se cargan automáticamente en otro.

### Pasos

1. **Dispositivo A (Laptop):**
   ```
   a) Abrir POOL en Chrome
   b) Ir a Step-2: Agregar niños
   c) Crear pool "Test Firestore":
      - Niños: ["Juan", "María"]
      - Papás: ["Mamá", "Papá"]
      - Rol: Papá va y trae
      - Ubicación: Casa
      - Hora: Mañana 8am
      d) Confirmar pool (Step-7)
      e) Buscar en Console:
         ✅ "📝 Pool guardado"
         ✅ "📡 Guardado en Firestore" (si Firebase está OK)
   ```

2. **Dispositivo B (Firefox o Incógnito):**
   ```
   a) Abrir POOL en navegador diferente
   b) Ir a Step-9 (Ver mis Pools)
      - **IMPORTANTE**: Mismo usuario (mismo email/teléfono)
   c) Buscar logs en Console:
      ✅ "📡 Cargados X pools de Firestore"
   d) Verificar que ves el pool "Test Firestore"
      - Si ves 1 pool = ✅ PASO
      - Si ves 0 pools = ❌ FALLA (revisar logs)
   ```

3. **Validación:**
   ```
   RESULTADO ESPERADO:
   ✅ Pool visible en ambos dispositivos
   ✅ Mismo nombre, niños y hora
   ✅ Sin necesidad de compartir URL
   ```

### Troubleshooting

| Problema | Solución |
|----------|----------|
| No ves logs "📡 Cargados" | Firebase no configurado → [FIREBASE_SETUP.md](FIREBASE_SETUP.md) |
| Ves 0 pools en Dispositivo B | No eres el mismo usuario → Usa mismo email |
| Error "Permission denied" | Revisar reglas Firestore en console.firebase.google.com |
| localStorage no se sincroniza | Esto es NORMAL (localStorage es local) |

---

## 🚀 Test 2: Aceptar Invitación desde Firestore

### Objetivo
Verificar que invitaciones se resuelven desde Firestore (no solo URL).

### Pasos

1. **Dispositivo A (Creador):**
   ```
   a) Crear nuevo pool "Invitación Firestore"
   b) Step-7: Confirmado
   c) Step-8: Ver botón "Compartir"
   d) Copiar el link (contiene poolId)
      Ejemplo: https://.../?poolId=abc123
   ```

2. **Dispositivo B (Invitado):**
   ```
   a) Abrir el link en NAVEGADOR DIFERENTE (incógnito/otro dispositivo)
      - OJO: Usar OTRO USUARIO (email diferente)
   b) App carga Step-10 (Invitación)
   c) Buscar en Console:
      ✅ "📡 Pool encontrado en Firestore" (NUEVO - Fase 2)
      O ✅ "📝 Pool desde localStorage"
      O ✅ "🔗 Pool desde URL"
   d) Ver pool en Step-10 con detalles:
      - Niños
      - Papás
      - Hora
   ```

3. **Invitado: Aceptar Invitación**
   ```
   a) Click en "Aceptar" en Step-10
   b) Ver Step-9 (Mis Pools)
   c) Buscar logs:
      ✅ "📡 Confirmación guardada en Firestore" (NUEVO - Fase 2)
      ✅ "💾 Confirmación guardada en localStorage"
   d) Verificar en Step-9 que aparece:
      - Nombre del pool
      - Estado: "Confirmado" o "Esperando otros"
   ```

4. **Validación:**
   ```
   RESULTADO ESPERADO:
   ✅ Step-10 carga invitación desde Firestore
   ✅ Invitado puede aceptar
   ✅ Confirmación se guarda en Firestore
   ✅ Creador ve la confirmación (Fase 3+)
   ```

### Logs a Buscar

```javascript
// En Console de Dispositivo B al abrir link:
📡 Pool encontrado en Firestore ← NUEVO FASE 2

// Al aceptar:
📡 Confirmación guardada en Firestore ← NUEVO FASE 2
💾 Confirmación guardada en localStorage

// En Step-9:
📡 Cargados 1 pools de Firestore
```

---

## 🚀 Test 3: Fallback a localStorage

### Objetivo
Verificar que si Firebase falla, la app sigue funcionando.

### Pasos

1. **Desactivar Firebase:**
   ```
   a) Abrir DevTools (F12)
   b) Ir a Red (Network tab)
   c) Throttle: Offline
      O comentar firebase-config.js línea 1-10
   ```

2. **Crear Pool:**
   ```
   a) Crear nuevo pool "Offline Test"
   b) Confirmar
   c) Buscar logs:
      ✅ "📝 Pool guardado"
      ✅ "⚠️ Firebase no disponible, usando localStorage"
      O ❌ Error de Firebase (normal si desactivamos)
   ```

3. **Ver Pools:**
   ```
   a) Ir a Step-9 (Ver mis Pools)
   b) Buscar logs:
      ✅ "📝 Usando pools de localStorage"
   c) Ver el pool "Offline Test"
   d) Verificar que NO ves logs de Firestore
   ```

4. **Validación:**
   ```
   RESULTADO ESPERADO:
   ✅ App funciona SIN Firebase
   ✅ Pools se guardan en localStorage
   ✅ Pools se cargan de localStorage
   ✅ Cero errores críticos (warnings OK)
   ```

### Logs a Buscar

```javascript
// Sin Firebase:
⚠️ Firebase no disponible, usando localStorage
📝 Usando pools de localStorage
```

---

## 🚀 Test 4: Multi-Dispositivo (Caso Real)

### Objetivo
Simular 2 usuarios usando POOL en diferentes dispositivos.

### Escenario

**Dispositivo 1 (Mamá - Laptop)**
```
1. Autenticarse con: mama@example.com
2. Crear pool:
   - Niños: Ana (4 años)
   - Hora: Mañana 8:00am
3. Ir a Step-8, copiar link
4. Enviar link a Papá por WhatsApp
```

**Dispositivo 2 (Papá - iPhone)**
```
1. Recibir link en WhatsApp
2. Abrir link en Safari
3. VER invitación (desde Firestore, NO URL data)
4. Autenticarse con: papa@example.com
5. Aceptar
6. Buscar logs:
   ✅ "📡 Confirmación guardada en Firestore"
```

**Dispositivo 1 (Mamá - Volver a Laptop)**
```
1. Actualizar Step-9
2. VER confirmación de Papá (Fase 3+)
   O al menos ver que Papá está en "Invitados"
```

### Validación

```
✅ Mamá crea pool en Firestore
✅ Papá recibe link
✅ Papá ve invitación (de Firestore)
✅ Papá acepta
✅ Confirmación en Firestore
✅ Mamá puede ver confirmación
```

---

## 📊 Tabla de Resultados

```markdown
| Test | Dispositivo A | Dispositivo B | Console Logs | Estado |
|------|--------------|--------------|-------------|--------|
| 1: Firestore Load | Pool creado ✅ | Pool visible ✅ | "📡 Cargados" ✅ | ✅ |
| 2: Aceptar Invitación | Link copiado ✅ | Invitación abierta ✅ | "📡 Pool encontrado" ✅ | ✅ |
| | | Aceptado ✅ | "📡 Confirmación guardada" ✅ | ✅ |
| 3: Fallback | Pool offline ✅ | Visible ✅ | "📝 localStorage" ✅ | ✅ |
| 4: Multi-Device | Mamá: Pool ✅ | Papá: Aceptado ✅ | Ambos: Firestore ✅ | ✅ |
```

---

## 🔍 Logs Importantes a Buscar

### En DOMContentLoaded

```
🚀 POOL iniciando...
⚙️ Inicializando Firebase...
✅ Firebase inicializado (o ⚠️ No disponible)
👤 Autenticado: usuario@example.com
📝 Estado cargado de localStorage
✅ POOL listo
```

### En Step-9 (Ver mis Pools)

```
updatePoolsList() llamada
📡 Cargados X pools de Firestore (← FASE 2 NEW)
O ⚠️ Error cargando de Firestore
O 📝 Usando pools de localStorage
```

### En Aceptar Invitación

```
acceptPoolInvitation() llamada
📡 Confirmación guardada en Firestore (← FASE 2 NEW)
O ⚠️ Error guardando en Firestore
💾 Confirmación guardada en localStorage
```

### En checkForSharedPool()

```
checkForSharedPool() llamada
📡 Buscando pool en Firestore... (← FASE 2 NEW)
📡 Pool encontrado en Firestore (← FASE 2 NEW)
O 📝 Buscando en localStorage...
O 🔗 Buscando en URL...
```

---

## ✅ Checklist Final

- [ ] Test 1: Firestore Load - ✅ PASO
- [ ] Test 2: Aceptar Invitación - ✅ PASO
- [ ] Test 3: Fallback - ✅ PASO
- [ ] Test 4: Multi-Device - ✅ PASO
- [ ] Cero errores en Console
- [ ] Logs esperados aparecen
- [ ] No hay breaking changes
- [ ] localStorage sigue funcionando

---

## 🎯 Si Todo Sale Bien ✅

- ✅ Fase 2 validada
- ✅ Sincronización básica funcional
- ✅ Multi-dispositivo funcional
- ✅ Fallback funcionando
- 🚀 **Listo para Fase 3: Listeners en Tiempo Real**

---

## ❌ Si Algo Falla

1. **Revisar Console (F12)**
   - ¿Qué error ves?
   - ¿En qué línea?
   - ¿Qué usuario?

2. **Revisar Firebase Console**
   - https://console.firebase.google.com
   - ¿Datos en Firestore?
   - ¿Reglas de seguridad OK?

3. **Revisar localStorage**
   - DevTools → Application → Local Storage
   - ¿Datos locales presentes?
   - ¿Formato correcto?

4. **Contactar con logs detallados**
   - Screenshot de Console
   - Screenshot de Firestore
   - URL y pasos exactos

---

¡Suerte en los tests! 🚀

Próximo: [FASE3_TESTING.md](FASE3_TESTING.md) - Listeners en Tiempo Real
