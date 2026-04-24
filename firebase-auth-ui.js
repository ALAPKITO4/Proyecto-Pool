/* ============================================
   AUTENTICACIÓN FIREBASE - SISTEMA COMPLETO
   ============================================
   
   Soporta:
   ✅ Login/Registro con username + password
   ✅ Login con Google
   ✅ Login con Apple
   ✅ Validación de username único
   ✅ Recordarme (persistencia)
   ✅ Sincronización con currentUser
*/

/**
 * Estado global de autenticación
 */
const authState = {
    isAuthenticated: false,
    uid: null,
    email: null,
    username: null,
    displayName: null,
    photoURL: null,
    rememberMe: false
};

/**
 * Flag para controlar si estamos en modo inicialización
 * Si es true, los listeners no navegarán automáticamente
 */
let isInitializing = true;

/**
 * Inicializa el sistema de autenticación
 * Llamar después de inicializar Firebase
 */
function initializeAuth() {
    console.log('🔧 initializeAuth() llamado');
    console.log('   FIREBASE_ENABLED:', FIREBASE_ENABLED);
    console.log('   window.auth:', window.auth ? '✅' : '❌');
    
    try {
        if (!FIREBASE_ENABLED || !window.auth) {
            console.warn('⚠️ Firebase Auth no disponible. Saliendo.');
            console.log('   Razón:', !FIREBASE_ENABLED ? '!FIREBASE_ENABLED' : '!window.auth');
            return;
        }
        
        console.log('🔑 Inicializando sistema de autenticación...');
        
        // Escuchar cambios de autenticación
        window.auth.onAuthStateChanged(async (firebaseUser) => {
            console.log('🔥 Auth state changed - Usuario:', firebaseUser ? firebaseUser.uid : 'null');
            
            if (firebaseUser) {
                console.log('✅ Usuario autenticado:', firebaseUser.email, '| UID:', firebaseUser.uid);
                
                // Actualizar estado global
                authState.isAuthenticated = true;
                authState.uid = firebaseUser.uid;
                authState.email = firebaseUser.email;
                authState.displayName = firebaseUser.displayName;
                authState.photoURL = firebaseUser.photoURL;
                
                // Obtener username desde Firestore
                let firebaseUsername = null;
                try {
                    const userDoc = await UserStorage.getUser(firebaseUser.uid);
                    if (userDoc) {
                        firebaseUsername = userDoc.username || null;
                    }
                } catch (e) {
                    console.warn('⚠️ No se pudo obtener username:', e.message);
                }
                
                authState.username = firebaseUsername;
                
                // SI NO TIENE USERNAME EN FIRESTORE, mostrar pantalla de elección obligatoria
                if (!firebaseUsername && !authState.username) {
                    console.log('⚠️ Usuario SIN username - mostrando pantalla de elección');
                    showUsernameSetupScreen(firebaseUser);
                    return;
                }
                
                // Sincronizar con currentUser
                syncCurrentUserWithAuth();
                
                // Cargar datos del usuario (perfil y pools)
                try {
                    if (typeof loadPoolsEvents === 'function') {
                        await loadPoolsEvents();
                    }
                    if (typeof loadUserAcceptedPools === 'function') {
                        await loadUserAcceptedPools();
                    }
                    if (typeof startGlobalPoolListener === 'function') {
                        startGlobalPoolListener();
                    }
                    console.log('✅ Datos de usuario cargados');
                } catch (e) {
                    console.warn('⚠️ Error cargando datos:', e.message);
                }
                
                // Verificar si hay pool compartido en URL
                const urlParams = new URLSearchParams(window.location.search);
                const poolId = urlParams.get('poolId');
                
                if (poolId) {
                    console.log('📲 Pool compartido en URL:', poolId);
                    if (typeof checkForSharedPool === 'function') {
                        await checkForSharedPool();
                    }
                } else {
                    // Ir a Step-1 SOLO si estamos en Step-0 Y no inicializando Y no hay poolId
                    if (!isInitializing && getCurrentStep() === 0) {
                        console.log('📱 Navegando a Step-1 (onAuthStateChanged)');
                        goToStep(1);
                    } else {
                        console.log('ℹ️ No se navega - isInitializing:', isInitializing, '| step actual:', getCurrentStep());
                    }
                }
                
            } else {
                console.log('❌ Usuario NO autenticado - mostrando Step-0');
                authState.isAuthenticated = false;
                authState.uid = null;
                authState.email = null;
                authState.username = null;
                authState.displayName = null;
                authState.photoURL = null;
                
                // Limpiar datos locales cuando no hay auth
                if (currentUser) {
                    currentUser.uid = null;
                    currentUser.email = null;
                }
                
                // Volver a Step-0 solo si NO estamos inicializando Y no estamos ya en Step-0
                if (!isInitializing && getCurrentStep() !== 0) {
                    console.log('🔓 Navegando a Step-0 (usuario desautenticado)');
                    goToStep(0);
                }
            }
        });
        
        console.log('✅ Sistema de autenticación inicializado');
        
    } catch (error) {
        console.error('❌ Error al inicializar auth:', error);
    }
}

