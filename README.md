# 🚌 POOL - App de Coordinación de Transporte de Niños

Una aplicación web moderna para coordinar transporte de niños entre padres. Sin backend, sin costos, 100% funcional.

---

## 🎯 ¿Qué es POOL?

POOL resuelve el problema común de coordinación:

- **Crear pools**: Define quién lleva y quién trae a los niños
- **Compartir**: Invita a otros padres mediante link
- **Confirmar**: Recibe confirmaciones en tiempo real
- **Rastrear**: Sabe si los niños llegaron o están en camino

---

## ✨ Características

✅ **Creación de Pools**
- Selecciona niños, padres, roles (lleva/trae)
- Define lugar, fecha y horario
- Sistema de confirmación integrado

✅ **Invitaciones por Link**
- Genera link único para cada pool
- Funciona en cualquier dispositivo
- Incluye datos del pool en la URL (sin backend)

✅ **Sistema de Usuario**
- Perfil con nombre, teléfono y foto
- Identificación automática en pools
- Persistencia en localStorage

✅ **Compartir por WhatsApp**
- Mensaje automático con detalles del pool
- Link directo a la invitación
- Compatible con web y móvil

✅ **Responsive**
- Funciona en desktop, tablet y móvil
- Optimizado para Chrome móvil
- Interfaz intuitiva y accesible

---

## 🚀 Cómo Usar (LOCAL)

### Opción 1: Abrir Directamente
```
1. Abre el archivo index.html en tu navegador
2. Eso es todo - ¡la app funciona!
```

### Opción 2: Con Servidor Local (Recomendado)
```bash
# Con Python
python -m http.server 3000

# Con Node.js
npx http-server -p 3000

# Acceder desde: http://localhost:3000
```

---

## 🌐 Deploy en GitHub Pages (RECOMENDADO)

Haz tu app accesible desde cualquier navegador, **sin costo**.

### Pasos Rápidos:

1. **Crear repositorio en GitHub** (público)
2. **Subir archivos**:
   - `index.html`
   - `styles.css`
   - `script.js`
3. **Activar Pages**:
   - Settings → Pages → Branch: main
4. **Acceder desde**:
   ```
   https://tu_usuario.github.io/pool/
   ```

**Ver [DEPLOY_GITHUB_PAGES.md](DEPLOY_GITHUB_PAGES.md) para instrucciones detalladas.**

---

## � Firebase - Sincronización Multi-Dispositivo (BETA)

### ¿Qué es?

POOL ahora soporta **Firebase** (servicio de Google) para:
- ✅ Datos sincronizados entre dispositivos
- ✅ Autenticación real con Google
- ✅ Base de datos en la nube (Firestore)
- ✅ **Completamente GRATIS** (plan Spark)

### Cómo Habilitar Firebase

