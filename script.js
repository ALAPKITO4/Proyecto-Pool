/* ============================================
   CONFIGURACIÓN DE URL PARA DEPLOY
   ============================================ */

/**
 * Obtiene la URL base de la aplicación
 * Funciona tanto en localhost como en GitHub Pages
 * @returns {string} - URL base (ej: https://usuario.github.io/pool-app/)
 */
function getBaseURL() {
    const origin = window.location.origin; // https://usuario.github.io
    const pathname = window.location.pathname; // /pool-app/ o /
    // Remover trailing slash si existe
    return origin + pathname.replace(/\/$/, '');
}

/**
 * Genera un link de invitación con datos del pool
 * @param {number} poolId - ID del pool
 * @param {object} poolData - Datos del pool (opcional)
 * @returns {string} - Link completo con parámetros
 */
function generateInviteLink(poolId, poolData = null) {
    const baseURL = getBaseURL();
    let link = `${baseURL}/?poolId=${poolId}`;
    
    // SIEMPRE incluir datos del pool (para funcionar sin Firebase)
    if (poolData) {
        try {
            // Crear versión ligera del pool
            const litePool = {
                id: poolData.id,
                children: poolData.children,
                parents: poolData.parents,
                driverParent: poolData.driverParent,
                returnParent: poolData.returnParent,
                location: poolData.location,
                date: poolData.date,
                startTime: poolData.startTime,
                endTime: poolData.endTime,
                createdBy: poolData.createdBy,
                estado: poolData.estado
            };
            const encodedData = encodeURIComponent(JSON.stringify(litePool));
            link += `&pool=${encodedData}`;
            console.log('📦 Datos del pool incluidos en URL');
        } catch (e) {
            console.warn('Error al codificar pool:', e);
        }
    }
    
    return link;
}

/**
 * Extrae datos del pool desde la URL
 * @returns {object|null} - Datos decodificados o null
 */
function getPoolDataFromURL() {
    const params = new URLSearchParams(window.location.search);
    const encodedPool = params.get('pool');
    
    if (encodedPool) {
        try {
            return JSON.parse(decodeURIComponent(encodedPool));
        } catch (e) {
            console.warn('Error al decodificar datos del pool:', e);
        }
    }
    
    return null;
}

/* ============================================
   ESTADO GLOBAL DE LA APLICACIÓN
   ============================================ */

// Objeto que almacena el usuario actual
const currentUser = {
    nombre: '',
    telefono: '',
    foto: null // Base64 de la foto (opcional)
};

// Objeto que almacena el estado actual del pool
const appState = {
    children: [],
    parents: [],
    driverParent: '',
    returnParent: '',
    location: '',
    date: '',
    startTime: '',
    endTime: '',
    poolId: null, // ID del pool actual
    estado: 'pendiente' // Estado del pool
};

// Array para almacenar todos los eventos guardados
let poolsEvents = [];

// Array para almacenar invitados simulados
let currentPoolInvitations = [];

// Listener para sincronización en tiempo real
let unsubscribeAllPools = null;

// Listener global (siempre activo)
let globalPoolListener = null;

// Constantes
const STORAGE_KEY_STATE = 'pool_app_state';
const STORAGE_KEY_EVENTS = 'pool_events';
const STORAGE_KEY_USER = 'pool_user_profile';
const STORAGE_KEY_INVITATIONS = 'pool_invitations';
const MAX_CHILDREN = 4;
const MIN_PARENTS = 1;

/* ============================================
   FUNCIÓN DE DEBUGGING (FIX: Issue #6)
   ============================================ */

/**
 * ✅ FUNCIÓN DE DEBUGGING PARA CONSOLA
 * 
 * Úsala escribiendo en la consola:
 * DEBUG_showStatus()
 * 
 * Muestra:
 * - Usuario actual
 * - Pools disponibles
 * - Participantes y sus estados
 * - Sincronización con Firestore
 */
function DEBUG_showStatus() {
    console.clear();
    console.log('%c=== ESTADO COMPLETO DE POOL APP ===', 'color: #FF6B35; font-size: 16px; font-weight: bold;');
    
    // Usuario
    console.log('%c👤 USUARIO ACTUAL', 'color: #4CAF50; font-weight: bold; font-size: 12px;');
    console.log('   Nombre:', currentUser.nombre || '(sin perfil)');
    console.log('   Teléfono:', currentUser.telefono || '(no ingresado)');
    console.log('   UID:', currentUser.uid || '(no autenticado)');
    console.log('   Email:', currentUser.email || '(no disponible)');
    console.log('   Foto:', currentUser.foto ? '✅ Sí' : '❌ No');
    
    // Estado de la app
    console.log('%c📊 ESTADO DE LA APP', 'color: #2196F3; font-weight: bold; font-size: 12px;');
    console.log('   Step actual:', getCurrentStep());
    console.log('   Pool ID actual:', appState.poolId || '(ninguno)');
    console.log('   Niños:', appState.children || []);
    console.log('   Padres:', appState.parents || []);
    console.log('   Lleva:', appState.driverParent || '(sin asignar)');
    console.log('   Trae:', appState.returnParent || '(sin asignar)');
    console.log('   Destino:', appState.location || '(sin definir)');
    console.log('   Fecha:', appState.date || '(sin definir)');
    console.log('   Hora:', `${appState.startTime} - ${appState.endTime}` || '(sin definir)');
    
    // Pools guardados
    console.log('%c📅 POOLS GUARDADOS', 'color: #9C27B0; font-weight: bold; font-size: 12px;');
    if (poolsEvents.length === 0) {
        console.log('   ⚠️ Sin pools guardados');
    } else {
        poolsEvents.forEach((pool, idx) => {
            console.group(`   Pool #${idx + 1} (ID: ${pool.id})`);
            console.log('Ubicación:', pool.location);
            console.log('Creado por:', pool.createdBy);
            console.log('Fecha:', pool.date);
            console.log('Hora:', `${pool.startTime} - ${pool.endTime}`);
            console.log('Niños:', (pool.children || []).join(', '));
            console.log('Padres:', (pool.parents || []).join(', '));
            
            // Participantes
            if (pool.participantes && pool.participantes.length > 0) {
                console.group('Participantes:');
                pool.participantes.forEach(p => {
                    const status = p.estado === 'aceptado' ? '✅' : p.estado === 'rechazado' ? '❌' : '⏳';
                    console.log(`${status} ${p.nombre} (${p.telefono || 'sin teléfono'}) - ${p.estado}`);
                });
                console.groupEnd();
            } else {
                console.log('Participantes: (sin registrar)');
            }
            console.groupEnd();
        });
    }
    
    // Firebase
    console.log('%c🔥 FIREBASE', 'color: #FF9800; font-weight: bold; font-size: 12px;');
    console.log('   Habilitado:', FIREBASE_ENABLED ? '✅ Sí' : '❌ No');
    console.log('   Conectado:', window.db ? '✅ Sí' : '❌ No');
    console.log('   Auth:', window.auth ? '✅ Sí' : '❌ No');
    console.log('   Usuario autenticado:', authState.isAuthenticated ? '✅ Sí' : '❌ No');
    
    // localStorage
    console.log('%c💾 LOCAL STORAGE', 'color: #00BCD4; font-weight: bold; font-size: 12px;');
    const userProfile = localStorage.getItem(STORAGE_KEY_USER);
    const events = localStorage.getItem(STORAGE_KEY_EVENTS);
    console.log('   Perfil guardado:', userProfile ? '✅ Sí' : '❌ No');
    console.log('   Eventos guardados:', events ? `✅ Sí (${JSON.parse(events).length} pools)` : '❌ No');
    
    console.log('%c=== FIN DEL ESTADO ===', 'color: #FF6B35; font-size: 16px; font-weight: bold;');
    console.log('%cPara más detalles, revisa los pasos anteriores', 'color: #666; font-size: 11px;');
}

// Exponer función de debugging globalmente
window.DEBUG_showStatus = DEBUG_showStatus;

/* ============================================
   FUNCIONES DE USUARIO Y PERFIL
   ============================================ */

/**
 * Crea el perfil del usuario (Step-0)
 */
function createUserProfile() {
    const nombre = document.getElementById('userNameInput').value.trim();
    const telefono = document.getElementById('userPhoneInput').value.trim();
    const errorDiv = document.getElementById('userCreationError');

    // Validar campos
    if (!nombre) {
        errorDiv.textContent = '❌ Por favor ingresa tu nombre';
        errorDiv.style.display = 'block';
        return;
    }

    if (!telefono) {
        errorDiv.textContent = '❌ Por favor ingresa tu teléfono';
        errorDiv.style.display = 'block';
        return;
    }

    // Guardar en objeto global
    currentUser.nombre = nombre;
    currentUser.telefono = telefono;
    currentUser.uid = getUserId(); // Obtener UID de Firebase o local
    // La foto se guardó ya si existía

    // Guardar en localStorage
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
    
    // Sincronizar con Firebase si está disponible
    updateUserProfileInFirebase().catch(e => console.error(e));

    // Limpiar error
    errorDiv.style.display = 'none';

    // Navegar a Step-1
    goToStep(1);
    updateUserProfileHeader();

    // Mostrar notificación
    showNotification(`✅ Perfil creado: ${nombre}`, 'success');
}

/**
 * Permite editar el perfil del usuario
 */
function editUserProfile() {
    // Crear modal de edición
    const modalHTML = `
        <div id="editProfileModal" class="edit-profile-modal" onclick="closeEditProfileModal(event)">
            <div class="edit-profile-content">
                <h2>📝 Editar Perfil</h2>
                
                <div style="text-align: center; margin-bottom: 20px;">
                    <div id="editProfilePhotoPreview" class="profile-photo-preview" style="width: 80px; height: 80px; margin: 0 auto; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 36px;">
                        ${currentUser.foto ? `<img src="${currentUser.foto}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : '📸'}
                    </div>
                    <p style="font-size: 12px; color: #999; margin-top: 8px; cursor: pointer;" onclick="document.getElementById('editPhotoInput').click()">Cambiar foto</p>
                    <input type="file" id="editPhotoInput" accept="image/*" style="display: none;">
                </div>

                <div class="input-group-vertical">
                    <label for="editNameInput">📝 Nombre:</label>
                    <input type="text" id="editNameInput" class="input" value="${currentUser.nombre}">
                </div>

                <div class="input-group-vertical">
                    <label for="editPhoneInput">📱 Teléfono:</label>
                    <input type="tel" id="editPhoneInput" class="input" value="${currentUser.telefono}">
                </div>

                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button class="btn btn-secondary" onclick="closeEditProfileModal()" style="flex: 1;">Cancelar</button>
                    <button class="btn btn-primary" onclick="saveEditedProfile()" style="flex: 1;">Guardar</button>
                </div>
            </div>
        </div>
    `;

    // Insertar modal en el DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Agregar event listener para foto
    const editPhotoInput = document.getElementById('editPhotoInput');
    editPhotoInput.addEventListener('change', handleEditPhotoSelect);

    // Enfocar en nombre
    document.getElementById('editNameInput').focus();
}

/**
 * Maneja la selección de foto en Step-0
 */
function handlePhotoSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            currentUser.foto = e.target.result;
            const preview = document.getElementById('profilePhotoPreview');
            preview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Maneja la selección de foto en edición
 */
function handleEditPhotoSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            currentUser.foto = e.target.result;
            const preview = document.getElementById('editProfilePhotoPreview');
            preview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Guarda los cambios del perfil editado
 */
function saveEditedProfile() {
    const nombre = document.getElementById('editNameInput').value.trim();
    const telefono = document.getElementById('editPhoneInput').value.trim();

    if (!nombre) {
        showError('Por favor ingresa tu nombre');
        return;
    }

    if (!telefono) {
        showError('Por favor ingresa tu teléfono');
        return;
    }

    currentUser.nombre = nombre;
    currentUser.telefono = telefono;

    // Guardar en localStorage
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
    
    // ⭐ NUEVO: Sincronizar con Firebase
    updateUserProfileInFirebase().catch(e => console.error(e));

    // Cerrar modal
    closeEditProfileModal();

    // Actualizar header
    updateUserProfileHeader();

    // Mostrar notificación
    showNotification(`✅ Perfil actualizado: ${nombre}`, 'success');
}

/**
 * Cierra el modal de edición de perfil
 */
function closeEditProfileModal(event) {
    // Si se hace click en el background, cerrar
    if (event && event.target.id !== 'editProfileModal') {
        return;
    }

    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Actualiza el header del perfil en Step-1
 */
function updateUserProfileHeader() {
    const nameEl = document.getElementById('headerUserName');
    const phoneEl = document.getElementById('headerUserPhone');
    const photoEl = document.getElementById('headerProfilePhoto');
    const logoutBtn = document.getElementById('logoutBtn');

    if (nameEl) nameEl.textContent = currentUser.nombre || 'Usuario';
    if (phoneEl) phoneEl.textContent = currentUser.telefono || '-';

    if (photoEl) {
        if (currentUser.foto) {
            photoEl.innerHTML = `<img src="${currentUser.foto}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            photoEl.textContent = '📸';
        }
    }
    
    // Mostrar/ocultar botón de logout según autenticación
    if (logoutBtn) {
        logoutBtn.style.display = isUserAuthenticated() ? 'block' : 'none';
    }
}