/**
 * Sincroniza el objeto currentUser con authState
 */
function syncCurrentUserWithAuth() {
    if (currentUser) {
        currentUser.uid = authState.uid;
        currentUser.email = authState.email;
        // IMPORTANTE: NO asignar valores por defecto. El usuario DEBE elegir su nombre manualmente.
        if (authState.username) {
            currentUser.nombre = authState.username;
            currentUser.username = authState.username;
        } else {
            // Si no tiene username, dejar vacío para forzar elección
            currentUser.nombre = '';
            currentUser.username = '';
        }
        if (authState.photoURL) {
            currentUser.foto = authState.photoURL;
        }
        
        console.log('✅ currentUser sincronizado con Auth');
    }
}

/* ============================================
   REGISTRO E LOGIN CON USERNAME + PASSWORD
   ============================================ */

/**
 * Valida que un username sea único en Firestore
 * @param {string} username - Username a validar
 * @returns {Promise<boolean>} - true si está disponible
 */
async function isUsernameAvailable(username) {
    try {
        // Verificar que Firestore esté disponible
        if (!FIREBASE_ENABLED || !window.db || typeof window.db.collection !== 'function') {
            console.warn('⚠️ Firestore no disponible, permitiendo cualquier nombre');
            return true;
        }
        
        const normalizedUsername = username.toLowerCase().trim();
        
        if (normalizedUsername.length < 3) {
            return false;
        }
        
        // Intentar consulta a Firestore
        const querySnapshot = await window.db
            .collection('users')
            .where('username_lower', '==', normalizedUsername)
            .limit(1)
            .get();
        
        const available = querySnapshot.empty;
        console.log(`📋 Username "${username}" ${available ? 'disponible' : 'ya en uso'}`);
        
        return available;
        
    } catch (error) {
        console.warn('⚠️ Error consultando Firestore:', error.message);
        // Si hay error de permisos o conexión, permitir el registro
        // El servidor validará al momento de crear la cuenta
        return true;
    }
}

/**
 * Crea una nueva cuenta con email y contraseña
 * @param {string} email - Email del usuario
 * @param {string} username - Username único
 * @param {string} password - Contraseña (mínimo 8 caracteres)
 * @param {boolean} rememberMe - Si se debe mantener la sesión
 * @returns {Promise<Object>} - Resultado del registro
 */
