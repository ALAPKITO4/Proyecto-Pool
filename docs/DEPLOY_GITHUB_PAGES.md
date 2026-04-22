# 🚀 Guía de Deploy - POOL App en GitHub Pages

## Requisitos
- Cuenta de GitHub (gratis)
- Git instalado (opcional, se puede usar web)

---

## 📦 Opción 1: RECOMENDADA — Usando GitHub Web

### Paso 1: Crear Repositorio

1. Ve a [github.com](https://github.com) y crea una cuenta (si no tienes)
2. Haz click en **"New"** (arriba a la izquierda)
3. Nombre del repositorio: **`pool`** (importante)
4. Descripción (opcional): "App para coordinar transporte de niños"
5. Selecciona **Public**
6. Click en **"Create repository"**

### Paso 2: Subir Archivos

1. Después de crear, verás una pantalla vacía
2. Click en **"Add file"** → **"Upload files"**
3. Arrastra estos archivos:
   - `index.html`
   - `styles.css`
   - `script.js`
4. Click en **"Commit changes"**

### Paso 3: Activar GitHub Pages

1. Ve a **Settings** (pestaña en el repo)
2. Baja a **Pages** (lado izquierdo)
3. En **Branch**, selecciona **main**
4. Click en **Save**
5. Espera 1-2 minutos

### Paso 4: Tu URL Pública

Tu app estará en:

```
https://tu_usuario.github.io/pool/
```

Ejemplo:
```
https://juanperez.github.io/pool/
```

---

## ✅ Verificar que Funciona

1. Abre el link en tu navegador
2. Deberías ver la pantalla de bienvenida
3. Crea un pool de prueba
4. Copia el link de WhatsApp
5. Abre en incógnito / otro navegador

**IMPORTANTE:** En otro navegador/dispositivo, localStorage será diferente, así que verás un formulario para crear nuevo usuario. Esto es normal.

---

## 🔗 Links de Invitación

### Cómo Funciona

La app detecta automáticamente la URL correcta.

#### Caso 1: Mismo Dispositivo
```
https://tu_usuario.github.io/pool/?poolId=1618905123
```

Carga el pool desde localStorage local.

#### Caso 2: Otro Dispositivo (Sin Backend)
```
https://tu_usuario.github.io/pool/?poolId=1618905123&pool=ENCODED_JSON
```

Incluye datos del pool en la URL. **Más confiable entre dispositivos.**

### Mensajes de WhatsApp

La app genera automáticamente:

```
Te invito a un pool 🚗

🎓 Destino: Escuela
📅 Fecha: jueves, 18 de abril de 2026
🕐 Hora: 08:00 - 17:00
👦 Niños: Juan, María

✅ Únete aquí:
https://tu_usuario.github.io/pool/?poolId=1618905123&pool=ENCODED_JSON
```

---

## ⚠️ Limitaciones (IMPORTANTE)

### Por Qué No Sincroniza Entre Dispositivos

**No hay backend**, por lo que:
- Cada dispositivo tiene su propio localStorage
- Un cambio en un dispositivo NO afecta a otro
- Es como una app local en cada celular

### Solución Actual

La app intenta:
1. **Primero** → Buscar pool en localStorage local
2. **Segundo** → Decodificar datos desde la URL
3. **Tercero** → Si nada funciona, mostrar error

Esto permite compartir invitaciones sin necesidad de sincronización.

---

## 🔄 Actualizar la App

Cada vez que cambies código:

1. Ve a tu repositorio en GitHub
2. Haz click en el archivo (ej: `script.js`)
3. Click en el lápiz (Edit)
4. Cambia el código
5. Baja y haz click **"Commit changes"**
6. La app se actualiza automáticamente en ~1 minuto

---

## 📲 Optimizaciones para Móvil

✅ La app ya es responsive
✅ Funciona en Chrome móvil
✅ Botones grandes y accesibles
✅ No requiere permisos especiales

---

## 🆘 Solución de Problemas

### "El link no funciona en otro dispositivo"

**Esperado.** localStorage local es diferente. Solución:
- Usar el link que incluye `&pool=...` (la app lo genera automáticamente)
- O crear el pool en ese dispositivo también

### "Los datos no se guardan"

Verificar:
- localStorage habilitado en navegador
- Modo incógnito desactiva localStorage (usar ventana normal)

### "¿Por qué no sincroniza como WhatsApp?"

Porque no hay servidor. Para eso necesitaría:
- Backend (Node.js, Python, etc.)
- Base de datos
- Todo eso requiere servidor pago

La solución actual es **MVP funcional** sin costo.

---

## 🚀 Siguiente Paso (FUTURO)

Para verdadera sincronización, migrar a:
- **Netlify** (gratis, con serverless functions)
- **Firebase** (Google, gratis para MVP)
- **Vercel** (gratis con Next.js)

Pero eso requiere cambios arquitectónicos.

---

## 📞 Resumen Rápido

| Acción | Cómo |
|--------|------|
| Ver app | `https://usuario.github.io/pool/` |
| Editar código | Settings → Pages → Branch main |
| Compartir pool | Copiar link automático |
| Multi-dispositivo | Usar link con `&pool=...` |

---

**¡Tu app está lista para ser pública! 🎉**