/**
 * Carga el perfil del usuario desde localStorage
 */
function loadUserProfile() {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    if (saved) {
        try {
            const profile = JSON.parse(saved);
            currentUser.nombre = profile.nombre || '';
            currentUser.telefono = profile.telefono || '';
            currentUser.foto = profile.foto || null;
        } catch (e) {
            console.error('Error al cargar perfil:', e);
        }
    }
}

/**
 * Verifica si el usuario tiene perfil configurado
 * Ahora es compatible con:
 * - Usuario autenticado con Firebase (nuevo)
 * - Usuario con perfil manual (antiguo, para compatibilidad)
 * @returns {boolean} - True si tiene perfil, false si debe autenticarse
 */
function hasUserProfile() {
    // Nuevo sistema: Usuario autenticado con Firebase
    if (isUserAuthenticated()) {
        return true;
    }
    
    // Sistema antiguo: verificar si tiene nombre y teléfono
    // (para mantener compatibilidad con usuarios existentes)
    return currentUser.nombre && currentUser.telefono;
}

/**
 * Maneja Enter en el formulario de creación de usuario
 */
function handleEnterUserCreation(event) {
    if (event.key === 'Enter') {
        createUserProfile();
    }
}

/* ============================================
   NUEVO SISTEMA DE AUTENTICACIÓN FIREBASE
   ============================================ */

/**
 * Muestra/oculta los diferentes modos de autenticación
 * @param {string} mode - 'choice', 'login', 'register'
 */
function showAuthMode(mode) {
    const choiceMode = document.getElementById('authChoiceMode');
    const loginMode = document.getElementById('authLoginMode');
    const registerMode = document.getElementById('authRegisterMode');
    
    // Ocultar todos
    if (choiceMode) choiceMode.style.display = 'none';
    if (loginMode) loginMode.style.display = 'none';
    if (registerMode) registerMode.style.display = 'none';
    
    // Mostrar el seleccionado
    switch (mode) {
        case 'choice':
            if (choiceMode) choiceMode.style.display = 'block';
            break;
        case 'login':
            if (loginMode) loginMode.style.display = 'block';
            // Enfocar en email
            setTimeout(() => {
                const email = document.getElementById('loginEmail');
                if (email) email.focus();
            }, 100);
            break;
        case 'register':
            if (registerMode) registerMode.style.display = 'block';
            // Enfocar en email
            setTimeout(() => {
                const email = document.getElementById('registerEmail');
                if (email) email.focus();
            }, 100);
            break;
    }
}

/**
 * Realiza login con email y contraseña
 */
async function performEmailLogin() {
    try {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('loginRememberMe').checked;
        const errorDiv = document.getElementById('loginError');
        
        // Validaciones
        if (!email || !password) {
            errorDiv.textContent = '❌ Por favor completa todos los campos';
            errorDiv.style.display = 'block';
            return;
        }
        
        // Mostrar loading
        errorDiv.style.display = 'none';
        showNotification('🔓 Iniciando sesión...', 'info');
        
        // Ejecutar login
        const result = await signInWithEmailPassword(email, password, rememberMe);
        
        if (result.success) {
            showNotification(`✅ ¡Bienvenido, ${result.email}!`, 'success');
            // El onAuthStateChanged de initializeAuth() se encargará de navegar a Step-1
        }
        
    } catch (error) {
        const errorDiv = document.getElementById('loginError');
        errorDiv.textContent = `❌ ${error.message}`;
        errorDiv.style.display = 'block';
        console.error('Error en login:', error);
    }
}

/**
 * Realiza registro con email, username y contraseña
 */
async function performEmailRegister() {
    try {
        const email = document.getElementById('registerEmail').value.trim();
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value;
        const termsCheckbox = document.getElementById('termsCheckbox').checked;
        const errorDiv = document.getElementById('registerError');
        
        // Validaciones
        if (!email || !username || !password) {
            errorDiv.textContent = '❌ Por favor completa todos los campos';
            errorDiv.style.display = 'block';
            return;
        }
        
        if (!termsCheckbox) {
            errorDiv.textContent = '❌ Debes aceptar los términos de servicio';
            errorDiv.style.display = 'block';
            return;
        }
        
        if (username.length < 3) {
            errorDiv.textContent = '❌ Username debe tener al menos 3 caracteres';
            errorDiv.style.display = 'block';
            return;
        }
        
        if (password.length < 8) {
            errorDiv.textContent = '❌ Contraseña debe tener al menos 8 caracteres';
            errorDiv.style.display = 'block';
            return;
        }
        
        // Mostrar loading
        errorDiv.style.display = 'none';
        showNotification('✍️ Creando tu cuenta...', 'info');
        
        // Ejecutar registro
        const result = await signUpWithEmailPassword(email, username, password, false);
        
        if (result.success) {
            showNotification(`✅ ¡Cuenta creada! Bienvenido, ${result.username}`, 'success');
            // El onAuthStateChanged de initializeAuth() se encargará de navegar a Step-1
        }
        
    } catch (error) {
        const errorDiv = document.getElementById('registerError');
        errorDiv.textContent = `❌ ${error.message}`;
        errorDiv.style.display = 'block';
        console.error('Error en registro:', error);
    }
}

/**
 * Realiza login con Google
 */
async function performGoogleAuth() {
    try {
        showNotification('🔵 Conectando con Google...', 'info');
        const result = await signInWithGoogle(false); // No recordarme por defecto
        
        if (result.success) {
            showNotification(`✅ ¡Bienvenido, ${result.displayName || result.email}!`, 'success');
            // El onAuthStateChanged de initializeAuth() se encargará de navegar a Step-1
        }
    } catch (error) {
        showNotification(`❌ ${error.message}`, 'danger');
        console.error('Error en Google Auth:', error);
    }
}

/**
 * Realiza login con Apple
 */
async function performAppleAuth() {
    try {
        showNotification('🍎 Conectando con Apple...', 'info');
        const result = await signInWithApple(false); // No recordarme por defecto
        
        if (result.success) {
            showNotification(`✅ ¡Bienvenido, ${result.displayName || result.email}!`, 'success');
            // El onAuthStateChanged de initializeAuth() se encargará de navegar a Step-1
        }
    } catch (error) {
        showNotification(`❌ ${error.message}`, 'danger');
        console.error('Error en Apple Auth:', error);
    }
}

/**
 * Maneja Enter en los campos de autenticación
 */
function handleEnterAuth(event) {
    if (event.key !== 'Enter') return;
    
    const loginMode = document.getElementById('authLoginMode');
    const registerMode = document.getElementById('authRegisterMode');
    
    if (loginMode && loginMode.style.display !== 'none') {
        performEmailLogin();
    } else if (registerMode && registerMode.style.display !== 'none') {
        performEmailRegister();
    }
}

/**
 * Valida disponibilidad del username en tiempo real
 */
async function checkUsernameAvailability() {
    const usernameInput = document.getElementById('registerUsername');
    const statusDiv = document.getElementById('usernameStatus');
    const username = usernameInput.value.trim();
    
    if (username.length < 3) {
        statusDiv.style.display = 'none';
        return;
    }
    
    try {
        const available = await isUsernameAvailable(username);
        statusDiv.style.display = 'block';
        
        if (available) {
            statusDiv.innerHTML = '<span style="color: #4CAF50;">✅ Usuario disponible</span>';
        } else {
            statusDiv.innerHTML = '<span style="color: #FF6B35;">❌ Usuario no disponible</span>';
        }
    } catch (error) {
        statusDiv.style.display = 'block';
        statusDiv.innerHTML = '<span style="color: #F44336;">⚠️ Error al validar</span>';
    }
}

/**
 * Muestra la fortaleza de la contraseña
 */
function updatePasswordStrength() {
    const passwordInput = document.getElementById('registerPassword');
    const strengthDiv = document.getElementById('passwordStrength');
    const password = passwordInput.value;
    
    if (password.length === 0) {
        strengthDiv.innerHTML = '';
        return;
    }
    
    let strength = 'Débil';
    let color = '#FF6B35';
    
    if (password.length >= 8) strength = 'Regular';
    if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password)) strength = 'Fuerte';
    if (password.length >= 16 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*]/.test(password)) strength = 'Muy Fuerte';
    
    if (strength === 'Regular') color = '#FFA500';
    if (strength === 'Fuerte') color = '#4CAF50';
    if (strength === 'Muy Fuerte') color = '#2196F3';
    
    strengthDiv.innerHTML = `<span style="color: ${color};">Fortaleza: ${strength}</span>`;
}

/**
 * Navega a un paso específico de la aplicación
 * @param {number} stepNumber - Número del paso a mostrar
 */