async function signUpWithEmailPassword(email, username, password, rememberMe = false) {
    try {
        console.log('📝 Registrando nuevo usuario:', email);
        console.log('   FIREBASE_ENABLED:', FIREBASE_ENABLED);
        console.log('   window.auth:', window.auth ? '✅ existe' : '❌ NO EXISTE');
        
        if (!FIREBASE_ENABLED || !window.auth) {
            console.error('❌ Firebase Auth no disponible');
            throw new Error('Firebase no disponible');
        }
        
        // Validaciones
        if (!email || !email.includes('@')) {
            throw new Error('Email inválido');
        }
        
        if (username.length < 3) {
            throw new Error('Username debe tener al menos 3 caracteres');
        }
        
        if (password.length < 8) {
            throw new Error('Contraseña debe tener al menos 8 caracteres');
        }
        
        // Verificar que username está disponible
        const available = await isUsernameAvailable(username);
        if (!available) {
            throw new Error('El nombre de usuario ya está en uso');
        }
        
        // Crear usuario en Firebase Auth
        const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
        const firebaseUser = userCredential.user;
        
        console.log('✅ Usuario creado en Firebase Auth:', firebaseUser.uid);
        
        // Actualizar displayName
        await firebaseUser.updateProfile({
            displayName: username
        });
        
        // Guardar información en Firestore
        const userData = {
            uid: firebaseUser.uid,
            email: email,
            username: username,
            username_lower: username.toLowerCase(),
            createdAt: new Date().toISOString(),
            authMethod: 'email-password',
            role: 'user',
            status: 'active'
        };
        
        await UserStorage.saveUser(userData);
        
        console.log('✅ Usuario guardado en Firestore');
        
        // Guardar preferencia de "recordarme"
        if (rememberMe) {
            localStorage.setItem('pool_remember_me', 'true');
            authState.rememberMe = true;
        }
        
        return {
            success: true,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            username: username
        };
        
    } catch (error) {
        console.error('❌ Error al registrar:', error.message);
        
        // Mensajes amigables para códigos de error específicos
        let message = error.message;
        if (error.code === 'auth/email-already-in-use') {
            message = 'Este email ya está registrado';
        } else if (error.code === 'auth/weak-password') {
            message = 'Contraseña muy débil';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Email inválido';
        }
        
        throw new Error(message);
    }
}

/**
 * Inicia sesión con email y contraseña
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña
 * @param {boolean} rememberMe - Si se debe mantener la sesión
 * @returns {Promise<Object>} - Resultado del login
 */
async function signInWithEmailPassword(email, password, rememberMe = false) {
    try {
        console.log('🔓 Iniciando sesión:', email);
        console.log('   FIREBASE_ENABLED:', FIREBASE_ENABLED);
        console.log('   window.auth:', window.auth ? '✅ existe' : '❌ NO EXISTE');
        
        if (!FIREBASE_ENABLED || !window.auth) {
            console.error('❌ Firebase Auth no disponible');
            throw new Error('Firebase no disponible');
        }
        
        // Iniciar sesión
        const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
        const firebaseUser = userCredential.user;
        
        console.log('✅ Sesión iniciada:', firebaseUser.email);
        
        // Guardar preferencia de "recordarme"
        if (rememberMe) {
            localStorage.setItem('pool_remember_me', 'true');
            authState.rememberMe = true;
        } else {
            localStorage.removeItem('pool_remember_me');
            authState.rememberMe = false;
        }
        
        return {
            success: true,
            uid: firebaseUser.uid,
            email: firebaseUser.email
        };
        
    } catch (error) {
        console.error('❌ Error al iniciar sesión:', error.message);
        
        let message = error.message;
        if (error.code === 'auth/user-not-found') {
            message = 'Email no registrado';
        } else if (error.code === 'auth/wrong-password') {
            message = 'Contraseña incorrecta';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Email inválido';
        } else if (error.code === 'auth/too-many-requests') {
            message = 'Demasiados intentos. Intenta más tarde';
        }
        
        throw new Error(message);
    }
}

/* ============================================
   LOGIN CON GOOGLE
   ============================================ */

/**
 * Inicia sesión con Google
 * @param {boolean} rememberMe - Si se debe mantener la sesión
 * @returns {Promise<Object>} - Resultado del login
 */
