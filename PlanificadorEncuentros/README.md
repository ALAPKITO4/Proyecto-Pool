# 📅 Planificador de Encuentros - MVP

Una aplicación web moderna y funcional para planificar encuentros con otras personas de forma rápida y sencilla.

## 🎯 Características

✅ **Flujo Completo de 6 Pasos**
1. Bienvenida
2. Agregar personas a invitar
3. Seleccionar ubicación
4. Elegir horario
5. Revisar resumen
6. Confirmar (éxito)

✅ **Validaciones Completas**
- No permitir nombres vacíos o duplicados
- Validar que la hora de fin sea mayor a la de inicio
- Ubicación obligatoria
- Al menos una persona requerida

✅ **Funcionalidades Adicionales**
- Sugerencias rápidas de ubicaciones
- Botón de WhatsApp para invitar
- Persistencia de datos con localStorage
- Interfaz responsive para móvil
- Transiciones suaves entre pantallas
- Mensajes de error claros

✅ **Diseño Modern y Limpio**
- Interfaz minimalista y profesional
- Colores agradables a la vista
- Bordes redondeados y sombras suaves
- Tipografía clara (Google Fonts - Inter)
- Adaptable a cualquier dispositivo

## 📂 Estructura de Archivos

```
PlanificadorEncuentros/
├── index.html      # Estructura HTML (6 pantallas)
├── style.css       # Estilos y animaciones CSS
├── script.js       # Lógica de la aplicación en JavaScript
└── README.md       # Este archivo
```

## 🚀 Cómo Ejecutar

### Opción 1: Abrir directamente en el navegador
1. Abre la carpeta `PlanificadorEncuentros`
2. Haz doble clic en `index.html`
3. ¡Listo! La aplicación se abrirá en tu navegador

### Opción 2: Con Visual Studio Code
1. Abre VS Code
2. Ve a la carpeta del proyecto
3. Haz clic derecho en `index.html`
4. Selecciona "Open with Live Server" (si tienes la extensión)
5. O simplemente abre el archivo en el navegador

### Opción 3: Desde terminal
```bash
# Si estás en Windows
start index.html

# Si usas PowerShell
.\index.html

# En Linux/Mac
open index.html
```

## 📖 Flujo de Uso

### Paso 1: Bienvenida 👋
- Título: "Planifica tu encuentro"
- Botón para comenzar

### Paso 2: Agregar Personas 👥
- Campo de texto para agregar nombres
- Lista de personas agregadas con botón eliminar
- Botón "Agregar desde WhatsApp"
- Validaciones:
  - No permite nombres vacíos
  - No permite duplicados
  - Mínimo 1 persona para continuar

### Paso 3: Ubicación 📍
- Campo de texto para ingresar ubicación
- Sugerencias rápidas:
  - 🍽️ Restaurante
  - 🎬 Cine
  - 🌳 Parque
  - ☕ Café
  - 🏖️ Playa
  - 🏛️ Museo

### Paso 4: Horario 🕐
- Selector de hora de inicio
- Selector de hora de fin
- Validación automática:
  - La hora de fin debe ser mayor a la de inicio
  - Mensaje de error si no cumple

### Paso 5: Resumen 📋
- Muestra todas las personas invitadas
- Ubicación seleccionada
- Horario elegido
- Botones:
  - Atrás
  - Editar (vuelve al paso 2)
  - Confirmar

### Paso 6: Éxito ✅
- Mensaje de confirmación
- Resumen final del plan
- Botón para crear otro encuentro

## 💾 Persistencia de Datos

La aplicación guarda automáticamente:
- **Estado actual**: En cada cambio (localStorage)
- **Plan finalizado**: Al confirmar (localStorage)

Los datos persisten aunque cierres el navegador.

## 🎨 Colores Utilizados

```css
Color Primario (Verde): #4CAF50
Color Primario Oscuro: #388E3C
Color Secundario (Azul): #2196F3
Peligro (Rojo): #F44336
Fondo: #F5F5F5
Tarjetas: #FFFFFF
Texto Principal: #212121
Texto Secundario: #757575
```