function goToStep(stepNumber) {
    const current = getCurrentStep();
    
    // Limpiar listener de tiempo real al salir del paso 9
    if (current === 9 && stepNumber !== 9 && typeof unsubscribeAllPools === 'function') {
        console.log('🧹 Limpiando listener de tiempo real...');
        unsubscribeAllPools();
        unsubscribeAllPools = null;
    }
    
    // Permitir navegación directa a pasos especiales sin validación
    // Step 0: crear usuario, Step 10: invitación, Step 11: detalles
    if (stepNumber === 0 || stepNumber === 10 || stepNumber === 11) {
        // Navegación libre a estos pasos
    } else if (stepNumber > current && !validateCurrentStep()) {
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
 * @returns {number} - Número del paso actual (0-11)
 */
function getCurrentStep() {
    const screens = document.querySelectorAll('.screen');
    for (let i = 0; i < screens.length; i++) {
        if (screens[i].classList.contains('active')) {
            // Extraer el número del ID (step-0, step-1, etc)
            const screenId = screens[i].id;
            const stepMatch = screenId.match(/step-(\d+)/);
            if (stepMatch) {
                return parseInt(stepMatch[1], 10);
            }
        }
    }
    return 0; // Default a Step-0 si no encuentra ninguno
}

/* ============================================
   PASO 2: GESTIÓN DE NIÑOS
   ============================================ */

/**
 * Agrega un niño a la lista
 */
function addChild() {
    const input = document.getElementById('childInput');
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

    if (appState.children.length >= MAX_CHILDREN) {
        showError('Máximo 4 niños permitidos');
        return;
    }

    // Validar que no sea un nombre duplicado
    if (appState.children.some(c => c.toLowerCase() === name.toLowerCase())) {
        showError('Este niño ya está en la lista');
        return;
    }

    // Agregar a la lista
    appState.children.push(name);
    input.value = '';

    // Actualizar UI
    updateChildrenList();
    updateContinueButtons();

    // Guardar en localStorage
    saveState();
}

/**
 * Maneja la tecla Enter en el campo de entrada de niños
 */
function handleEnterChild(event) {
    if (event.key === 'Enter') {
        addChild();
    }
}

/**
 * Elimina un niño de la lista
 * @param {number} index - Índice del niño a eliminar
 */
function removeChild(index) {
    appState.children.splice(index, 1);
    updateChildrenList();
    updateContinueButtons();
    saveState();
}

/**
 * Actualiza la visualización de la lista de niños
 */
function updateChildrenList() {
    const childrenList = document.getElementById('childrenList');
    childrenList.innerHTML = '';

    appState.children.forEach((child, index) => {
        const tag = document.createElement('div');
        tag.className = 'item-tag';
        tag.innerHTML = `
            👦 ${child}
            <button type="button" class="remove-btn" onclick="removeChild(${index})">✕</button>
        `;
        childrenList.appendChild(tag);
    });
}

/* ============================================
   PASO 3: GESTIÓN DE PADRES
   ============================================ */

/**
 * Agrega un padre a la lista
 */
function addParent() {
    const input = document.getElementById('parentInput');
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
    if (appState.parents.some(p => p.toLowerCase() === name.toLowerCase())) {
        showError('Este padre ya está en la lista');
        return;
    }

    // Agregar a la lista
    appState.parents.push(name);
    input.value = '';

    // Actualizar UI
    updateParentsList();
    updateParentsSelects();
    updateContinueButtons();

    // Guardar en localStorage
    saveState();
}

/**
 * Maneja la tecla Enter en el campo de entrada de padres
 */
function handleEnterParent(event) {
    if (event.key === 'Enter') {
        addParent();
    }
}

/**
 * Elimina un padre de la lista
 * @param {number} index - Índice del padre a eliminar
 */
function removeParent(index) {
    appState.parents.splice(index, 1);
    // Limpiar roles si el padre eliminado estaba asignado
    if (appState.driverParent === appState.parents[index]) {
        appState.driverParent = '';
    }
    if (appState.returnParent === appState.parents[index]) {
        appState.returnParent = '';
    }
    updateParentsList();
    updateParentsSelects();
    updateContinueButtons();
    saveState();
}

/**
 * Actualiza la visualización de la lista de padres
 */
function updateParentsList() {
    const parentsList = document.getElementById('parentsList');
    parentsList.innerHTML = '';

    appState.parents.forEach((parent, index) => {
        const isCurrentUser = isNameMatch(parent, currentUser.nombre);
        const userTag = isCurrentUser ? ' <span class="user-tag">(Tú)</span>' : '';
        
        const tag = document.createElement('div');
        tag.className = 'item-tag';
        tag.innerHTML = `
            👤 ${parent}${userTag}
            <button type="button" class="remove-btn" onclick="removeParent(${index})">✕</button>
        `;
        parentsList.appendChild(tag);
    });
}

/**
 * Actualiza los select de padres en el paso 4
 */
function updateParentsSelects() {
    const driverSelect = document.getElementById('driverSelect');
    const returnSelect = document.getElementById('returnSelect');

    // Guardar valores actuales
    const currentDriver = driverSelect.value;
    const currentReturn = returnSelect.value;

    // Limpiar opciones
    driverSelect.innerHTML = '<option value="">Selecciona un padre</option>';
    returnSelect.innerHTML = '<option value="">Selecciona un padre</option>';

    // Agregar nuevas opciones
    appState.parents.forEach(parent => {
        const option1 = document.createElement('option');
        option1.value = parent;
        option1.textContent = parent;
        driverSelect.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = parent;
        option2.textContent = parent;
        returnSelect.appendChild(option2);
    });

    // Restaurar valores
    driverSelect.value = currentDriver;
    returnSelect.value = currentReturn;
}

/* ============================================
   PASO 4: ASIGNACIÓN DE ROLES
   ============================================ */

/**
 * Actualiza el estado de los botones de roles
 */
function updateRoleButtons() {
    const driverSelect = document.getElementById('driverSelect');
    const returnSelect = document.getElementById('returnSelect');
    const btn = document.getElementById('btn-continue-step4');

    // Guardar valores en el estado
    appState.driverParent = driverSelect.value;
    appState.returnParent = returnSelect.value;

    // Habilitar/deshabilitar botón
    btn.disabled = !driverSelect.value || !returnSelect.value;

    saveState();
}

/* ============================================
   PASO 5: UBICACIÓN
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
 * Actualiza el estado del botón de continuar del paso 5
 */
function updateLocationButton() {
    const input = document.getElementById('locationInput');
    const btn = document.getElementById('btn-continue-step5');

    // Guardar el valor en el estado
    appState.location = input.value.trim();

    // Habilitar/deshabilitar botón según si hay ubicación
    btn.disabled = appState.location === '';

    saveState();
}

/* ============================================
   PASO 6: FECHA Y HORARIOS
   ============================================ */

/**
 * Valida que fecha y horarios sean correctos
 */
function validateDateTime() {
    const dateInput = document.getElementById('dateInput');
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const errorMessage = document.getElementById('dateTimeError');
    const btn = document.getElementById('btn-continue-step6');

    // Obtener valores
    const date = dateInput.value;
    const startTime = startTimeInput.value;
    const endTime = endTimeInput.value;

    // Guardar en el estado
    appState.date = date;
    appState.startTime = startTime;
    appState.endTime = endTime;

    // Limpiar mensaje de error
    errorMessage.textContent = '';
    errorMessage.classList.remove('show');

    // Validar si todos los campos están llenos
    if (!date || !startTime || !endTime) {
        btn.disabled = true;
        saveState();
        return;
    }

    // Comparar horarios
    if (startTime >= endTime) {
        errorMessage.textContent = '❌ La hora de vuelta debe ser posterior a la de ida';
        errorMessage.classList.add('show');
        btn.disabled = true;
    } else {
        btn.disabled = false;
    }

    saveState();
}

/* ============================================
   PASO 7: RESUMEN
   ============================================ */

/**
 * Actualiza la pantalla de resumen
 */
function updateSummary() {
    // Actualizar lista de niños
    const summaryChildren = document.getElementById('summaryChildren');
    summaryChildren.innerHTML = '';
    appState.children.forEach(child => {
        const item = document.createElement('div');
        item.className = 'summary-item';
        item.textContent = child;
        summaryChildren.appendChild(item);
    });

    // Actualizar lista de padres
    const summaryParents = document.getElementById('summaryParents');
    summaryParents.innerHTML = '';
    appState.parents.forEach(parent => {
        const item = document.createElement('div');
        item.className = 'summary-item';
        item.textContent = parent;
        summaryParents.appendChild(item);
    });

    // Actualizar roles
    const rolesText = `👉 Lleva: ${appState.driverParent}\n👈 Trae: ${appState.returnParent}`;
    document.getElementById('summaryRoles').textContent = `👉 Lleva: ${appState.driverParent} | 👈 Trae: ${appState.returnParent}`;

    // Actualizar ubicación
    document.getElementById('summaryLocation').textContent = appState.location;

    // Actualizar fecha y horario
    const startTime = formatTime(appState.startTime);
    const endTime = formatTime(appState.endTime);
    const formattedDate = formatDate(appState.date);
    document.getElementById('summaryDateTime').textContent = `${formattedDate} de ${startTime} a ${endTime}`;
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
 * Formatea una fecha
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @returns {string} - Fecha formateada
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
}

/**
 * FASE 4: Formatea timestamp de confirmación
 * @param {string} isoString - Fecha ISO (ej: 2026-04-18T10:30:45.123Z)
 * @returns {string} - Formato: "10:30 AM" o "hoy a las 10:30"
 */
function formatConfirmationTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    if (isToday) {
        return `hoy a las ${timeStr}`;
    } else {
        const dateStr = date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
        return `${dateStr} a las ${timeStr}`;
    }
}

/**
 * Confirma el pool y va al paso final
 */
function confirmPool() {
    // Generar ID único del pool
    const poolId = generatePoolId();
    
    // Crear lista de invitados con teléfono y detectar estado real
    const invitados = appState.parents.map(p => {
        // Si es el usuario actual, está automáticamente aceptado
        const isCurrentUser = isNameMatch(p, currentUser.nombre);
        
        return {
            nombre: p,
            telefono: isCurrentUser ? currentUser.telefono : '',
            estado: isCurrentUser ? 'aceptado' : 'pendiente'
        };
    });
    
    // Crear objeto de evento con nueva estructura mejorada
    // FASE 4: Agregar confirmaciones reales con UIDs y timestamps
    const confirmationMap = {};
    invitados.forEach(inv => {
        const isCurrentUser = isNameMatch(inv.nombre, currentUser.nombre);
        if (isCurrentUser) {
            confirmationMap[currentUser.uid || 'anonymous'] = {
                nombre: inv.nombre,
                telefono: inv.telefono,
                confirmedAt: new Date().toISOString(),
                status: 'aceptado'
            };
        }
    });

    // 🔧 FIX: Crear array de participantes con estados reales
    const participantes = appState.parents.map(p => {
        const isCreator = isNameMatch(p, currentUser.nombre);
        return {
            nombre: p,
            telefono: isCreator ? currentUser.telefono : '',
            estado: isCreator ? 'aceptado' : 'pendiente',
            acceptedAt: isCreator ? new Date().toISOString() : null
        };
    });

    const newEvent = {
        id: poolId,
        date: appState.date,
        children: [...appState.children],
        parents: [...appState.parents],
        driverParent: appState.driverParent,
        returnParent: appState.returnParent,
        location: appState.location,
        startTime: appState.startTime,
        endTime: appState.endTime,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.nombre,
        createdByUid: currentUser.uid || 'anonymous',
        creatorName: currentUser.nombre,
        creatorPhone: currentUser.telefono,
        // 🔧 FIX: Nuevo campo principal de participantes
        participantes: participantes,
        participantsUids: appState.parents.map(() => 'pending'),
        confirmations: confirmationMap,
        estado: calculatePoolStatus(invitados),
        invitados: invitados,
        ubicacionActual: 'pendiente',
        whatsappLink: generatePoolLink(poolId),
        participants: [{
            nombre: currentUser.nombre,
            telefono: currentUser.telefono,
            joinedAt: new Date().toISOString()
        }]
    };

    // Guardar ID en estado
    appState.poolId = poolId;

    // Agregar a la lista de eventos LOCAL
    poolsEvents.push(newEvent);

    // ⭐ NUEVO: Guardar en Firestore (o localStorage si Firebase no disponible)
    PoolStorage.savePool(newEvent).catch(error => {
        console.error('Error al guardar pool:', error);
        // Fallback automático en firestore-wrapper.js
        localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(poolsEvents));
    });

    // Mostrar notificación
    showNotification('✅ Pool creado correctamente', 'success');

    // Actualizar pantalla de éxito
    updateSuccessScreen();

    // Navegar al paso 8
    goToStep(8);
}

/**
 * Calcula el estado del pool basado en las confirmaciones
 * @param {Array} invitados - Lista de invitados
 * @returns {string} - "pendiente" o "confirmado"
 */
function calculatePoolStatus(invitados) {
    if (!invitados || invitados.length === 0) return 'pendiente';
    
    const allAccepted = invitados.every(inv => inv.estado === 'aceptado');
    return allAccepted ? 'confirmado' : 'pendiente';
}

/**
 * Verifica si dos nombres coinciden (match parcial)
 * ✅ NORMALIZACIÓN MEJORADA (FIX: Issue #1)
 * - Convierte a minúsculas
 * - Aplica trim()
 * - Elimina espacios múltiples
 * 
 * @param {string} name1 - Primer nombre
 * @param {string} name2 - Segundo nombre
 * @returns {boolean} - True si hay coincidencia
 */
function isNameMatch(name1, name2) {
    if (!name1 || !name2) return false;
    
    // 🔧 FIX: Normalización robusta
    const normalize = (str) => {
        return str
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' '); // Eliminar espacios múltiples
    };
    
    const clean1 = normalize(name1);
    const clean2 = normalize(name2);
    
    console.log(`🔍 Comparando: "${clean1}" == "${clean2}"`);
    
    // Match exacto
    if (clean1 === clean2) {
        console.log('✅ Match exacto encontrado');
        return true;
    }
    
    // Match parcial: si uno contiene el otro
    // Ejemplo: "Juan" en "Juan Pérez"
    const parts1 = clean1.split(' ');
    const parts2 = clean2.split(' ');
    
    // Si al menos el primer nombre coincide
    const firstNameMatch = parts1[0] === parts2[0];
    if (firstNameMatch) {
        console.log(`✅ Match parcial: primer nombre "${parts1[0]}" coincide`);
    }
    
    return firstNameMatch;
}

/**
 * ✅ NUEVA FUNCIÓN (FIX: Issue #2)
 * Busca un participante en la pool o lo crea si no existe
 * 
 * @param {Object} event - El objeto pool
 * @param {string} userName - Nombre del usuario a buscar/crear
 * @param {string} userPhone - Teléfono del usuario (para crear)
 * @param {string} newStatus - Estado inicial (por defecto: 'pendiente')
 * @returns {Object} - El participante encontrado o creado
 */
function findOrCreateParticipant(event, userName, userPhone = '', newStatus = 'pendiente') {
    console.log(`🔍 Buscando/Creando participante: "${userName}" en pool ${event.id}`);
    
    // Inicializar array de participantes si no existe
    if (!event.participantes) {
        console.log('⚠️ Array participantes vacío, inicializando...');
        event.participantes = [];
    }
    
    // Buscar participante existente
    let participant = event.participantes.find(p => isNameMatch(p.nombre, userName));
    
    if (participant) {
        console.log(`✅ Participante encontrado: ${participant.nombre} (estado: ${participant.estado})`);
        return participant;
    }
    
    // Si no existe, crear participante nuevo
    console.log(`➕ Participante NO encontrado, agregando: ${userName}`);
    const newParticipant = {
        nombre: userName,
        telefono: userPhone,
        estado: newStatus,
        createdAt: new Date().toISOString()
    };
    
    event.participantes.push(newParticipant);
    console.log(`✅ Participante creado: ${newParticipant.nombre} con estado "${newParticipant.estado}"`);
    
    return newParticipant;
}

/**
 * Actualiza la pantalla de confirmación exitosa
 */
function updateSuccessScreen() {
    document.getElementById('finalChildrenCount').textContent = appState.children.join(', ');
    document.getElementById('finalParentsCount').textContent = appState.parents.join(', ');
    document.getElementById('finalDriver').textContent = appState.driverParent;
    document.getElementById('finalReturn').textContent = appState.returnParent;
    document.getElementById('finalLocation').textContent = appState.location;

    const formattedDate = formatDate(appState.date);
    const startTime = formatTime(appState.startTime);
    const endTime = formatTime(appState.endTime);
    document.getElementById('finalDate').textContent = `${formattedDate} (${startTime} - ${endTime})`;
}

/* ============================================
   PASO 9: MIS POOLS
   ============================================ */

/**
 * Actualiza la pantalla de eventos guardados
 * FASE 2: Ahora carga desde Firestore primero, con fallback a localStorage
 */