async function signInWithGoogle(rememberMe = false) {
    try {
        console.log('🔵 Iniciando sesión con Google...');
        console.log('   FIREBASE_ENABLED:', FIREBASE_ENABLED);
        console.log('   window.auth:', window.auth ? '✅ existe' : '❌ NO EXISTE');
        
        if (!FIREBASE_ENABLED || !window.auth) {
            console.error('❌ Firebase Auth no disponible');
            throw new Error('Firebase no disponible');
        }
        
        const provider = window.auth ? new window.auth.GoogleAuthProvider() : new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        
        // Mostrar popup de Google
        const result = await window.auth.signInWithPopup(provider);
        const firebaseUser = result.user;
        
        console.log('✅ Sesión con Google iniciada:', firebaseUser.email);
        
        // Obtener usuario existente
        let existingUser = null;
        try {
            existingUser = await UserStorage.getUser(firebaseUser.uid);
        } catch (e) {
            console.warn('⚠️ Error al verificar usuario existente:', e.message);
        }
        
        // IMPORTANTE: No asignar automáticamente. Usar displayName SOLO como sugerencia.
        // Si no existe en Firestore, mostrar pantalla de elección de username
        if (!existingUser) {
            // Guardar datos básicos temporalmente mientras elige username
            const tempUserData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                // NO asignar username automáticamente - seará elegido por el usuario
                username: null,
                username_lower: null,
                photoURL: firebaseUser.photoURL,
                createdAt: new Date().toISOString(),
                authMethod: 'google',
                role: 'user',
                status: 'active',
                // Guardar suggestedName vacío - el usuario debe elegir su nombre manualmente
                suggestedName: ''
            };
            
            // Guardar en ses storage para recuperación
            sessionStorage.setItem('pool_pending_user', JSON.stringify(tempUserData));
            
            console.log('✅ Nuevo usuario Google - requiriendo elección de username');
            return {
                success: true,
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                needsUsername: true
            };
        }
        
        // Guardar preferencia de "recordarme"
        if (rememberMe) {
            localStorage.setItem('pool_remember_me', 'true');
            authState.rememberMe = true;
        }
        
        return {
            success: true,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName
        };
        
    } catch (error) {
        console.error('❌ Error al iniciar con Google:', error);
        
        if (error.code === 'auth/popup-closed-by-user') {
            throw new Error('Popup cerrado');
        }
        
        throw new Error('Error al iniciar sesión con Google');
    }
}

/* ============================================
   LOGIN CON APPLE
   ============================================ */

/**
 * Inicia sesión con Apple
 * @param {boolean} rememberMe - Si se debe mantener la sesión
 * @returns {Promise<Object>} - Resultado del login
 */
async function signInWithApple(rememberMe = false) {
    try {
        console.log('🍎 Iniciando sesión con Apple...');
        
        if (!FIREBASE_ENABLED || !window.auth) {
            throw new Error('Firebase no disponible');
        }
        
        const provider = window.auth ? new window.auth.OAuthProvider('apple.com') : new firebase.auth.OAuthProvider('apple.com');
        provider.addScope('email');
        provider.addScope('name');
        
        // Mostrar popup de Apple
        const result = await window.auth.signInWithPopup(provider);
        const firebaseUser = result.user;
        
        console.log('✅ Sesión con Apple iniciada:', firebaseUser.email);
        
        // Obtener usuario existente
        let existingUser = null;
        try {
            existingUser = await UserStorage.getUser(firebaseUser.uid);
        } catch (e) {
            console.warn('⚠️ Error al verificar usuario existente:', e.message);
        }
        
        if (!existingUser) {
            // Guardar datos básicos temporalmente mientras elige username
            const tempUserData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                username: null,
                username_lower: null,
                photoURL: firebaseUser.photoURL,
                createdAt: new Date().toISOString(),
                authMethod: 'apple',
                suggestedName: firebaseUser.displayName || firebaseUser.email.split('@')[0]
            };
            
            sessionStorage.setItem('pool_pending_user', JSON.stringify(tempUserData));
            
            console.log('✅ Nuevo usuario Apple - requiriendo elección de username');
            return {
                success: true,
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                needsUsername: true
            };
        }
        
        // Guardar preferencia de "recordarme"
        if (rememberMe) {
            localStorage.setItem('pool_remember_me', 'true');
            authState.rememberMe = true;
        }
        
        return {
            success: true,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName
        };
        
    } catch (error) {
        console.error('❌ Error al iniciar con Apple:', error);
        
        if (error.code === 'auth/popup-closed-by-user') {
            throw new Error('Popup cerrado');
        }
        
        throw new Error('Error al iniciar sesión con Apple');
    }
}

