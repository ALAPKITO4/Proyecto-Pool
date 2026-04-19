/* ============================================
   ESTADO GLOBAL DE LA APLICACIÓN
   ============================================ */

// Objeto que almacena el estado actual del plan
const appState = {
    persons: [],
    location: '',
    startTime: '',
    endTime: ''
};

// Constantes
const STORAGE_KEY = 'meetup_plan';

/* ============================================
   FUNCIONES DE NAVEGACIÓN
   ============================================ */

/**
 * Navega a un paso específico de la aplicación
 * @param {number} stepNumber - Número del paso a mostrar
 */
function goToStep(stepNumber) {
    // Validar paso actual antes de navegar
    if (stepNumber > getCurrentStep() && !validateCurrentStep()) {
        return;
    }

    // Ocultar todas las pantallas
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });

    // Mostrar la pantalla correspondiente
    const targetScreen = document.getElementById(`step-${stepNumber}`);
    if (targetScreen) {
        targetScreen.classList.add('active');
        updateUI();
    }
}

/**
 * Obtiene el número del paso actual
 * @returns {number} - Número del paso actual
 */
function getCurrentStep() {
    const screens = document.querySelectorAll('.screen');
    for (let i = 0; i < screens.length; i++) {
        if (screens[i].classList.contains('active')) {
            return i + 1;
        }
    }
    return 1;
}

/* ============================================
   PASO 2: GESTIÓN DE PERSONAS
   ============================================ */

/**
 * Agrega una persona a la lista
 */
function addPerson() {
    const input = document.getElementById('personInput');
    const name = input.value.trim();

    // Validaciones
    if (!name) {
        showError('El nombre no puede estar vacío');
        return;
    }

    if (name.length < 2) {
        showError('El nombre debe tener al menos 2 caracteres');
        return;
    }

    // Validar que no sea un nombre duplicado
    if (appState.persons.some(p => p.toLowerCase() === name.toLowerCase())) {
        showError('Esta persona ya está en la lista');
        return;
    }

    // Agregar a la lista
    appState.persons.push(name);
    input.value = '';

    // Actualizar UI
    updatePersonsList();
    updateContinueButtons();

    // Guardar en localStorage
    saveState();
}

/**
 * Maneja la tecla Enter en el campo de entrada de personas
 * @param {KeyboardEvent} event - Evento del teclado
 */
function handleEnterPerson(event) {
    if (event.key === 'Enter') {
        addPerson();
    }
}

/**
 * Elimina una persona de la lista
 * @param {number} index - Índice de la persona a eliminar
 */
function removePerson(index) {
    appState.persons.splice(index, 1);
    updatePersonsList();
    updateContinueButtons();
    saveState();
}

/**
 * Actualiza la visualización de la lista de personas
 */
function updatePersonsList() {
    const personsList = document.getElementById('personsList');
    personsList.innerHTML = '';

    appState.persons.forEach((person, index) => {
        const tag = document.createElement('div');
        tag.className = 'person-tag';
        tag.innerHTML = `
            ${person}
            <button class="remove-btn" onclick="removePerson(${index})">✕</button>
        `;
        personsList.appendChild(tag);
    });
}

/**
 * Abre WhatsApp para invitar (simulado)
 */
function openWhatsApp() {
    const message = encodeURIComponent('¿Te gustaría unirte a nuestro encuentro?');
    window.open(`https://wa.me/?text=${message}`, '_blank');
}

/* ============================================
   PASO 3: GESTIÓN DE UBICACIÓN
   ============================================ */

/**
 * Selecciona una ubicación sugerida
 * @param {string} location - Ubicación a seleccionar
 */
function selectLocation(location) {
    const locationInput = document.getElementById('locationInput');
    locationInput.value = location;
    appState.location = location;
    updateLocationButton();
    saveState();
}

/**
 * Actualiza el estado del botón de continuar del paso 3
 */
function updateLocationButton() {
    const input = document.getElementById('locationInput');
    const btn = document.getElementById('btn-continue-step3');

    // Guardar el valor en el estado
    appState.location = input.value.trim();

    // Habilitar/deshabilitar botón según si hay ubicación
    btn.disabled = appState.location === '';

    saveState();
}

/* ============================================
   PASO 4: GESTIÓN DE HORARIOS
   ============================================ */

/**
 * Valida que los horarios sean correctos
 */
function validateTime() {
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const errorMessage = document.getElementById('timeError');
    const btn = document.getElementById('btn-continue-step4');

    // Obtener valores
    const startTime = startTimeInput.value;
    const endTime = endTimeInput.value;

    // Guardar en el estado
    appState.startTime = startTime;
    appState.endTime = endTime;

    // Limpiar mensaje de error
    errorMessage.textContent = '';
    errorMessage.classList.remove('show');

    // Validar si ambos campos están llenos
    if (!startTime || !endTime) {
        btn.disabled = true;
        saveState();
        return;
    }

    // Comparar horarios
    if (startTime >= endTime) {
        errorMessage.textContent = '❌ La hora de fin debe ser posterior a la de inicio';
        errorMessage.classList.add('show');
        btn.disabled = true;
    } else {
        btn.disabled = false;
    }

    saveState();
}

/* ============================================
   PASO 5: RESUMEN
   ============================================ */

/**
 * Actualiza la pantalla de resumen
 */
function updateSummary() {
    // Actualizar lista de personas
    const summaryPersons = document.getElementById('summaryPersons');
    summaryPersons.innerHTML = '';
    appState.persons.forEach(person => {
        const item = document.createElement('div');
        item.className = 'summary-item';
        item.textContent = person;
        summaryPersons.appendChild(item);
    });

    // Actualizar ubicación
    document.getElementById('summaryLocation').textContent = appState.location;

    // Actualizar horario
    const startTime = formatTime(appState.startTime);
    const endTime = formatTime(appState.endTime);
    document.getElementById('summaryTime').textContent = `${startTime} - ${endTime}`;
}