async function updatePoolsList() {
    // FASE 2: Cargar pools desde Firestore si está disponible
    if (FIREBASE_ENABLED && window.db) {
        try {
            const firebasePools = await PoolStorage.getAllPools();
            poolsEvents = firebasePools;
            console.log(`📡 Cargados ${firebasePools.length} pools de Firestore`);
        } catch (error) {
            console.warn('⚠️ Error cargando de Firestore, usando localStorage:', error);
            // 🔧 FIX: Fallback explícito a localStorage
            const saved = localStorage.getItem(STORAGE_KEY_EVENTS);
            if (saved) {
                poolsEvents = JSON.parse(saved);
                console.log(`📝 Fallback: ${poolsEvents.length} pools desde localStorage`);
            }
        }
    } else {
        console.log('📝 Usando pools de localStorage (Firebase no disponible)');
    }
    
    // 🔧 FIX: Validar que elementos existan (pueden no existir si no estamos en Step-9)
    const poolsList = document.getElementById('poolsList');
    const noMessage = document.getElementById('noPoolsMessage');
    
    // Si los elementos no existen, salir silenciosamente (los datos ya están cargados en poolsEvents)
    if (!poolsList || !noMessage) {
        console.log(`⚠️ Contenedor de pools no encontrado (probablemente no en Step-9). Datos listos: ${poolsEvents.length} pools`);
        return;
    }
    
    poolsList.innerHTML = '';

    if (poolsEvents.length === 0) {
        noMessage.style.display = 'block';
        return;
    }

    noMessage.style.display = 'none';

    // Agrupar por fecha
    const eventsByDate = {};
    poolsEvents.forEach(event => {
        if (!eventsByDate[event.date]) {
            eventsByDate[event.date] = [];
        }
        eventsByDate[event.date].push(event);
    });

    // Ordenar fechas
    const sortedDates = Object.keys(eventsByDate).sort().reverse();

    // Mostrar eventos
    sortedDates.forEach(date => {
        eventsByDate[date].forEach(event => {
            const card = document.createElement('div');
            card.className = 'pool-event-card';
            
            const startTime = formatTime(event.startTime);
            const endTime = formatTime(event.endTime);
            const formattedDate = formatDate(event.date);
            
            // Generar lista de participantes con estados
            let invitedsList = '';
            const participantes = event.participantes || event.invitados || [];
            if (participantes && participantes.length > 0) {
                invitedsList = '<div class="pool-invitations-list">';
                participantes.forEach(inv => {
                    const isCurrentUser = isNameMatch(inv.nombre, currentUser.nombre);
                    const userTag = isCurrentUser ? '<span class="user-tag">(Tú)</span>' : '';
                    const statusClass = `status-${inv.estado}`;
                    
                    let statusEmoji = '⏳';
                    let statusText = 'pendiente';
                    
                    if (inv.estado === 'aceptado') {
                        statusEmoji = '✅';
                        statusText = 'aceptado';
                    } else if (inv.estado === 'rechazado') {
                        statusEmoji = '❌';
                        statusText = 'rechazado';
                    }
                    
                    const phoneDisplay = inv.telefono ? ` (${inv.telefono})` : '';
                    
                    invitedsList += `
                        <div class="invitation-item">
                            <span class="invitation-name">${inv.nombre}${phoneDisplay}${userTag}</span>
                            <span class="invitation-status ${inv.estado}">${statusEmoji} ${statusText}</span>
                        </div>
                    `;
                });
                invitedsList += '</div>';
            }
            
            // Determinar badge de estado
            let statusBadgeClass = 'pool-status-pending';
            let statusText = '⏳ Pendiente';
            
            if (event.estado === 'confirmado') {
                statusBadgeClass = 'pool-status-confirmed';
                statusText = '✅ Confirmado';
            } else if (event.estado === 'rechazado') {
                statusBadgeClass = 'pool-status-rejected';
                statusText = '❌ Rechazado';
            }

            card.innerHTML = `
                <div class="pool-event-header">
                    <div class="pool-event-date">📅 ${formattedDate}</div>
                    <span class="pool-status-badge ${statusBadgeClass}">${statusText}</span>
                </div>

                <div class="pool-event-info">
                    <div class="pool-event-info-item">
                        <span class="pool-event-info-label">👦 Niños:</span>
                        <span class="pool-event-info-value">${event.children.join(', ')}</span>
                    </div>
                    <div class="pool-event-info-item">
                        <span class="pool-event-info-label">👤 Padres:</span>
                        <span class="pool-event-info-value">${event.parents.length}</span>
                    </div>
                    <div class="pool-event-info-item">
                        <span class="pool-event-info-label">👉 Lleva:</span>
                        <span class="pool-event-info-value">${event.driverParent}</span>
                    </div>
                    <div class="pool-event-info-item">
                        <span class="pool-event-info-label">👈 Trae:</span>
                        <span class="pool-event-info-value">${event.returnParent}</span>
                    </div>
                    <div class="pool-event-info-item">
                        <span class="pool-event-info-label">📍 Destino:</span>
                        <span class="pool-event-info-value">${event.location}</span>
                    </div>
                    <div class="pool-event-info-item">
                        <span class="pool-event-info-label">🕐 Hora:</span>
                        <span class="pool-event-info-value">${startTime} - ${endTime}</span>
                    </div>
                    <div class="pool-event-info-item">
                        <span class="pool-event-info-label">📲 Ubicación:</span>
                        <span class="pool-event-info-value">${event.ubicacionActual === 'llegado' ? '✅ Llegados' : '🚗 En camino'}</span>
                    </div>
                </div>

                ${invitedsList ? `<div class="pool-invitees-section"><h4>👥 Confirmaciones:</h4>${invitedsList}</div>` : ''}

                ${event.confirmations && Object.keys(event.confirmations).length > 0 ? `
                    <div class="pool-confirmations-section" style="background: #f0f8ff; padding: 12px; border-radius: 8px; margin-top: 12px; border-left: 3px solid #4CAF50;">
                        <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #333;">✅ Confirmaciones Reales (Fase 4)</h4>
                        ${Object.entries(event.confirmations).map(([uid, conf]) => `
                            <div style="padding: 6px 0; font-size: 12px; color: #666; display: flex; justify-content: space-between; align-items: center;">
                                <span><strong>${conf.nombre}</strong> confirmó</span>
                                <span style="font-size: 11px; color: #999;">${formatConfirmationTime(conf.confirmedAt)}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <div class="pool-event-actions">
                    <button class="btn btn-primary" onclick="showPoolDetails(${event.id})" style="font-size: 12px; padding: 6px 12px;">🔍 Detalles</button>
                    <button class="btn btn-outline" onclick="editPoolEvent(${event.id})" style="font-size: 12px; padding: 6px 12px;">✏️ Editar</button>
                    <button class="btn btn-outline" onclick="openGoogleMaps('${event.location}')" style="font-size: 12px; padding: 6px 12px;">🗺️</button>
                    ${event.ubicacionActual !== 'llegado' ? `<button class="btn btn-secondary" onclick="confirmPoolArrival(${event.id})" style="font-size: 12px; padding: 6px 12px;">✅</button>` : ''}
                    <button class="btn btn-danger" onclick="deletePoolEvent(${event.id})" style="font-size: 12px; padding: 6px 12px;">🗑️</button>
                </div>
            `;
            
            poolsList.appendChild(card);
        });
    });
}

/**
 * ✅ FIX: Elimina un evento de la lista (CORRECTAMENTE)
 * 
 * Cambios:
 * - Ahora es async
 * - Verifica que sea el creador (opcional)
 * - Elimina de Firestore
 * - Elimina de localStorage
 * - Actualiza poolsEvents
 * - Refresca UI
 * - Sincroniza cambios
 * 
 * @param {number} eventId - ID del evento a eliminar
 */
async function deletePoolEvent(eventId) {
    try {
        // Buscar el evento
        const event = poolsEvents.find(e => e.id === eventId);
        if (!event) {
            console.error('❌ Pool no encontrado:', eventId);
            showNotification('⚠️ Pool no encontrado', 'warning');
            return;
        }

        // Verificar permisos: solo el creador puede borrar el pool completo
        const isCreator = event.createdBy === currentUser.nombre || event.createdByUid === currentUser.uid;
        if (!isCreator && currentUser.nombre) {
            console.warn('⚠️ Solo el creador puede eliminar el pool');
            showNotification('⚠️ Solo el creador puede eliminar este pool', 'warning');
            return;
        }

        // Pedir confirmación
        if (!confirm(`🗑️ ¿Estás seguro de que deseas eliminar "${event.location}"?\n\nEsta acción no se puede deshacer.`)) {
            console.log('❌ Eliminación cancelada por el usuario');
            return;
        }

        console.log('🗑️ INICIANDO ELIMINACIÓN DEL POOL');
        console.log('   ID:', eventId);
        console.log('   Ubicación:', event.location);
        console.log('   Creador:', event.createdBy);

        // ===== PASO 1: Eliminar de Firestore (la fuente de verdad) =====
        let deletedFromFirestore = false;
        
        if (FIREBASE_ENABLED && window.db && typeof PoolStorage !== 'undefined') {
            try {
                console.log('   📡 Eliminando de Firestore...');
                deletedFromFirestore = await PoolStorage.deletePool(eventId);
                
                if (deletedFromFirestore) {
                    console.log('   ✅ Firestore: Eliminación EXITOSA');
                } else {
                    console.error('   ❌ Firestore: La función retornó false');
                    throw new Error('PoolStorage.deletePool() returned false');
                }
            } catch (error) {
                console.error('   ❌ ERROR al eliminar de Firestore:', error.message);
                showNotification(`❌ Error: No se pudo eliminar de Firestore: ${error.message}`, 'danger');
                return; // DETENER si falla la eliminación en Firestore
            }
        } else {
            console.log('   ⚠️ Firebase no disponible, continuando solo con localStorage');
            deletedFromFirestore = true; // Asumir éxito si no hay Firebase
        }

        // ===== PASO 2: Solo si fue exitoso en Firestore, actualizar local =====
        if (deletedFromFirestore) {
            console.log('   📝 Limpiando estado local...');
            
            // Guardar antes y después para auditoría
            const beforeCount = poolsEvents.length;
            poolsEvents = poolsEvents.filter(e => e.id !== eventId);
            const afterCount = poolsEvents.length;
            
            console.log(`   ✅ Array poolsEvents actualizado (${beforeCount} → ${afterCount})`);

            // Guardar en localStorage
            console.log('   💾 Guardando en localStorage...');
            localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(poolsEvents));
            console.log('   ✅ localStorage actualizado');

            // ===== PASO 3: Actualizar UI =====
            console.log('   🎨 Actualizando UI...');
            try {
                await updatePoolsList().catch(error => {
                    console.warn('   ⚠️ Error actualizando lista:', error.message);
                    // Igual mostrar mensaje de éxito porque la eliminación fue exitosa
                });
                console.log('   ✅ UI actualizada');
            } catch (uiError) {
                console.warn('   ⚠️ Error en updatePoolsList:', uiError.message);
            }

            // ===== PASO 4: Mostrar confirmación =====
            showNotification('✅ Pool eliminado correctamente', 'success');
            console.log('✅ ELIMINACIÓN COMPLETADA CON ÉXITO');

            // ===== PASO 5: Si estamos en el detalle del pool eliminado, volver atrás =====
            if (getCurrentStep() === 11 && appState.poolId === eventId) {
                console.log('   📱 Volviendo a mis pools...');
                goToStep(9);
            }
        }

    } catch (error) {
        console.error('❌ Error no manejado en deletePoolEvent:', error);
        showNotification('❌ Error inesperado al eliminar pool', 'danger');
    }
}

/**
 * Edita un evento (abre el flujo de creación con los datos del evento)
 * @param {number} eventId - ID del evento a editar
 */
function editPoolEvent(eventId) {
    const event = poolsEvents.find(e => e.id === eventId);
    if (event) {
        // Cargar datos del evento en el estado
        appState.children = [...event.children];
        appState.parents = [...event.parents];
        appState.driverParent = event.driverParent;
        appState.returnParent = event.returnParent;
        appState.location = event.location;
        appState.date = event.date;
        appState.startTime = event.startTime;
        appState.endTime = event.endTime;

        // Eliminar el evento actual para no duplicarlo
        deletePoolEvent(eventId);

        // Ir al paso 2
        goToStep(2);
    }
}

/* ============================================
   NUEVAS FUNCIONES: SISTEMA DE INVITACIONES
   ============================================ */

/**
 * Genera un ID único para el pool
 * @returns {number} - ID del pool
 */
function generatePoolId() {
    return Math.floor(Date.now() / 1000);
}

/**
 * Genera un link simulado del pool
 * @param {number} poolId - ID del pool
 * @returns {string} - Link del pool
 */
/**
 * Genera un link simulado del pool (heredado)
 * @param {number} poolId - ID del pool
 * @returns {string} - Link del pool
 */
function generatePoolLink(poolId) {
    const currentPool = poolsEvents.find(e => e.id === poolId);
    return generateInviteLink(poolId, currentPool || null);
}

/**
 * Comparte el pool por WhatsApp
 */
function sharePoolWhatsApp() {
    if (!appState.poolId) {
        showNotification('⚠️ Primero debes confirmar el pool', 'warning');
        return;
    }

    const poolLink = generatePoolLink(appState.poolId);
    
    // Formatear mensaje automático
    const mensaje = `Te invito a un pool de transporte 🚗

🎓 Destino: ${appState.location}
📅 Fecha: ${formatDate(appState.date)}
🕐 Hora: ${formatTime(appState.startTime)} - ${formatTime(appState.endTime)}
👦 Niños: ${appState.children.join(', ')}

✅ Únete aquí:
${poolLink}`;

    // URL de WhatsApp (sin número, el usuario elige el contacto)
    const whatsappURL = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    
    // Abrir en nueva pestaña
    window.open(whatsappURL, '_blank');
    
    // Mostrar notificación
    showNotification('📱 Abriendo WhatsApp...', 'info');
}

/**
 * Abre la ubicación en Google Maps
 * @param {string} location - Ubicación a buscar
 */
function openGoogleMaps(location) {
    if (!location || location.trim() === '') {
        showNotification('⚠️ Ingresa una ubicación', 'warning');
        return;
    }

    const mapsURL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
    window.open(mapsURL, '_blank');
    showNotification('🗺️ Abriendo Google Maps...', 'info');
}

/**
 * Renderiza un mapa embebido de Google Maps
 * @param {string} location - Ubicación a mostrar
 * @param {string} containerId - ID del contenedor donde insertar el iframe
 */
function renderMapEmbed(location, containerId) {
    try {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (!location || location.trim() === '') {
            container.innerHTML = '<p style="color:#999;font-size:12px;text-align:center;">Ubicación no disponible</p>';
            return;
        }

        const encodedLocation = encodeURIComponent(location);
        const embedURL = `https://www.google.com/maps?q=${encodedLocation}&output=embed&iwloc=`;
        
        container.innerHTML = `
            <iframe 
                src="${embedURL}"
                width="100%"
                height="250"
                style="border:0;border-radius:8px;"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
                title="Ubicación: ${location}">
            </iframe>
        `;
    } catch (error) {
        console.error('Error renderizando mapa:', error);
    }
}

/**
 * Renderiza mapa en resumen del pool (Step-7)
 */
function renderMapInSummary() {
    const location = appState.location;
    if (location) {
        renderMapEmbed(location, 'summaryMapEmbed');
    }
}

/**
 * Muestra una notificación tipo toast
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación (success, warning, info)
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        font-weight: 500;
        font-size: 14px;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        border-left: 4px solid;
    `;

    // Aplicar color según tipo
    if (type === 'success') {
        notification.style.borderLeftColor = '#4CAF50';
    } else if (type === 'warning') {
        notification.style.borderLeftColor = '#FF9800';
    } else {
        notification.style.borderLeftColor = '#1B6CA8';
    }

    document.body.appendChild(notification);

    // Remover después de 4 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

/**
 * ✅ ACEPTAR INVITACIÓN - VERSIÓN MEJORADA (FIX: Issue #1, #2, #4)
 * 
 * Cambios:
 * - Usa findOrCreateParticipant para agregar automáticamente si no existe
 * - Normalización robusta de nombres
 * - Sincroniza correctamente con Firestore
 * - Mejor manejo de errores y logs
 * 
 * @returns {void}
 */
async function acceptPoolInvitation() {
    const urlParams = new URLSearchParams(window.location.search);
    const poolId = urlParams.get('poolId') || appState.poolId;
    
    console.log('📝 ACEPTANDO INVITACIÓN');
    console.log('   PoolId:', poolId);
    console.log('   Usuario actual:', currentUser.nombre, `(${currentUser.telefono})`);
    
    // Validaciones
    if (!poolId) {
        console.error('❌ Sin poolId');
        showNotification('⚠️ Pool no encontrado', 'warning');
        return;
    }

    if (!hasUserProfile()) {
        console.error('❌ Usuario sin perfil completo');
        showNotification('⚠️ Debes completar tu perfil primero', 'warning');
        goToStep(0);
        return;
    }

    // Buscar el pool en poolsEvents primero
    let event = poolsEvents.find(e => e.id == poolId);
    
    // Si no está en poolsEvents, intentar cargar desde Firestore
    if (!event && FIREBASE_ENABLED && window.db) {
        console.log('📡 Pool no en local, buscando en Firestore...');
        try {
            event = await PoolStorage.getPoolById(poolId);
            if (event) {
                console.log('   ✅ Pool cargado desde Firestore');
                // Agregar a poolsEvents y localStorage
                poolsEvents.push(event);
                localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(poolsEvents));
            }
        } catch(err) {
            console.error('   ❌ Error cargando desde Firestore:', err);
        }
    }
    
    // Si aún no está, intentar desde URL
    if (!event) {
        console.log('📦 Intentando desde URL...');
        event = getPoolDataFromURL();
        if (event) {
            console.log('   ✅ Pool cargado desde URL');
            poolsEvents.push(event);
            localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(poolsEvents));
            
            // Guardar en Firestore
            if (FIREBASE_ENABLED && window.db) {
                try {
                    await PoolStorage.savePool(event);
                    console.log('   ✅ Pool sincronizado a Firestore');
                } catch(err) {
                    console.warn('   ⚠️ Error sync a Firestore:', err);
                }
            }
        }
    }

    if (!event) {
        console.error('❌ Pool no encontrado en ninguna fuente');
        showNotification('⚠️ Pool no encontrado', 'warning');
        return;
    }

    console.log('✅ Pool encontrado:', event.location);
    console.log('   ID:', event.id);
    console.log('   Creado por:', event.createdBy);
    console.log('   Participantes actuales:', event.participantes ? event.participantes.length : 0);

    // Buscar o crear el participante
    const participant = findOrCreateParticipant(
        event, 
        currentUser.nombre, 
        currentUser.telefono, 
        'pendiente'
    );

    // Actualizar el estado del participante a "aceptado"
    if (participant) {
        console.log(`📝 Actualizando participante: ${participant.nombre}`);
        const oldStatus = participant.estado;
        
        participant.estado = 'aceptado';
        participant.telefono = currentUser.telefono;
        participant.acceptedAt = new Date().toISOString();
        
        console.log(`✅ Estado actualizado: "${oldStatus}" → "aceptado"`);
    } else {
        console.error('❌ No se pudo crear/encontrar participante');
        showNotification('❌ Error al procesar participante', 'warning');
        return;
    }

    // Guardar en Firestore Y localStorage (sincronización dual)
    console.log('💾 Sincronizando datos...');
    console.log('   📋 Estado del pool ANTES de guardar:', JSON.stringify(event.participantes));
    
    // Asegurar que participantes tenga el valor correcto antes de guardar
    if (event.participantes) {
        event.participantes.forEach(p => {
            console.log(`   - ${p.nombre}: ${p.estado}`);
        });
    }
    
    try {
        // Guardar en Firestore usando PoolStorage (más robusto)
        if (FIREBASE_ENABLED && window.db) {
            console.log('   📡 Guardando en Firestore...');
            await PoolStorage.savePool(event);
            console.log('   ✅ Firestore actualizado correctamente');
            
            // Verificar que se guardó correctamente
            const verify = await PoolStorage.getPoolById(poolId);
            console.log('   🔍 Verificación Firestore:', verify ? JSON.stringify(verify.participantes) : 'NO ENCONTRADO');
        } else {
            console.log('   ⚠️ Firebase no disponible');
        }
        
        // Siempre guardar en localStorage (backup)
        console.log('   📝 Guardando en localStorage...');
        const updated = poolsEvents.map(e => e.id === event.id ? event : e);
        localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(updated));
        poolsEvents = updated;
        console.log('   ✅ localStorage actualizado');
        
        // Guardar también como pool aceptada por el usuario (para persistencia)
        saveUserAcceptedPool(poolId, event);
        
    } catch (error) {
        console.error('❌ Error en sincronización:', error);
        // Fallback final
        localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(poolsEvents));
    }

    // Mostrar confirmación
    showNotification('✅ ¡Invitación aceptada!', 'success');
    console.log('✅ ACEPTACIÓN COMPLETADA - Redirigiendo...');

    // Navegar a detalles del pool
    setTimeout(() => {
        showPoolDetails(parseInt(poolId));
    }, 1500);
}