/* ============================================
   CIERRE DE SESIÓN
   ============================================ */

/**
 * Cierra la sesión actual
 * @returns {Promise<void>}
 */
async function signOut() {
    try {
        console.log('🚪 Cerrando sesión...');
        
        if (FIREBASE_ENABLED && window.auth) {
            await window.auth.signOut();
            
            // Limpiar preferencias
            localStorage.removeItem('pool_remember_me');
            authState.rememberMe = false;
            
            console.log('✅ Sesión cerrada');
            showNotification('Sesión cerrada', 'success');
        }
        
        // Reiniciar app después de 1 segundo
        setTimeout(() => restart(), 1000);
        
    } catch (error) {
        console.error('❌ Error al cerrar sesión:', error);
        showNotification('Error al cerrar sesión', 'danger');
    }
}

/* ============================================
   FUNCIONES DE PERFIL
   ============================================ */

/**
 * Carga el perfil completo del usuario desde Firebase
 * @param {string} uid - UID del usuario (opcional, usa el actual si no se proporciona)
 */
async function loadUserProfileFromFirebase(uid = null) {
    try {
        const userUid = uid || window.auth.currentUser?.uid;
        if (!userUid) {
            console.warn('⚠️ No hay usuario autenticado');
            return;
        }
        
        const userData = await UserStorage.getUser(userUid);
        if (userData) {
            // IMPORTANTE: NO asignar valores por defecto. El usuario DEBE elegir su nombre manualmente.
            currentUser.nombre = userData.username || userData.nombre || '';
            currentUser.username = userData.username || '';
            currentUser.telefono = userData.telefono || '';
            currentUser.email = userData.email;
            currentUser.foto = userData.photoURL || null;
            currentUser.uid = userUid;
            
            console.log('✅ Perfil cargado de Firebase');
            updateUserProfileHeader();
        }
    } catch (error) {
        console.error('❌ Error al cargar perfil:', error);
    }
}

/**
 * Actualiza el perfil del usuario en Firebase
 */
async function updateUserProfileInFirebase() {
    try {
        const firebaseUser = window.auth.currentUser;
        if (!firebaseUser) {
            throw new Error('No hay usuario autenticado');
        }
        
        console.log('📝 Actualizando perfil...');
        
        // Actualizar Firebase Auth
        await firebaseUser.updateProfile({
            displayName: currentUser.nombre,
            photoURL: currentUser.foto || null
        });
        
        // Actualizar Firestore
        const userData = {
            username: currentUser.username || currentUser.nombre,
            username_lower: (currentUser.username || currentUser.nombre).toLowerCase(),
            nombre: currentUser.nombre,
            telefono: currentUser.telefono || '',
            email: firebaseUser.email,
            uid: firebaseUser.uid,
            photoURL: currentUser.foto || null
        };
        
        await UserStorage.saveUser(userData);
        
        console.log('✅ Perfil actualizado en Firebase');
        return true;
        
    } catch (error) {
        console.error('❌ Error al actualizar perfil:', error);
        return false;
    }
}

/* ============================================
   FUNCIONES DE UTILIDAD
   ============================================ */

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean}
 */