/**
 * Formatea una hora al formato HH:MM
 * @param {string} timeString - Hora en formato HH:MM
 * @returns {string} - Hora formateada
 */
function formatTime(timeString) {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
}

/**
 * Confirma el plan y va al paso final
 */
function confirmPlan() {
    // Guardar plan final
    const finalPlan = {
        persons: appState.persons,
        location: appState.location,
        startTime: appState.startTime,
        endTime: appState.endTime,
        createdAt: new Date().toISOString()
    };

    // Guardar en localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(finalPlan));

    // Actualizar pantalla de éxito
    updateSuccessScreen();

    // Navegar al paso 6
    goToStep(6);
}

/**
 * Actualiza la pantalla de confirmación exitosa
 */
function updateSuccessScreen() {
    document.getElementById('finalPersonsCount').textContent = appState.persons.join(', ');
    document.getElementById('finalLocation').textContent = appState.location;

    const startTime = formatTime(appState.startTime);
    const endTime = formatTime(appState.endTime);
    document.getElementById('finalTime').textContent = `${startTime} - ${endTime}`;
}

/* ============================================
   REINICIO Y LIMPIEZA
   ============================================ */

/**
 * Reinicia la aplicación al estado inicial
 */
function restart() {
    // Limpiar estado
    appState.persons = [];
    appState.location = '';
    appState.startTime = '';
    appState.endTime = '';

    // Limpiar localStorage
    localStorage.removeItem(STORAGE_KEY);

    // Limpiar inputs
    document.getElementById('personInput').value = '';
    document.getElementById('locationInput').value = '';
    document.getElementById('startTime').value = '';
    document.getElementById('endTime').value = '';
    document.getElementById('timeError').innerHTML = '';
    document.getElementById('timeError').classList.remove('show');

    // Volver al paso 1
    goToStep(1);
}

/* ============================================
   VALIDACIONES GENERALES
   ============================================ */

/**
 * Valida el paso actual antes de continuar
 * @returns {boolean} - True si es válido, false en caso contrario
 */
function validateCurrentStep() {
    const step = getCurrentStep();

    switch (step) {
        case 2:
            if (appState.persons.length === 0) {
                showError('Debes agregar al menos una persona');
                return false;
            }
            return true;

        case 3:
            if (!appState.location.trim()) {
                showError('Debes seleccionar una ubicación');
                return false;
            }
            return true;

        case 4:
            if (!appState.startTime || !appState.endTime) {
                showError('Debes seleccionar ambos horarios');
                return false;
            }
            if (appState.startTime >= appState.endTime) {
                showError('La hora de fin debe ser posterior a la de inicio');
                return false;
            }
            return true;

        default:
            return true;
    }
}

/**
 * Muestra un mensaje de error temporal
 * @param {string} message - Mensaje de error
 */
function showError(message) {
    // Crear un elemento temporal para mostrar el error
    const alert = document.createElement('div');
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #F44336;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-weight: 500;
        font-size: 14px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    alert.textContent = message;

    document.body.appendChild(alert);

    // Eliminar después de 3 segundos
    setTimeout(() => {
        alert.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

/* ============================================
   ACTUALIZACIÓN DE UI
   ============================================ */

/**
 * Actualiza toda la interfaz según el paso actual
 */
function updateUI() {
    const step = getCurrentStep();

    switch (step) {
        case 2:
            updatePersonsList();
            updateContinueButtons();
            document.getElementById('personInput').focus();
            break;

        case 3:
            updateLocationButton();
            break;

        case 4:
            validateTime();
            break;

        case 5:
            updateSummary();
            break;

        case 6:
            updateSuccessScreen();
            break;
    }
}

/**
 * Actualiza el estado de los botones de continuar
 */
function updateContinueButtons() {
    const btn = document.getElementById('btn-continue-step2');
    if (btn) {
        btn.disabled = appState.persons.length === 0;
    }
}

/* ============================================
   PERSISTENCIA DE DATOS
   ============================================ */

/**
 * Guarda el estado actual en localStorage
 */
function saveState() {
    localStorage.setItem('app_state', JSON.stringify(appState));
}

/**
 * Carga el estado desde localStorage
 */
function loadState() {
    const saved = localStorage.getItem('app_state');
    if (saved) {
        const state = JSON.parse(saved);
        appState.persons = state.persons || [];
        appState.location = state.location || '';
        appState.startTime = state.startTime || '';
        appState.endTime = state.endTime || '';
    }
}

/* ============================================
   INICIALIZACIÓN
   ============================================ */

/**
 * Inicializa la aplicación
 */
function initApp() {
    // Cargar estado guardado
    loadState();

    // Configurar handlers globales
    setupEventListeners();

    // Mostrar primer paso
    goToStep(1);

    console.log('✅ Aplicación iniciada correctamente');
}

/**
 * Configura los event listeners adicionales
 */
function setupEventListeners() {
    // Permitir Enter en el input de ubicación
    const locationInput = document.getElementById('locationInput');
    if (locationInput) {
        locationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                updateLocationButton();
            }
        });
    }

    // Validar horarios en tiempo real
    const startTime = document.getElementById('startTime');
    const endTime = document.getElementById('endTime');

    if (startTime && endTime) {
        startTime.addEventListener('change', validateTime);
        endTime.addEventListener('change', validateTime);
    }
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);

// Limpiar antes de cerrar (opcional)
window.addEventListener('beforeunload', saveState);