/**
 * ✅ RECHAZAR INVITACIÓN - VERSIÓN MEJORADA (FIX: Issue #3, #2, #5)
 * 
 * Cambios:
 * - Usa findOrCreateParticipant para agregar automáticamente si no existe
 * - Normalización robusta de nombres
 * - Sincroniza correctamente con Firestore
 * - Mejor manejo de errores y logs
 * 
 * @returns {void}
 */
async function rejectPoolInvitation() {
    const urlParams = new URLSearchParams(window.location.search);
    const poolId = urlParams.get('poolId') || appState.poolId;
    
    console.log('🚫 RECHAZANDO INVITACIÓN');
    console.log('   PoolId:', poolId);
    console.log('   Usuario actual:', currentUser.nombre, `(${currentUser.telefono})`);
    
    // Validación de perfil
    if (!hasUserProfile()) {
        console.error('❌ Usuario sin perfil completo');
        showNotification('⚠️ Debes completar tu perfil primero', 'warning');
        goToStep(0);
        return;
    }

    // Validación de poolId
    if (!poolId) {
        console.error('❌ Sin poolId');
        showNotification('⚠️ Pool no encontrado', 'warning');
        return;
    }

    // Buscar el pool en poolsEvents primero
    let event = poolsEvents.find(e => e.id == poolId);
    
    // Si no está en poolsEvents, intentar cargar desde Firestore
    if (!event && FIREBASE_ENABLED && window.db) {
        console.log('📡 Pool no en local, buscando en Firestore...');
        try {
            event = await PoolStorage.getPoolById(poolId);
            if (event) {
                console.log('   ✅ Pool cargado desde Firestore');
                poolsEvents.push(event);
                localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(poolsEvents));
            }
        } catch(err) {
            console.error('   ❌ Error cargando desde Firestore:', err);
        }
    }
    
    // Si aún no está, intentar desde URL
    if (!event) {
        console.log('📦 Intentando desde URL...');
        event = getPoolDataFromURL();
        if (event) {
            console.log('   ✅ Pool cargado desde URL');
            poolsEvents.push(event);
            localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(poolsEvents));
            
            if (FIREBASE_ENABLED && window.db) {
                try {
                    await PoolStorage.savePool(event);
                    console.log('   ✅ Pool sincronizado a Firestore');
                } catch(err) {
                    console.warn('   ⚠️ Error sync a Firestore:', err);
                }
            }
        }
    }

    if (!event) {
        console.error('❌ Pool no encontrado en ninguna fuente');
        showNotification('⚠️ Pool no encontrado', 'warning');
        return;
    }

    console.log('✅ Pool encontrado:', event.location);
    console.log('   ID:', event.id);
    console.log('   Creado por:', event.createdBy);
    console.log('   Participantes actuales:', event.participantes ? event.participantes.length : 0);

    // Buscar o crear el participante
    const participant = findOrCreateParticipant(
        event, 
        currentUser.nombre, 
        currentUser.telefono, 
        'pendiente'
    );

    // Actualizar el estado del participante a "rechazado"
    if (participant) {
        console.log(`📝 Actualizando participante: ${participant.nombre}`);
        const oldStatus = participant.estado;
        
        participant.estado = 'rechazado';
        participant.rejectedAt = new Date().toISOString();
        
        console.log(`✅ Estado actualizado: "${oldStatus}" → "rechazado"`);
    } else {
        console.error('❌ No se pudo crear/encontrar participante');
        showNotification('❌ Error al procesar participante', 'warning');
        return;
    }

    // Guardar en Firestore Y localStorage (sincronización dual)
    console.log('💾 Sincronizando datos...');
    
    try {
        if (FIREBASE_ENABLED && window.db) {
            console.log('   📡 Guardando en Firestore...');
            await PoolStorage.savePool(event);
            console.log('   ✅ Firestore actualizado correctamente');
        } else {
            console.log('   ⚠️ Firebase no disponible');
        }
        
        // Siempre guardar en localStorage (backup)
        console.log('   📝 Guardando en localStorage...');
        const updated = poolsEvents.map(e => e.id === event.id ? event : e);
        localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(updated));
        poolsEvents = updated;
        console.log('   ✅ localStorage actualizado');
        
    } catch (error) {
        console.error('❌ Error en sincronización:', error);
        // Fallback final
        localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(poolsEvents));
    }

    // Mostrar confirmación
    showNotification('👋 Invitación rechazada', 'info');
    console.log('✅ RECHAZO COMPLETADO - Redirigiendo...');
    
    // Limpiar estado
    appState.poolId = null;
    
    // Volver al menú principal
    setTimeout(() => {
        goToStep(1);
    }, 1500);
}

/**
 * Comparte un pool existente por WhatsApp desde la vista de detalles
 * @param {number} poolId - ID del pool a compartir
 */