function isUserAuthenticated() {
    return authState.isAuthenticated && authState.uid !== null;
}

/**
 * Obtiene el ID único del usuario
 * @returns {string}
 */
function getUserId() {
    if (FIREBASE_ENABLED && authState.uid) {
        return authState.uid;
    }
    
    // Fallback: generar ID local
    let localId = localStorage.getItem('pool_user_id');
    if (!localId) {
        localId = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('pool_user_id', localId);
    }
    return localId;
}

/**
 * Obtiene el username actual
 * @returns {string}
 */
function getCurrentUsername() {
    return authState.username || currentUser.username || '';
}

/**
 * Verifica si "recordarme" está activado
 * @returns {boolean}
 */
function isRememberMeActive() {
    return localStorage.getItem('pool_remember_me') === 'true';
}

/* ============================================
   PANTALLA DE ELECCIÓN DE USERNAME
   ============================================ */

/**
 * Muestra la pantalla obligatoria para elegir username
 * Se muestra cuando el usuario no tiene username en Firestore
 * @param {object} firebaseUser - Usuario de Firebase
 */
async function showUsernameSetupScreen(firebaseUser) {
    // Obtener sugerencia de nombre si existe
    let suggestedName = '';
    try {
        const pendingData = sessionStorage.getItem('pool_pending_user');
        if (pendingData) {
            const parsed = JSON.parse(pendingData);
            suggestedName = parsed.suggestedName || '';
        }
    } catch (e) {
        console.warn('⚠️ Error al obtener sugerencia:', e.message);
    }
    
    // Crear HTML de la pantalla de elección
    const screenHTML = `
        <div id="username-setup-screen" class="screen active" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; box-sizing: border-box; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <div style="background: white; border-radius: 20px; padding: 30px; width: 100%; max-width: 400px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
                <h2 style="text-align: center; margin: 0 0 20px 0; color: #333;">👤 Elige tu nombre de usuario</h2>
                
                <p style="text-align: center; color: #666; margin-bottom: 20px;">
                    Este nombre será visible para otros usuarios. Debe ser único.
                </p>
                
                <div class="input-group-vertical" style="margin-bottom: 15px;">
                    <label for="username-setup-input">📝 Nombre de usuario:</label>
                    <input type="text" id="username-setup-input" class="input" 
                           placeholder="Ej: Juan2024" 
                           maxlength="20"
                           value="${suggestedName || ''}"
                           style="width: 100%;">
                    <div id="username-setup-status" style="font-size: 12px; margin-top: 5px;"></div>
                </div>
                
                <p style="font-size: 12px; color: #999; text-align: center;">
                    Mínimo 3 caracteres, máximo 20<br>
                    Solo letras y números
                </p>
                
                <div id="username-setup-error" style="color: #FF6B35; font-size: 14px; text-align: center; margin-top: 10px; display: none;"></div>
                
                <button class="btn btn-primary" onclick="validateAndSaveUsername()" style="width: 100%; margin-top: 20px;">
                    Continuar
                </button>
            </div>
        </div>
    `;
    
    // Ocultar todas las pantallas actuales
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    
    // Insertar la nueva pantalla
    let setupScreen = document.getElementById('username-setup-screen');
    if (!setupScreen) {
        document.body.insertAdjacentHTML('beforeend', screenHTML);
        setupScreen = document.getElementById('username-setup-screen');
    }
    
    setupScreen.classList.add('active');
    setupScreen.style.display = 'flex';
    
    // Agregar event listener para validaci��n en tiempo real
    const input = document.getElementById('username-setup-input');
    input.addEventListener('input', debounce(checkUsernameSetupAvailability, 500));
    input.focus();
}

/**
 * Valida el username en tiempo real en la pantalla de setup
 */
