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
    try {
        if (!FIREBASE_ENABLED || !window.auth) {
            console.log('⚠️ Firebase Auth no disponible');
            return;
        }
        
        console.log('🔑 Inicializando sistema de autenticación...');
        
        // Escuchar cambios de autenticación
        window.auth.onAuthStateChanged(async (firebaseUser) => {
            console.log('🔥 Auth state changed - Usuario detectado:', firebaseUser ? firebaseUser.uid : 'null');
            
            if (firebaseUser) {
                console.log('✅ Usuario autenticado:', firebaseUser.email, '| UID:', firebaseUser.uid);
                
                // Actualizar estado global
                authState.isAuthenticated = true;
                authState.uid = firebaseUser.uid;
                authState.email = firebaseUser.email;
                authState.displayName = firebaseUser.displayName;
                authState.photoURL = firebaseUser.photoURL;
                
                // Obtener username desde Firestore
                try {
                    const userDoc = await UserStorage.getUser(firebaseUser.uid);
                    if (userDoc) {
                        authState.username = userDoc.username || firebaseUser.displayName || 'Usuario';
                    } else {
                        authState.username = firebaseUser.displayName || 'Usuario';
                    }
                } catch (e) {
                    console.warn('⚠️ No se pudo obtener username:', e.message);
                    authState.username = firebaseUser.displayName || 'Usuario';
                }
                
                // Sincronizar con currentUser
                syncCurrentUserWithAuth();
                
                // Ir a Step-1 SOLO si estamos en Step-0 Y no inicializando
                if (!isInitializing && getCurrentStep() === 0) {
                    console.log('📱 Navegando a Step-1 (onAuthStateChanged)');
                    goToStep(1);
                } else {
                    console.log('ℹ️ No se navega - isInitializing:', isInitializing, '| step actual:', getCurrentStep());
                }
                const step0 = document.getElementById('step-0');
                if (step0) {
                    step0.style.display = 'none';
                }
                
            } else {
                console.log('❌ Usuario NO autenticado - mostrando Step-0');
                authState.isAuthenticated = false;
                authState.uid = null;
                authState.email = null;
                authState.username = null;
                authState.displayName = null;
                authState.photoURL = null;
                
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
        currentUser.nombre = authState.displayName || authState.username || 'Usuario';
        currentUser.username = authState.username;
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
        if (!FIREBASE_ENABLED || !window.db) {
            console.warn('⚠️ Firestore no disponible');
            return true; // Asumir disponible si no hay Firestore
        }
        
        const normalizedUsername = username.toLowerCase().trim();
        
        if (normalizedUsername.length < 3) {
            return false; // Username muy corto
        }
        
        const querySnapshot = await window.db
            .collection('users')
            .where('username_lower', '==', normalizedUsername)
            .limit(1)
            .get();
        
        const available = querySnapshot.empty;
        console.log(`📋 Username "${username}" ${available ? 'disponible' : 'NO disponible'}`);
        
        return available;
        
    } catch (error) {
        console.error('❌ Error al validar username:', error);
        throw new Error('No se pudo validar el username');
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
        
        if (!FIREBASE_ENABLED || !window.auth) {
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
            throw new Error('Username no está disponible');
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
            authMethod: 'email-password'
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
        
        if (!FIREBASE_ENABLED || !window.auth) {
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
        
        if (!FIREBASE_ENABLED || !window.auth) {
            throw new Error('Firebase no disponible');
        }
        
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        
        // Mostrar popup de Google
        const result = await window.auth.signInWithPopup(provider);
        const firebaseUser = result.user;
        
        console.log('✅ Sesión con Google iniciada:', firebaseUser.email);
        
        // Verificar/crear perfil en Firestore
        const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            username: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            username_lower: (firebaseUser.displayName || firebaseUser.email.split('@')[0]).toLowerCase(),
            photoURL: firebaseUser.photoURL,
            createdAt: new Date().toISOString(),
            authMethod: 'google'
        };
        
        // Obtener usuario existente
        try {
            const existingUser = await UserStorage.getUser(firebaseUser.uid);
            if (!existingUser) {
                // Nuevo usuario, guardar
                await UserStorage.saveUser(userData);
                console.log('✅ Nuevo usuario Google guardado en Firestore');
            }
        } catch (e) {
            console.warn('⚠️ No se pudo guardar usuario en Firestore:', e.message);
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
        
        const provider = new firebase.auth.OAuthProvider('apple.com');
        provider.addScope('email');
        provider.addScope('name');
        
        // Mostrar popup de Apple
        const result = await window.auth.signInWithPopup(provider);
        const firebaseUser = result.user;
        
        console.log('✅ Sesión con Apple iniciada:', firebaseUser.email);
        
        // Verificar/crear perfil en Firestore
        const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            username: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            username_lower: (firebaseUser.displayName || firebaseUser.email.split('@')[0]).toLowerCase(),
            photoURL: firebaseUser.photoURL,
            createdAt: new Date().toISOString(),
            authMethod: 'apple'
        };
        
        // Obtener usuario existente
        try {
            const existingUser = await UserStorage.getUser(firebaseUser.uid);
            if (!existingUser) {
                // Nuevo usuario, guardar
                await UserStorage.saveUser(userData);
                console.log('✅ Nuevo usuario Apple guardado en Firestore');
            }
        } catch (e) {
            console.warn('⚠️ No se pudo guardar usuario en Firestore:', e.message);
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
            currentUser.nombre = userData.username || userData.displayName || 'Usuario';
            currentUser.username = userData.username;
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
    return authState.username || currentUser.nombre || 'Usuario';
}

/**
 * Verifica si "recordarme" está activado
 * @returns {boolean}
 */
function isRememberMeActive() {
    return localStorage.getItem('pool_remember_me') === 'true';
}

// Log al cargar
console.log('📦 firebase-auth-ui.js cargado - Sistema de autenticación SEGURO');