function sharePoolFromDetails(poolId) {
    console.log('📱 Compartiendo pool desde detalles - ID:', poolId);
    
    const event = poolsEvents.find(e => e.id === poolId);
    if (!event) {
        showNotification('⚠️ Pool no encontrado', 'warning');
        return;
    }
    
    const inviteLink = generateInviteLink(poolId, event);
    
    // Crear mensaje
    const mensaje = `Te invito a un pool de transporte 🚗

🎓 Destino: ${event.location}
📅 Fecha: ${formatDate(event.date)}
🕐 Hora: ${formatTime(event.startTime)} - ${formatTime(event.endTime)}
👦 Niños: ${event.children.join(', ')}
👤 Creador: ${event.creatorName || event.createdBy}

✅ Únete aquí:
${inviteLink}`;
    
    // URL de WhatsApp
    const whatsappURL = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    
    // Abrir
    window.open(whatsappURL, '_blank');
    
    showNotification('📱 Abriendo WhatsApp...', 'info');
    console.log('✅ Link compartido:', inviteLink);
}

/**
 * Copia el link de invitación al portapapeles
 * @param {number} poolId - ID del pool
 */
function copyInviteLink(poolId) {
    console.log('📋 Copiando link - ID:', poolId);
    
    const event = poolsEvents.find(e => e.id === poolId);
    if (!event) {
        showNotification('⚠️ Pool no encontrado', 'warning');
        return;
    }
    
    const link = generateInviteLink(poolId, event);
    
    // Copiar al portapapeles
    navigator.clipboard.writeText(link).then(() => {
        showNotification('✅ Link copiado al portapapeles', 'success');
        console.log('✅ Link copiado:', link);
    }).catch(err => {
        console.error('Error copiando:', err);
        showNotification('⚠️ Error copiando link', 'warning');
    });
}

/**
 * Suscribirse a actualizaciones en tiempo real del pool (Firestore)
 * 🔧 FIX: Ahora sincroniza cambios de participantes
 * @param {number} poolId - ID del pool a monitorear
 */
/**
 * ✅ SINCRONIZACIÓN EN TIEMPO REAL (FIX: Issue #5)
 * 
 * Mejoras:
 * - Logs detallados de cambios detectados
 * - Manejo robusto de participantes
 * - Actualización inteligente de UI
 * - Sincronización bidireccional (Firebase ↔ localStorage)
 * 
 * 🔧 FIX: Ahora sincroniza cambios de participantes
 * @param {number} poolId - ID del pool a monitorear
 */
function subscribeToPoolUpdates(poolId) {
    if (!FIREBASE_ENABLED || !window.db) {
        console.log('⚠️ Firebase no disponible para sincronización');
        return;
    }
    
    console.log('📡 INICIANDO SINCRONIZACIÓN EN TIEMPO REAL');
    console.log('   Pool ID:', poolId);
    
    try {
        const poolRef = firebase.firestore().collection('pools').doc(String(poolId));
        
        const unsubscribe = poolRef.onSnapshot((docSnapshot) => {
            if (docSnapshot.exists) {
                const updatedPool = docSnapshot.data();
                console.log('🔄 CAMBIO DETECTADO EN FIRESTORE');
                console.log('   Ubicación:', updatedPool.location);
                console.log('   Última actualización:', new Date(updatedPool.lastUpdated).toLocaleTimeString());
                
                // 🔧 FIX: Mostrar cambios de participantes con detalles
                if (updatedPool.participantes && updatedPool.participantes.length > 0) {
                    console.log('👥 PARTICIPANTES ACTUALIZADOS:');
                    updatedPool.participantes.forEach(p => {
                        console.log(`   • ${p.nombre}: ${p.estado}${p.acceptedAt ? ` (confirmó a las ${new Date(p.acceptedAt).toLocaleTimeString()})` : ''}${p.rejectedAt ? ` (rechazó a las ${new Date(p.rejectedAt).toLocaleTimeString()})` : ''}`);
                    });
                } else {
                    console.log('👥 Sin participantes registrados');
                }
                
                // Actualizar en el array local (sincronización bidireccional)
                const index = poolsEvents.findIndex(e => e.id == poolId);
                if (index >= 0) {
                    const oldPool = poolsEvents[index];
                    poolsEvents[index] = { ...poolsEvents[index], ...updatedPool };
                    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(poolsEvents));
                    
                    console.log('✅ Datos sincronizados con localStorage');
                    
                    // Si estamos en Step-10 o Step-11, actualizar UI
                    const currentStep = getCurrentStep();
                    console.log('   Paso actual:', currentStep);
                    
                    if (currentStep === 10) {
                        console.log('   ↻ Actualizando pantalla de invitación (Step-10)...');
                        document.getElementById('invDateTime').textContent = 
                            `${formatDate(updatedPool.date)} ${formatTime(updatedPool.startTime)} - ${formatTime(updatedPool.endTime)}`;
                    } else if (currentStep === 11) {
                        console.log('   ↻ Recargando detalles del pool (Step-11)...');
                        showPoolDetails(poolId);
                    } else if (currentStep === 9) {
                        console.log('   ↻ Actualizando lista de pools (Step-9)...');
                        updatePoolsList();
                    }
                } else {
                    console.warn('⚠️ Pool local no encontrado, agregando nuevo...');
                    poolsEvents.push(updatedPool);
                    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(poolsEvents));
                }
            } else {
                console.log('⚠️ Pool no encontrado en Firestore');
            }
        }, (error) => {
            console.error('❌ Error en suscripción de Firestore:', error);
        });
        
        // Guardar unsubscribe para limpiar después
        window._poolUnsubscribers = window._poolUnsubscribers || {};
        window._poolUnsubscribers[poolId] = unsubscribe;
        console.log('✅ Listener de Firestore activo para pool:', poolId);
        
    } catch (error) {
        console.error('❌ Error suscribiéndose a Firestore:', error);
    }
}

/**
 * Muestra resumen de estados de participantes
 * 🔧 FIX: Helper para mostrar progreso de aceptaciones
 * @param {number} poolId - ID del pool
 */
function showParticipantsSummary(poolId) {
    const event = poolsEvents.find(e => e.id === poolId);
    if (!event || !event.participantes) return;
    
    const total = event.participantes.length;
    const aceptados = event.participantes.filter(p => p.estado === 'aceptado').length;
    const rechazados = event.participantes.filter(p => p.estado === 'rechazado').length;
    const pendientes = total - aceptados - rechazados;
    
    console.log(`\n📊 RESUMEN DE PARTICIPANTES - Pool: ${event.location}`);
    console.log(`   ✅ Aceptados: ${aceptados}/${total}`);
    console.log(`   ⏳ Pendientes: ${pendientes}/${total}`);
    console.log(`   ❌ Rechazados: ${rechazados}/${total}`);
    console.log(`   Participantes: ${event.participantes.map(p => `${p.nombre}(${p.estado})`).join(', ')}\n`);
}

/**
 * Actualiza el estado de un pool
 * @param {number} poolId - ID del pool
 * @param {string} newStatus - Nuevo estado
 */
function updatePoolStatus(poolId, newStatus) {
    const event = poolsEvents.find(e => e.id === poolId);
    if (event) {
        event.estado = newStatus;
        
        // Si el estado es confirmado, mostrar notificación
        if (newStatus === 'confirmado') {
            showNotification('🎉 ¡Todos confirmaron el pool!', 'success');
        }
        
        localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(poolsEvents));
        updatePoolsList().catch(error => console.error('Error actualizando lista:', error));
    }
}

/**

/**
 * ✅ NUEVA FUNCIÓN: Sincronización en Tiempo Real de Pools
 * 
 * Crea un listener para actualizar el pool automáticamente cuando
 * alguien acepte/rechace una invitación o realice cambios
 * 
 * @param {number} poolId - ID del pool a escuchar
 */
async function subscribeToPoolUpdates(poolId) {
    try {
        // Crear almacenamiento de unsubscribers si no existe
        if (!window._poolUnsubscribers) {
            window._poolUnsubscribers = {};
        }

        // Cancelar suscripción anterior si existe
        if (window._poolUnsubscribers[poolId]) {
            console.log('🧹 Cancelando listener anterior');
            window._poolUnsubscribers[poolId]();
        }

        // No hacer nada si Firebase no está habilitado
        if (!FIREBASE_ENABLED || !window.db) {
            console.log('⚠️ Firebase no disponible, syncronización en tiempo real deshabilitada');
            return;
        }

        console.log(`📡 Iniciando listener para pool ${poolId}`);

        // Crear listener con onSnapshot
        const poolRef = window.db.collection('pools').doc(String(poolId));
        
        const unsubscribe = poolRef.onSnapshot((doc) => {
            if (doc.exists) {
                const updatedEvent = doc.data();
                console.log('🔄 ACTUALIZACIÓN EN TIEMPO REAL');
                console.log('   Pool:', updatedEvent.location);
                
                // Actualizar en poolsEvents
                const idx = poolsEvents.findIndex(e => e.id === poolId);
                if (idx >= 0) {
                    poolsEvents[idx] = updatedEvent;
                    console.log('   ✅ Array local actualizado');
                } else {
                    poolsEvents.push(updatedEvent);
                    console.log('   ➕ Pool agregado localmente');
                }

                // Guardar en localStorage
                localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(poolsEvents));

                // Mostrar resumen de participantes en consola
                if (updatedEvent.participantes && updatedEvent.participantes.length > 0) {
                    const aceptados = updatedEvent.participantes.filter(p => p.estado === 'aceptado').length;
                    const pendientes = updatedEvent.participantes.filter(p => p.estado === 'pendiente').length;
                    const rechazados = updatedEvent.participantes.filter(p => p.estado === 'rechazado').length;
                    
                    console.log('📊 ESTADO DE PARTICIPANTES:');
                    console.log(`   ✅ Aceptados: ${aceptados}`);
                    console.log(`   ⏳ Pendientes: ${pendientes}`);
                    console.log(`   ❌ Rechazados: ${rechazados}`);
                    
                    updatedEvent.participantes.forEach(p => {
                        const icon = p.estado === 'aceptado' ? '✅' : p.estado === 'rechazado' ? '❌' : '⏳';
                        console.log(`   ${icon} ${p.nombre} - ${p.estado}`);
                    });
                }

                // Actualizar UI si Step-11 está visible
                if (getCurrentStep() === 11) {
                    console.log('   🎨 Actualizando Step-11...');
                    showPoolDetails(poolId);
                }
            } else {
                console.error('❌ Pool no encontrado en Firestore');
            }
        }, (error) => {
            console.error('❌ Error en listener:', error);
        });

        // Guardar referencia para poder cancelar después
        window._poolUnsubscribers[poolId] = unsubscribe;
        console.log(`✅ Listener activo para pool ${poolId}`);

    } catch (error) {
        console.error('❌ Error al crear listener:', error);
    }
}

/**
 * Confirma la llegada al destino
 * @param {number} poolId - ID del pool
 */
function confirmPoolArrival(poolId) {
    const event = poolsEvents.find(e => e.id === poolId);
    if (event) {
        event.ubicacionActual = 'llegado';
        showNotification('📍 Los niños han llegado a destino', 'success');
        localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(poolsEvents));
        updatePoolsList().catch(error => console.error('Error actualizando lista:', error));
    }
}

/**
 * Muestra los detalles completos de un pool (Step-11)
 * @param {number} poolId - ID del pool a mostrar
 */