1. **Crear proyecto en Firebase** (gratuito en [firebase.google.com](https://firebase.google.com))
2. **Obtener credenciales web**
3. **Reemplazar valores en `firebase-config.js`**
4. **Listo** - La app sincroniza automáticamente

### ⚠️ Importante

- **Sin Firebase**: La app usa localStorage (funciona perfectamente)
- **Con Firebase**: Los datos se guardan en la nube
- **Fallback automático**: Si Firebase falla, vuelve a localStorage

### Instrucciones Detalladas

👉 **Ver [FIREBASE_SETUP.md](FIREBASE_SETUP.md)** para configuración paso a paso

---

## 📦 Archivos Incluidos

```
pool/
├── index.html                # Estructura HTML (10 pantallas)
├── styles.css                # Diseño responsive (~900 líneas)
├── script.js                 # Lógica completa (~1700 líneas)
├── firebase-config.js        # 🔥 Config de Firebase (necesita credenciales)
├── firestore-wrapper.js      # 🔥 Abstracción de Firestore
├── firebase-auth-ui.js       # 🔥 Autenticación Google
├── DEPLOY_GITHUB_PAGES.md    # Instrucciones de deploy
├── FIREBASE_SETUP.md         # 🔥 Setup de Firebase
├── FASE1_CAMBIOS.md          # Documentación de cambios
├── .gitignore                # Para subir a GitHub
└── README.md                 # Este archivo
```

---

## ⚙️ Tecnología

- **Frontend**: HTML5 + CSS3 + JavaScript ES6+
- **Storage**: localStorage (sin backend)
- **Hosting**: GitHub Pages (gratis) o servidor local
- **Compatibilidad**: Chrome, Firefox, Safari (desktop y móvil)

---

## 🧠 Arquitectura

### Pantallas (Steps)

| Paso | Nombre | Función |
|------|--------|---------|
| 0 | Crear Perfil | Datos del usuario (nombre, teléfono, foto) |
| 1 | Menú Principal | Crear o ver pools |
| 2 | Niños | Agregar niños que participan |
| 3 | Padres | Agregar padres participantes |
| 4 | Roles | Asignar quién lleva y trae |
| 5 | Ubicación | Lugar de destino |
| 6 | Fecha/Hora | Cuándo ocurre el pool |
| 7 | Resumen | Verificar datos antes de confirmar |
| 8 | Confirmación | Pool creado exitosamente |
| 9 | Mis Pools | Lista de pools creados |
| 10 | Invitación | Ver pool compartido e invitación |

### Flujo de Datos

```
usuario (Step 0)
    ↓
crear pool (Steps 2-7)
    ↓
confirmar (Step 8)
    ↓
generar link + compartir por WhatsApp
    ↓
otro usuario abre link (Step 10)
    ↓
aceptar/rechazar invitación
    ↓
actualizar estado del pool
```

---

## ⚠️ Limitaciones

### Sin Backend
- **localStorage local**: Cada dispositivo tiene datos separados
- **No sincronización real**: Los cambios en un dispositivo NO afectan a otros
- **Workaround**: Se incluyen datos en el URL para compartir entre dispositivos

### Solución Temporal
- Al generar link: `?poolId=123&pool=ENCODED_JSON`
- El receptor puede ver el pool sin tener que estar en el mismo dispositivo
- Datos limitados por tamaño de URL

### Upgrade Futuro
Para sincronización real, se requeriría:
- Backend (Node.js, Python, etc.)
- Base de datos (MongoDB, PostgreSQL, etc.)
- Servidor pago (Heroku, Render, AWS, etc.)

---

## 🎨 Diseño

### Paleta de Colores
- **Primario**: #FF6B35 (Naranja)
- **Secundario**: #004E89 (Azul)
- **Éxito**: #4CAF50 (Verde)
- **Error**: #F44336 (Rojo)
- **Advertencia**: #FF9800 (Naranja claro)

### Tipografía
- Fuente: Inter (Google Fonts)
- Responsive: Adapta a cualquier pantalla

---

## 📱 Uso Móvil

La app está completamente optimizada para móvil:

✅ Botones grandes y fáciles de tocar
✅ Formularios adaptados a pantallas pequeñas
✅ Sin scroll horizontal innecesario
✅ Teclado numérico para teléfono
✅ Compatible con WhatsApp

### Para Compartir Desde Móvil

1. Crea el pool en tu celular
2. Haz click en "Invitar por WhatsApp"
3. Se abre WhatsApp con el mensaje + link
4. Comparte con el grupo o contacto
5. Otros abren el link y aceptan/rechazan

---

## 🧪 Testing

### Casos de Uso

**Caso 1: Un Dispositivo (Mismo Navegador)**
```
1. Crear usuario (Step 0)
2. Crear pool (Steps 2-7)
3. Copiar link de invitación
4. Abrir en incógnito
5. Aceptar invitación
→ Pool se actualiza localmente
```

**Caso 2: Multi-Dispositivo (Simulado)**
```
1. Crear pool en dispositivo A
2. Copiar link completo (con &pool=...)
3. Abrir en dispositivo B
4. Crear usuario en B
5. Aceptar invitación
→ Se muestra confirmación local en B
```

---

## 🐛 Solución de Problemas

### "¿Por qué no veo confirmaciones del otro usuario?"

Porque no hay backend. Cada dispositivo tiene su propio localStorage.
Workaround: El otro usuario debe estar en el mismo dispositivo o navegador.

### "Los datos se borran al refrescar"

No, están en localStorage. Si se borraron, verificar:
- ¿Mode incógnito? (localStorage no persiste en incógnito)
- ¿Borró caché? (Ver Settings → Storage)

### "El link no abre en otro dispositivo"

Usar la URL completa que incluye `&pool=ENCODED_JSON`.
La app lo genera automáticamente.

---

## 📞 Uso Rápido

```bash
# 1. Descargar/clonar repo
git clone https://github.com/usuario/pool.git

# 2. Entrar a la carpeta
cd pool

# 3. Abrir en navegador
# Opción A: Doble click en index.html
# Opción B: Servidor local
python -m http.server 3000

# 4. Acceder
http://localhost:3000
```

---

## 🚀 Roadmap (8 Fases a Producción)

### ✅ Fase 1: Firebase Integration - COMPLETADA
- ✅ Firebase SDK integrado
- ✅ Google Sign-In implementado
- ✅ Firestore wrapper funcional
- ✅ Auto-fallback a localStorage

**Documentación**: [FASE1_CAMBIOS.md](FASE1_CAMBIOS.md)

### ✅ Fase 2: Sincronización Básica - COMPLETADA
- ✅ Cargar pools de Firestore (multi-dispositivo básico)
- ✅ Invitaciones resuelven desde Firestore
- ✅ Confirmaciones guardadas en nube
- ✅ Fallback automático a localStorage

**Documentación**: [FASE2_CAMBIOS.md](FASE2_CAMBIOS.md) | [FASE2_TESTING.md](FASE2_TESTING.md)

### 🔄 Fase 3: Listeners en Tiempo Real - PENDIENTE
- [ ] Escuchar cambios con onSnapshot()
- [ ] Actualizar UI en tiempo real
- [ ] Notificar cuando otros confirman
- [ ] Confirmaciones con UIDs

### ✅ Fase 4: Confirmaciones Reales - COMPLETADA
- ✅ Guardar UIDs de Firebase
- ✅ Ver "Usuario X confirmó a las 8:30am"
- ✅ Timestamps ISO con formato legible
- ✅ Sección visual en Step-9

**Documentación**: [FASE4_CAMBIOS.md](FASE4_CAMBIOS.md) | [FASE4_TESTING.md](FASE4_TESTING.md)

### 🔄 Fase 5: Ubicación Compartida
- [ ] Geolocalización (GPS)
- [ ] Guardar ubicación en Firestore
- [ ] Mostrar ubicación en mapa
- [ ] Actualizar en tiempo real

### 🔄 Fase 6: Estados del Viaje
- [ ] "En camino", "Llegó", "Esperando"
- [ ] Timeline de eventos
- [ ] Notificaciones automáticas

### 🔄 Fase 7: Notificaciones
- [ ] Alertas de confirmación
- [ ] Reminders antes de horario
- [ ] Cambios de último minuto

### 🔄 Fase 8: Push Notifications
- [ ] Notificaciones en móvil
- [ ] Servicio de background
- [ ] Badge de app

**Próximas Mejoras (Post-Fase 8)**:
- [ ] Integración con Google Calendar
- [ ] Historial completo de pools
- [ ] Sistema de puntuación/confiabilidad
- [ ] Analytics

---

## 📄 Licencia

Código abierto y gratuito. Úsalo como desees.

---

## 🙏 Créditos

Desarrollado como MVP para resolver problema real de coordinación de transporte.

**¡Que disfrutes usando POOL! 🚌**


## ✨ Efectos Principales

### 1. Efecto Ripple
Un efecto de onda que se expande desde el centro del botón

### 2. Partículas Flotantes
20 partículas con colores aleatorios que se dispersan en todas direcciones

### 3. Círculos Giratorios
3 círculos que rotan a diferentes velocidades y direcciones

### 4. Sonido Interactivo
Produce un sonido único que cambia de frecuencia con cada clic

### 5. Animación de Tarjeta
La tarjeta se comprime y rota al hacer clic

## 🌐 Navegadores Compatibles

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 💡 Personalización

Puedes modificar fácilmente:

1. **Colores**: Cambia las variables CSS en la sección `:root` de `styles.css`
2. **Velocidad de animaciones**: Ajusta los valores de `animation-duration`
3. **Cantidad de partículas**: Modifica el número en `createParticles()` en `script.js`
4. **Sonido**: Ajusta la frecuencia en `playSound()`

## 📝 Nota

Este proyecto es completamente gratuito y no requiere dependencias externas.
¡Disfruta de las animaciones! 🎉
