# 📋 CHEAT SHEET - POOL Firebase Integration

**Referencia rápida de 1 página**

---

## 🚀 Quick Start (5 minutos)

```bash
# 1. Abrir app
http://localhost:3000

# 2. No necesita configuración para funcionar
# (fallback a localStorage automático)

# 3. OPCIONAL: Configurar Firebase
# Ver: FIREBASE_SETUP.md
```

---

## 🔥 Firebase Setup

```bash
1. firebase.google.com → Crear Proyecto
2. Activar: Firestore + Authentication (Google)
3. Copiar credenciales web
4. Editar: firebase-config.js
5. Reemplazar 6 valores:
   - apiKey
   - authDomain
   - projectId
   - storageBucket
   - messagingSenderId
   - appId
6. Guardar
7. Listo ✅
```

---

## 📁 Archivos Nuevos

| Archivo | Qué Hace |
|---------|----------|
| `firebase-config.js` | Credenciales (USER LLENAR) |
| `firestore-wrapper.js` | Abstracción de datos |
| `firebase-auth-ui.js` | Google Sign-In |
| `FIREBASE_SETUP.md` | Instrucciones paso a paso |
| `START_HERE.md` | Guía de activación |
| `RESUMEN_FASE1.md` | Documentación |
| `PROXIMAS_FASES.md` | Fases 2-8 |

---

## 🎯 Funcionalidades Nuevas

```
✨ Google Sign-In (Step-0)
   → Botón "Iniciar sesión con Google"

✨ Logout (Step-1)
   → Botón "🚪 Salir" si autenticado

✨ Guardar en Firebase
   → Pool se guarda en Firestore + localStorage

✨ Fallback Automático
   → Si Firebase falla → localStorage
   → App nunca se rompe
```

---

## 🧪 Testing

```javascript
// Abre consola (F12) y busca:

✅ "Firebase inicializado correctamente"
✅ "firestore-wrapper.js cargado"
✅ "firebase-auth-ui.js cargado"

Si ves estos logs → ¡Firebase funciona!
```

---

## 🐛 Debugging

| Problema | Solución |
|----------|----------|
| Google button no aparece | Actualiza la página (Ctrl+F5) |
| "Firebase no disponible" | Credenciales no configuradas (OK - usa localStorage) |
| Pool no aparece en Firebase | Verifica: ¿Autenticado? ¿Firestore habilitado? |
| Error en consola | Copia error → busca en FIREBASE_SETUP.md |

---

## 📊 Estado Actual

```
Funcionalidad          | Estado
-----------------------|--------
Google Sign-In         | ✅ HECHO
Guardar en Firebase    | ✅ HECHO
Fallback localStorage  | ✅ HECHO
Cargar desde Firebase  | 🔄 Fase 2
Listeners en vivo      | 🔄 Fase 3
Confirmaciones reales  | 🔄 Fase 4
Ubicación GPS          | 🔄 Fase 5
Estados de viaje       | 🔄 Fase 6
```

---

## 💾 Estructura Firestore

```
pools/
├── pool_id_1234567
│   ├── id: 1234567
│   ├── date: "2026-04-18"
│   ├── children: ["Juan", "María"]
│   ├── parents: ["Padre1", "Padre2"]
│   ├── location: "Escuela"
│   ├── estado: "pendiente"
│   ├── invitados: [
│   │   { nombre, telefono, estado }
│   │]
│   └── ...más campos

users/
├── uid_user_1
│   ├── uid: uid_user_1
│   ├── nombre: "Juan"
│   ├── email: "juan@example.com"
│   ├── telefono: "351 1234567"
│   └── foto: base64 (opcional)
```

---

## 🔐 Reglas Firestore

```
Publicadas en Firebase Console:

✅ Solo participantes pueden leer pool
✅ Solo creador puede escribir
✅ Cada usuario solo modifica su perfil
✅ Seguro y eficiente
```

---

## 🚀 Próximos Pasos

### Inmediato
```
1. Leer RESUMEN_FASE1.md (5 min)
2. Configurar Firebase (10 min)
3. Probar app (5 min)
```

### Recomendado (Fases 2-4)
```
Tiempo: 2 horas
Resultado: Multi-dispositivo genuino
Paso: Implementar Fase 2-3-4
```

---

## 📞 Links

| Recurso | Link |
|---------|------|
| Documentación | START_HERE.md |
| Setup Firebase | FIREBASE_SETUP.md |
| Cambios técnicos | FASE1_CAMBIOS.md |
| Roadmap | PROXIMAS_FASES.md |
| Resumen | RESUMEN_FASE1.md |

---

## 💡 Comandos Útiles (Consola)

```javascript
// Ver si Firebase está activo
FIREBASE_ENABLED  // true/false

// Ver usuario autenticado
authState.isAuthenticated  // true/false
authState.email

// Ver referencia a Firestore
window.db

// Guardar pool manualmente
PoolStorage.savePool(poolEvent)

// Cargar todos los pools
PoolStorage.getAllPools()

// Cargar perfil
UserStorage.getUser()
```

---

## 🎯 Resumen

```
ANTES: ❌ Solo localStorage
AHORA: ✅ Firebase + localStorage
DESPUÉS (Fase 2-4): ✅ Multi-dispositivo real

TIEMPO CONFIGURACIÓN: 15 minutos
COSTO: $0 (Firebase Spark gratis)
COMPLEJIDAD: Baja (fallback automático)
RESULTADO: App escalable lista para producción
```

---

## ❓ Una Pregunta Rápida

**¿Quieres que implemente Fases 2-4 ahora?**

✅ Sí → 2 horas más de trabajo → App completa  
❌ No → Esperar feedback del usuario

Mi recomendación: **Sí** 🚀

---

*POOL v2.0 - Fase 1 Completa*  
*Síguete: START_HERE.md*