function showPoolDetails(poolId) {
    try {
        const event = poolsEvents.find(e => e.id === poolId);
        if (!event) {
            showNotification('⚠️ Pool no encontrado', 'warning');
            goToStep(1);
            return;
        }

        // 🔧 FIX: Activar sincronización en tiempo real
        subscribeToPoolUpdates(poolId).catch(error => 
            console.warn('⚠️ No se pudo activar sincronización:', error)
        );

        const locationEl = document.getElementById('detailLocation');
        const dateEl = document.getElementById('detailDate');
        const timesEl = document.getElementById('detailTimes');
        const rolesEl = document.getElementById('detailRoles');
        const childrenEl = document.getElementById('detailChildren');
        const parentsEl = document.getElementById('detailParents');
        const statusBanner = document.getElementById('poolDetailStatus');
        const participantsList = document.getElementById('detailParticipantsList');
        const currentUserRoleEl = document.getElementById('detailCurrentUserRole');
        const actionButtonsEl = document.getElementById('detailActionButtons');

        if (!locationEl) return;

        appState.poolId = poolId;

        locationEl.textContent = event.location || 'No especificado';
        dateEl.textContent = formatDate(event.date);
        timesEl.textContent = `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`;
        rolesEl.textContent = `👉 ${event.driverParent} | 👈 ${event.returnParent}`;

        childrenEl.innerHTML = '';
        (event.children || []).forEach(child => {
            const div = document.createElement('div');
            div.className = 'summary-item';
            div.textContent = child;
            childrenEl.appendChild(div);
        });

        parentsEl.innerHTML = '';
        (event.parents || []).forEach(parent => {
            const isCurrentUser = isNameMatch(parent, currentUser.nombre);
            const div = document.createElement('div');
            div.className = 'summary-item';
            div.innerHTML = isCurrentUser ? `${parent} <span class="user-tag">(Tú)</span>` : parent;
            parentsEl.appendChild(div);
        });

        let statusText = '⏳ Pendiente';
        let statusBg = 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)';
        if (event.estado === 'confirmado') {
            statusText = '✅ Confirmado';
            statusBg = 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)';
        } else if (event.estado === 'cancelado') {
            statusText = '❌ Cancelado';
            statusBg = 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)';
        }
        statusBanner.innerHTML = statusText;
        statusBanner.style.background = statusBg;
        statusBanner.style.color = 'white';

        const isParticipant = isUserParticipant(poolId, currentUser.nombre);
        const isCreator = event.createdBy === currentUser.nombre || event.createdByUid === currentUser.uid;

        if (actionButtonsEl) {
            let buttonsHTML = '';
            if (!isParticipant && event.estado !== 'cancelado') {
                buttonsHTML += `<button class="btn btn-primary" onclick="joinPool(${poolId})" style="flex:1;margin-right:8px;">✅ Unirse</button>`;
            } else if (isParticipant && event.estado !== 'cancelado') {
                buttonsHTML += `<button class="btn btn-secondary" onclick="leavePool(${poolId})" style="flex:1;margin-right:8px;">❌ Salir</button>`;
            }
            if (isCreator && event.estado === 'pendiente') {
                buttonsHTML += `<button class="btn btn-primary" onclick="confirmPoolStatus(${poolId}, 'confirmado')" style="flex:1;margin-right:8px;background:#4CAF50;">✓ Confirmar</button>`;
                buttonsHTML += `<button class="btn btn-danger" onclick="confirmPoolStatus(${poolId}, 'cancelado')" style="flex:1;">✕ Cancelar</button>`;
            }
            // 🔧 FIX: Agregar botones de compartir (nuevo)
            buttonsHTML += `<div style="display: flex; gap: 8px; margin-top: 12px; width: 100%;">`;
            buttonsHTML += `<button class="btn btn-outline" onclick="sharePoolFromDetails(${poolId})" style="flex:1; font-size: 12px; padding: 6px 10px;">📱 Compartir</button>`;
            buttonsHTML += `<button class="btn btn-outline" onclick="copyInviteLink(${poolId})" style="flex:1; font-size: 12px; padding: 6px 10px;">📋 Copiar Link</button>`;
            buttonsHTML += `</div>`;
            actionButtonsEl.innerHTML = buttonsHTML;
        }

        participantsList.innerHTML = '';
        // 🔧 FIX: Usar participantes con estados en lugar de participants
        const participants = event.participantes || event.participants || [];
        if (participants.length > 0) {
            participants.forEach(p => {
                const isCurrentUser = isNameMatch(p.nombre, currentUser.nombre);
                const userTag = isCurrentUser ? '<span class="user-tag">(Tú)</span>' : '';
                const phoneDisplay = p.telefono ? `<span style="font-size:11px;color:#999;">${p.telefono}</span>` : '';
                
                // 🔧 FIX: Mostrar estado del participante
                let estadoBadge = '⏳ Pendiente';
                let estadoColor = '#FF9800';
                if (p.estado === 'aceptado') {
                    estadoBadge = '✅ Aceptado';
                    estadoColor = '#4CAF50';
                } else if (p.estado === 'rechazado') {
                    estadoBadge = '❌ Rechazado';
                    estadoColor = '#F44336';
                }
                
                const card = document.createElement('div');
                card.className = 'pool-event-card';
                card.style.padding = '12px';
                card.style.marginBottom = '8px';
                card.innerHTML = `
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <span style="font-weight:600;">${p.nombre}</span>${userTag}
                            <div style="margin-top:4px;">${phoneDisplay}</div>
                        </div>
                        <span style="color:${estadoColor};font-size:12px;font-weight:600;">${estadoBadge}</span>
                    </div>
                `;
                participantsList.appendChild(card);
            });
        } else {
            participantsList.innerHTML = '<p style="color:#999;font-size:13px;text-align:center;">Aún nadie se ha unido</p>';
        }

        let userRole = 'Participante';
        if (isNameMatch(event.driverParent, currentUser.nombre)) {
            userRole = '👉 LLEVA (ida)';
        } else if (isNameMatch(event.returnParent, currentUser.nombre)) {
            userRole = '👈 TRAE (vuelta)';
        } else if (isParticipant) {
            userRole = '✓ Confirmado';
        }
        currentUserRoleEl.textContent = userRole;

        renderMapEmbed(event.location, 'detailMapEmbed');
        
        // 🔧 FIX: Mostrar resumen de estados de participantes
        showParticipantsSummary(poolId);
        
        goToStep(11);
        
    } catch (error) {
        console.error('Error mostrando detalles:', error);
        showNotification('⚠️ Error al cargar detalles', 'warning');
        goToStep(1);
    }
}

/**
 * Verifica si el usuario es participante del pool
 * @param {number} poolId - ID del pool
 * @param {string} userName - Nombre del usuario
 * @returns {boolean}
 */
function isUserParticipant(poolId, userName) {
    const event = poolsEvents.find(e => e.id === poolId);
    if (!event || !event.participants) return false;
    return event.participants.some(p => isNameMatch(p.nombre, userName));
}

/**
 * Se une a un pool
 * @param {number} poolId - ID del pool
 */
function joinPool(poolId) {
    const event = poolsEvents.find(e => e.id === poolId);
    if (!event) {
        showNotification('⚠️ Pool no encontrado', 'warning');
        return;
    }

    if (event.estado === 'cancelado') {
        showNotification('⚠️ No puedes unirte a un pool cancelado', 'warning');
        return;
    }

    if (!event.participants) event.participants = [];
    
    if (isUserParticipant(poolId, currentUser.nombre)) {
        showNotification('⚠️ Ya estás en este pool', 'warning');
        return;
    }

    event.participants.push({
        nombre: currentUser.nombre,
        telefono: currentUser.telefono,
        joinedAt: new Date().toISOString()
    });

    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(poolsEvents));
    showNotification('✅ Te unis al pool!', 'success');
    showPoolDetails(poolId);
}

/**
 * Sale de un pool
 * @param {number} poolId - ID del pool
 */
function leavePool(poolId) {
    const event = poolsEvents.find(e => e.id === poolId);
    if (!event) {
        showNotification('⚠️ Pool no encontrado', 'warning');
        return;
    }

    if (!event.participants) {
        showNotification('⚠️ No estás en este pool', 'warning');
        return;
    }

    event.participants = event.participants.filter(p => !isNameMatch(p.nombre, currentUser.nombre));

    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(poolsEvents));
    showNotification('👋 Saliste del pool', 'info');
    showPoolDetails(poolId);
}

/**
 * Actualiza el estado del pool (solo creador)
 * @param {number} poolId - ID del pool
 * @param {string} status - Estado: pendiente | confirmado | cancelado
 */
function confirmPoolStatus(poolId, status) {
    const event = poolsEvents.find(e => e.id === poolId);
    if (!event) {
        showNotification('⚠️ Pool no encontrado', 'warning');
        return;
    }

    if (event.createdBy !== currentUser.nombre && event.createdByUid !== currentUser.uid) {
        showNotification('⚠️ Solo el creador puede confirmar/cancelar', 'warning');
        return;
    }

    event.estado = status;
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(poolsEvents));
    
    if (status === 'confirmado') {
        showNotification('🎉 Pool confirmado!', 'success');
    } else if (status === 'cancelado') {
        showNotification('❌ Pool cancelado', 'warning');
    }
    
    showPoolDetails(poolId);
}

/**
 * ✅ VERIFICAR POOL COMPARTIDO - VERSIÓN MEJORADA (FIX: Issue #6)
 * 
 * Mejoras:
 * - Logs detallados de cada paso
 * - Muestra dónde se encuentra el pool
 * - Inicia sincronización en tiempo real
 * - Mejor manejo de errores
 * 
 * Soporta tres formas de compartir:
 * 1. Usando Firestore (Firebase habilitado): busca por poolId
 * 2. Usando localStorage (si ambos en mismo dispositivo): ?poolId=123
 * 3. Compartiendo datos en URL (multi-dispositivo): ?poolId=123&pool=ENCODED_JSON
 */
async function checkForSharedPool() {
    const urlParams = new URLSearchParams(window.location.search);
    const poolId = urlParams.get('poolId');
    
    console.log('🔍 VERIFICANDO POOL COMPARTIDO');
    console.log('   URL completa:', window.location.href);
    console.log('   poolId:', poolId);
    
    if (!poolId) {
        console.log('   ⚠️ Sin poolId en URL, saltando verificación');
        return;
    }
    
    let event = null;
    
    // PRIORIDAD 1: Intentar decodificar desde URL (datos embebidos)
    console.log('📦 PRIORIDAD 1: Buscando en datos embebidos de URL...');
    const poolDataFromURL = getPoolDataFromURL();
    if (poolDataFromURL) {
        console.log('   ✅ Pool encontrado en URL');
        console.log('   Ubicación:', poolDataFromURL.location);
        console.log('   Creado por:', poolDataFromURL.createdBy || 'desconocido');
        event = poolDataFromURL;
    } else {
        console.log('   ⚠️ Sin datos embebidos en URL');
    }
    
    // PRIORIDAD 2: Buscar en Firestore
    if (!event && FIREBASE_ENABLED && window.db) {
        console.log('📡 PRIORIDAD 2: Buscando en Firestore...');
        try {
            event = await PoolStorage.getPoolById(poolId);
            if (event) {
                console.log('   ✅ Pool encontrado en Firestore');
                console.log('   Ubicación:', event.location);
                console.log('   Creado por:', event.createdBy || 'desconocido');
            } else {
                console.log('   ⚠️ Pool no encontrado en Firestore');
            }
        } catch (error) {
            console.warn('   ❌ Error consultando Firestore:', error.message);
        }
    } else if (!event) {
        console.log('📡 PRIORIDAD 2: Firebase no disponible, saltando...');
    }
    
    // PRIORIDAD 3: Buscar en localStorage
    if (!event) {
        console.log('📝 PRIORIDAD 3: Buscando en localStorage...');
        event = poolsEvents.find(e => e.id == poolId);
        if (event) {
            console.log('   ✅ Pool encontrado en localStorage');
            console.log('   Ubicación:', event.location);
            console.log('   Creado por:', event.createdBy || 'desconocido');
        } else {
            console.log('   ⚠️ Pool no encontrado en localStorage');
        }
    }
    
    // Pool encontrado en alguna fuente
    if (event) {
        console.log('✅ POOL LOCALIZADO - Preparando pantalla de invitación');
        
        // Guardar en localStorage si no existe
        if (!poolsEvents.find(e => e.id === event.id)) {
            console.log('   📝 Agregando pool a localStorage...');
            poolsEvents.push(event);
            localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(poolsEvents));
        }
        
        // También guardar en Firestore si está disponible (para que el creador lo vea)
        if (FIREBASE_ENABLED && window.db) {
            console.log('   📡 Sincronizando pool a Firestore...');
            try {
                await PoolStorage.savePool(event);
                console.log('   ✅ Pool sincronizado a Firestore');
            } catch(err) {
                console.warn('   ⚠️ Error sync a Firestore:', err);
            }
        }
        
        // 🔧 FIX: Guardar poolId en appState para aceptar invitación después
        appState.poolId = poolId;
        
        // Cargar datos del pool en la pantalla de invitación
        console.log('🎨 Cargando datos en UI...');
        document.getElementById('invLocation').textContent = event.location || 'No especificado';
        document.getElementById('invDateTime').textContent = 
            `${formatDate(event.date)} ${formatTime(event.startTime)} - ${formatTime(event.endTime)}`;
        document.getElementById('invChildren').textContent = 
            (event.children && event.children.join(', ')) || 'No especificados';
        document.getElementById('invDrivers').textContent = 
            `${event.driverParent} (ida), ${event.returnParent} (vuelta)`;
        
        // 🔧 FIX: Mostrar nombre del creador (nuevo)
        const creatorEl = document.getElementById('invCreatedBy');
        if (creatorEl) {
            creatorEl.textContent = event.creatorName || event.createdBy || 'Desconocido';
        }
        
        // 🔧 FIX: Sincronizar en tiempo real si hay poolId (nuevo)
        console.log('📡 Configurando sincronización en tiempo real...');
        if (FIREBASE_ENABLED && window.db && poolId) {
            console.log('   ✅ Iniciando listener de Firestore');
            subscribeToPoolUpdates(poolId);
        } else {
            console.log('   ⚠️ Firebase no disponible para sincronización');
        }
        
        // Mostrar pantalla de invitación
        console.log('🎬 Mostrando pantalla de invitación (Step-10)');
        goToStep(10);
    } else {
        console.error('❌ POOL NO ENCONTRADO en ninguna fuente');
        console.error('   Buscado en: URL, Firestore, localStorage');
        showNotification('⚠️ Pool no encontrado. El link puede haber expirado.', 'warning');
        setTimeout(() => goToStep(1), 2000);
    }
}

/* ============================================
   REINICIO Y LIMPIEZA
   ============================================ */

/**
 * Reinicia la aplicación al estado inicial
 */