## 📱 Responsive

La aplicación se adapta perfectamente a:
- 📱 Móviles (320px+)
- 📱 Tablets (600px+)
- 💻 Laptops (900px+)
- 🖥️ Escritorio (1200px+)

## 🔍 Validaciones Implementadas

| Validación | Estado | Mensaje |
|-----------|--------|---------|
| Nombre vacío | ❌ Bloquea | "El nombre no puede estar vacío" |
| Nombre muy corto | ❌ Bloquea | "El nombre debe tener al menos 2 caracteres" |
| Nombre duplicado | ❌ Bloquea | "Esta persona ya está en la lista" |
| Ubicación vacía | ❌ Bloquea | "Debes seleccionar una ubicación" |
| Hora de fin ≤ inicio | ❌ Bloquea | "La hora de fin debe ser posterior a la de inicio" |
| Sin personas | ❌ Bloquea | "Debes agregar al menos una persona" |

## 🛠️ Tecnologías Utilizadas

- **HTML5**: Estructura semántica
- **CSS3**: Estilos modernos con Grid, Flexbox y transiciones
- **JavaScript Vanilla**: Lógica sin dependencias externas
- **LocalStorage API**: Persistencia de datos
- **Google Fonts**: Tipografía profesional (Inter)

## 📝 Comentarios en el Código

Cada función tiene comentarios claros explicando:
- Qué hace
- Parámetros
- Valores de retorno
- Casos especiales

## ✨ Características Técnicas

✅ **Sin Dependencias Externas**
- No requiere librerías adicionales
- No requiere backend
- Solo HTML + CSS + JavaScript

✅ **Código Limpio**
- Variables descriptivas
- Funciones modulares
- Bien estructurado y documentado
- Fácil de mantener y extender

✅ **Rendimiento**
- Carga rápida
- Sin efectos pesados
- Animations suaves con CSS3

✅ **Escalable**
- Fácil agregar nuevos pasos
- Fácil cambiar colores
- Estructura modular

## 🐛 Debugging

Si algo no funciona:

1. Abre la consola del navegador (F12)
2. Mira si hay errores en la pestaña "Console"
3. Verifica en localStorage:
   ```javascript
   console.log(localStorage.getItem('app_state'))
   ```

## 🎓 Ejemplos de Uso

### Caso 1: Plan Simple
- Personas: Juan, María, Carlos
- Ubicación: Restaurante
- Horario: 19:00 - 21:00

### Caso 2: Reunión de Amigos
- Personas: Ana, Roberto, Felipe
- Ubicación: Parque
- Horario: 15:30 - 17:30

### Caso 3: Salida al Cine
- Personas: Sofia, Marcos
- Ubicación: Cine
- Horario: 20:00 - 22:30

## 🚀 Mejoras Futuras (NO incluidas en MVP)

Si quieres expandir la app en el futuro:
- Integración con calendario (Google Calendar)
- Envío de invitaciones por email
- Mapa interactivo de ubicaciones
- Sistema de notificaciones
- Historial de planes anteriores
- Perfiles de usuario
- Sincronización en la nube

## 📞 Soporte

Si encuentras problemas:
1. Verifica que JavaScript esté habilitado
2. Limpia el localStorage si hay conflictos
3. Prueba en otro navegador
4. Revisa la consola del navegador (F12)

## 📄 Licencia

Este proyecto es de código abierto y libre de usar.

## ✅ Checklist Final

- ✅ 6 pasos funcionales completos
- ✅ Todas las validaciones implementadas
- ✅ Diseño moderno y limpio
- ✅ Responsive para móvil
- ✅ Persistencia con localStorage
- ✅ Sin errores en el código
- ✅ Comentarios explicativos
- ✅ Transiciones suaves
- ✅ Fácil de ejecutar
- ✅ Escalable y mantenible

---

**¡Disfruta planificando tus encuentros! 🎉**