async function checkUsernameSetupAvailability() {
    const input = document.getElementById('username-setup-input');
    const statusDiv = document.getElementById('username-setup-status');
    const username = input.value.trim();
    
    if (username.length < 3) {
        statusDiv.innerHTML = '<span style="color: #FF9800;">Mínimo 3 caracteres</span>';
        statusDiv.style.display = 'block';
        return;
    }
    
    if (username.length > 20) {
        statusDiv.innerHTML = '<span style="color: #FF9800;">Máximo 20 caracteres</span>';
        statusDiv.style.display = 'block';
        return;
    }
    
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
        statusDiv.innerHTML = '<span style="color: #FF6B35;">Solo letras y números</span>';
        statusDiv.style.display = 'block';
        return;
    }
    
    statusDiv.innerHTML = '<span style="color: #FF9800;">🔄 Verificando...</span>';
    statusDiv.style.display = 'block';
    
    try {
        const available = await isUsernameAvailable(username);
        if (available) {
            statusDiv.innerHTML = '<span style="color: #4CAF50;">✅ Disponible</span>';
        } else {
            statusDiv.innerHTML = '<span style="color: #FF6B35;">❌ Ya en uso</span>';
        }
    } catch (e) {
        statusDiv.innerHTML = '<span style="color: #FF9800;">⚠️ Error al verificar</span>';
    }
}

/**
 * Valida y guarda el username seleccionado
 */
async function validateAndSaveUsername() {
    const input = document.getElementById('username-setup-input');
    const errorDiv = document.getElementById('username-setup-error');
    const statusDiv = document.getElementById('username-setup-status');
    const username = input.value.trim();
    
    errorDiv.style.display = 'none';
    
    // Validación: mínimo 3 caracteres
    if (username.length < 3) {
        errorDiv.textContent = '❌ Mínimo 3 caracteres';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Validación: máximo 20 caracteres
    if (username.length > 20) {
        errorDiv.textContent = '❌ Máximo 20 caracteres';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Validación: solo letras y números
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
        errorDiv.textContent = '❌ Solo letras y números';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Verificar unicidad
    try {
        const available = await isUsernameAvailable(username);
        if (!available) {
            errorDiv.textContent = '❌ Este nombre ya está en uso';
            errorDiv.style.display = 'block';
            return;
        }
    } catch (e) {
        console.warn('⚠️ Error al verificar unicidad:', e.message);
    }
    
    // Obtener datos pendientes del usuario
    let pendingData = null;
    try {
        const pendingStr = sessionStorage.getItem('pool_pending_user');
        if (pendingStr) {
            pendingData = JSON.parse(pendingStr);
        }
    } catch (e) {
        console.warn('⚠️ Error al obtener datos pendientes:', e.message);
    }
    
    // Obtener usuario actual de Firebase
    const firebaseUser = window.auth.currentUser;
    if (!firebaseUser) {
        errorDiv.textContent = '❌ Error de autenticación';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Guardar username en Firestore
    try {
        const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            username: username,
            username_lower: username.toLowerCase(),
            photoURL: firebaseUser.photoURL || null,
            createdAt: pendingData?.createdAt || new Date().toISOString(),
            authMethod: pendingData?.authMethod || 'google',
            role: 'user',
            status: 'active'
        };
        
        await UserStorage.saveUser(userData);
        
        // Actualizar estado
        authState.username = username;
        currentUser.username = username;
        currentUser.nombre = username;
        
        // Limpiar datos temporales
        sessionStorage.removeItem('pool_pending_user');
        
        console.log('✅ Username guardado:', username);
        
        showNotification('✅ ¡Bienvenido, ' + username + '!', 'success');
        
        // Navegar a Step-1
        goToStep(1);
        
    } catch (e) {
        errorDiv.textContent = '❌ Error al guardar: ' + e.message;
        errorDiv.style.display = 'block';
        console.error('❌ Error al guardar username:', e);
    }
}

/**
 * Función utilitaria para debounce
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Log al cargar
console.log('📦 firebase-auth-ui.js cargado - Sistema de autenticación SEGURO');