function restart() {
    // Limpiar estado
    appState.children = [];
    appState.parents = [];
    appState.driverParent = '';
    appState.returnParent = '';
    appState.location = '';
    appState.date = '';
    appState.startTime = '';
    appState.endTime = '';
    appState.poolId = null;
    appState.estado = 'pendiente';

    // Limpiar inputs
    document.getElementById('childInput').value = '';
    document.getElementById('parentInput').value = '';
    document.getElementById('locationInput').value = '';
    document.getElementById('driverSelect').value = '';
    document.getElementById('returnSelect').value = '';
    document.getElementById('dateInput').value = '';
    document.getElementById('startTime').value = '';
    document.getElementById('endTime').value = '';
    
    // Limpiar mensajes de error
    const errorMsg = document.getElementById('dateTimeError');
    if (errorMsg) {
        errorMsg.innerHTML = '';
        errorMsg.classList.remove('show');
    }

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
            if (appState.children.length === 0) {
                showError('Debes agregar al menos un niño');
                return false;
            }
            return true;

        case 3:
            if (appState.parents.length === 0) {
                showError('Debes agregar al menos un padre');
                return false;
            }
            return true;

        case 4:
            if (!appState.driverParent || !appState.returnParent) {
                showError('Debes seleccionar ambos roles');
                return false;
            }
            return true;

        case 5:
            if (!appState.location.trim()) {
                showError('Debes seleccionar una ubicación');
                return false;
            }
            return true;

        case 6:
            if (!appState.date || !appState.startTime || !appState.endTime) {
                showError('Debes completar fecha y horarios');
                return false;
            }
            if (appState.startTime >= appState.endTime) {
                showError('La hora de vuelta debe ser posterior a la de ida');
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
            updateChildrenList();
            updateContinueButtons();
            document.getElementById('childInput').focus();
            break;

        case 3:
            updateParentsList();
            updateParentsSelects();
            updateContinueButtons();
            document.getElementById('parentInput').focus();
            break;

        case 4:
            updateParentsSelects();
            updateRoleButtons();
            break;

        case 5:
            updateLocationButton();
            break;

        case 6:
            validateDateTime();
            break;

        case 7:
            updateSummary();
            renderMapInSummary();
            break;

        case 9:
            // Recargar pools desde Firestore cada vez que entramos
            console.log('📡 Recargando pools desde Firestore...');
            updatePoolsList().catch(error => console.error('Error cargando pools:', error));
            
            // Iniciar listener de tiempo real
            if (typeof unsubscribeAllPools === 'function') {
                unsubscribeAllPools();
            }
            if (FIREBASE_ENABLED && window.db) {
                // Recargar primero los pools más recientes
                PoolStorage.getAllPools().then(firebasePools => {
                    poolsEvents = firebasePools;
                    console.log(`📡 ${firebasePools.length} pools recargados de Firestore`);
                    updatePoolsList();
                    
                    // Luego activar listener
                    unsubscribeAllPools = subscribeToAllPools((updatedPools) => {
                        console.log('🔄 Cambio detectado en Firestore:', updatedPools.length);
                        poolsEvents = updatedPools;
                        updatePoolsList();
                    });
                    console.log('👂 Listener de tiempo real activado para Mis Pools');
                }).catch(err => console.error('Error:', err));
            }
            break;

        case 11:
            // Step 11 se maneja directamente en showPoolDetails
            break;
    }
}

/**
 * Actualiza el estado de los botones de continuar
 */
function updateContinueButtons() {
    const btn2 = document.getElementById('btn-continue-step2');
    if (btn2) {
        btn2.disabled = appState.children.length === 0;
    }

    const btn3 = document.getElementById('btn-continue-step3');
    if (btn3) {
        btn3.disabled = appState.parents.length === 0;
    }
}

/* ============================================
   PERSISTENCIA DE DATOS
   ============================================ */

/**
 * Guarda el estado actual en localStorage
 */
function saveState() {
    localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(appState));
}

/**
 * Carga el estado desde localStorage
 */
function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY_STATE);
    if (saved) {
        const state = JSON.parse(saved);
        appState.children = state.children || [];
        appState.parents = state.parents || [];
        appState.driverParent = state.driverParent || '';
        appState.returnParent = state.returnParent || '';
        appState.location = state.location || '';
        appState.date = state.date || '';
        appState.startTime = state.startTime || '';
        appState.endTime = state.endTime || '';
        appState.poolId = state.poolId || null;
        appState.estado = state.estado || 'pendiente';
    }
}

/**
 * Carga los eventos guardados desde localStorage
 */
/**
 * ✅ FIX: Carga pools desde Firestore primero, con fallback a localStorage
 * Ahora es async para permitir esperar a Firestore
 */
async function loadPoolsEvents() {
    try {
        // 1. Intentar cargar de Firestore primero (si está habilitado)
        if (FIREBASE_ENABLED && window.db && typeof PoolStorage !== 'undefined') {
            try {
                const firebasePools = await PoolStorage.getAllPools();
                if (firebasePools && firebasePools.length > 0) {
                    poolsEvents = firebasePools;
                    console.log(`✅ Cargados ${firebasePools.length} pools de Firestore`);
                    // Guardar también en localStorage como backup
                    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(poolsEvents));
                    return;
                }
            } catch (e) {
                console.warn('⚠️ Error cargando de Firestore, usando localStorage:', e.message);
            }
        }
        
        // 2. Fallback a localStorage
        const saved = localStorage.getItem(STORAGE_KEY_EVENTS);
        if (saved) {
            poolsEvents = JSON.parse(saved);
            console.log(`📝 Cargados ${poolsEvents.length} pools de localStorage`);
        } else {
            poolsEvents = [];
            console.log('📭 No hay pools guardados');
        }
    } catch (e) {
        console.error('❌ Error en loadPoolsEvents:', e);
        poolsEvents = [];
    }
}

/* ============================================
   INICIALIZACIÓN
   ============================================ */

/**
 * Inicializa la aplicación
 */
async function initApp() {
    console.log('🚀 Iniciando aplicación Pool...');
    
    try {
        // PASO 1: Inicializar Firebase PRIMERO
        console.log('1️⃣ Inicializando Firebase...');
        initializeFirebase();
        
        // PASO 2: Pequeña pausa para que Firebase Auth se estabilice
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // PASO 3: Inicializar sistema de autenticación
        console.log('2️⃣ Inicializando autenticación...');
        initializeAuth();
        
        // PASO 4: Cargar datos generales
        loadState();
        setupEventListeners();
        
        // PASO 5: Esperar un poco más para que onAuthStateChanged se dispare
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // PASO 6: Verificar estado de autenticación
        const firebaseUser = window.auth?.currentUser;
        
        if (firebaseUser) {
            console.log('✅ Usuario autenticado detectado:', firebaseUser.email);
            
            // Cargar datos del usuario
            try {
                await loadUserProfileFromFirebase(firebaseUser.uid);
            } catch (e) {
                console.warn('⚠️ Error cargando perfil:', e.message);
            }
            
            // Cargar pools
            try {
                await loadPoolsEvents();
                await loadUserAcceptedPools();
                startGlobalPoolListener();
            } catch (e) {
                console.warn('⚠️ Error cargando pools:', e.message);
            }
            
            // Verificar pool compartido en URL
            const urlParams = new URLSearchParams(window.location.search);
            const poolId = urlParams.get('poolId');
            
            if (poolId) {
                console.log('📲 Pool compartido detectado en URL:', poolId);
                try {
                    await checkForSharedPool();
                } catch (e) {
                    console.warn('⚠️ Error al procesar pool compartido:', e.message);
                }
            } else {
                // Pre-cargar pools
                updatePoolsList().catch(error => console.warn('⚠️ Error pre-cargando pools:', error));
            }
            
        } else {
            console.log('ℹ️ No hay sesión activa - Step-0 visible');
        }
        
        // PASO 7: Marcar que ya terminó la inicialización
        // Esto permite que onAuthStateChanged navegue automáticamente
        isInitializing = false;
        console.log('✅ Inicialización completada - Mode automático habilitado');
        
        // Mostrar pantalla principal
        updateUI();
        
        console.log('✅ Aplicación de Pools iniciada correctamente');
        
    } catch (error) {
        console.error('❌ Error al inicializar la app:', error);
        showNotification('❌ Error al inicializar la aplicación', 'danger');
    }
}

/**
 * Configura los event listeners adicionales
 */
function setupEventListeners() {
    // Event listener para foto en Step-0
    const photoInput = document.getElementById('photoInput');
    const profilePhotoPreview = document.getElementById('profilePhotoPreview');
    
    if (profilePhotoPreview) {
        profilePhotoPreview.addEventListener('click', () => {
            if (photoInput) photoInput.click();
        });
    }

    if (photoInput) {
        photoInput.addEventListener('change', handlePhotoSelect);
    }

    // Permitir Enter en inputs de ubicación
    const locationInput = document.getElementById('locationInput');
    if (locationInput) {
        locationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                updateLocationButton();
            }
        });
    }

    // Auto-establecer la fecha actual
    const dateInput = document.getElementById('dateInput');
    if (dateInput && !dateInput.value) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    // Validar fecha y horarios en tiempo real
    const startTime = document.getElementById('startTime');
    const endTime = document.getElementById('endTime');

    if (dateInput) dateInput.addEventListener('change', validateDateTime);
    if (startTime) startTime.addEventListener('change', validateDateTime);
    if (endTime) endTime.addEventListener('change', validateDateTime);
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);

// Limpiar antes de cerrar (opcional)
window.addEventListener('beforeunload', saveState);

/* ============================================
   PERSISTENCIA DE POOLS ACEPTADAS
   ============================================ */

/**
 * Guarda una pool aceptada por el usuario para persistencia
 * Esto permite que el usuario vea sus pools aceptadas al recargar
 */
function saveUserAcceptedPool(poolId, poolData) {
    console.log('💾 Guardando pool aceptada para el usuario...');
    
    // Obtener pools aceptadas del usuario
    const acceptedPools = JSON.parse(localStorage.getItem('user_accepted_pools') || '[]');
    
    // Verificar si ya existe
    const existingIndex = acceptedPools.findIndex(p => p.id === poolId);
    
    if (existingIndex >= 0) {
        // Actualizar
        acceptedPools[existingIndex] = poolData;
    } else {
        // Agregar
        acceptedPools.push(poolData);
    }
    
    localStorage.setItem('user_accepted_pools', JSON.stringify(acceptedPools));
    console.log(`✅ Pool guardada en user_accepted_pools (total: ${acceptedPools.length})`);
}

/**
 * Obtiene las pools aceptadas por el usuario
 */
function getUserAcceptedPools() {
    return JSON.parse(localStorage.getItem('user_accepted_pools') || '[]');
}

/**
 * Carga las pools aceptadas del usuario al iniciar la app
 */
async function loadUserAcceptedPools() {
    console.log('📥 Cargando pools aceptadas del usuario...');
    
    const acceptedPools = getUserAcceptedPools();
    
    if (acceptedPools.length > 0) {
        console.log(`   📝 Encontradas ${acceptedPools.length} pools aceptadas en localStorage`);
        
        // Agregar a poolsEvents
        acceptedPools.forEach(pool => {
            if (!poolsEvents.find(e => e.id === pool.id)) {
                poolsEvents.push(pool);
            }
        });
        
        localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(poolsEvents));
        console.log('   ✅ Pools aceptadas agregadas a poolsEvents');
    }
    
    // También intentar cargar desde Firestore si está disponible
    if (FIREBASE_ENABLED && window.db) {
        try {
            const firebasePools = await PoolStorage.getAllPools();
            firebasePools.forEach(pool => {
                if (!poolsEvents.find(e => e.id === pool.id)) {
                    poolsEvents.push(pool);
                }
            });
            console.log(`   📡 +${firebasePools.length} pools desde Firestore`);
        } catch(err) {
            console.warn('   ⚠️ Error cargando desde Firestore:', err);
        }
    }
}

/**
 * Inicia listener global de pools (siempre activo)
 * Esto permite ver cambios en tiempo real desde cualquier pantalla
 */
function startGlobalPoolListener() {
    if (!FIREBASE_ENABLED || !window.db) {
        console.log('⚠️ Firebase no disponible para listener global');
        return;
    }
    
    console.log('🌐 Iniciando listener GLOBAL de pools...');
    
    globalPoolListener = subscribeToAllPools((updatedPools) => {
        console.log('🔄 [GLOBAL] Cambios detectados en Firestore:', updatedPools.length);
        
        // Actualizar poolsEvents con los datos más recientes
        updatedPools.forEach(pool => {
            const index = poolsEvents.findIndex(e => e.id === pool.id);
            if (index >= 0) {
                poolsEvents[index] = pool;
            } else {
                poolsEvents.push(pool);
            }
        });
        
        // Guardar en localStorage
        localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(poolsEvents));
        
        // Actualizar UI si es necesario
        const currentStep = getCurrentStep();
        if (currentStep === 9) {
            updatePoolsList();
        }
    });
    
    console.log('✅ Listener GLOBAL activado');
}