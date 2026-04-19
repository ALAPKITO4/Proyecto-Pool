/* ============================================
   AUTENTICACIÓN CON FIREBASE + GOOGLE SIGN-IN
   ============================================
   
   Maneja:
   - Google Sign-In
   - Login
   - Logout
   - Persistencia de sesión
   - Sincronización con currentUser
*/

/**
 * Objeto que mantiene el estado de autenticación
 */
const authState = {
    isAuthenticated: false,
    uid: null,
    email: null,
    displayName: null,
    photoURL: null
};

/**
 * Inicializa el sistema de autenticación
 */
function initializeAuth() {
    try {
        if (!FIREBASE_ENABLED || !window.auth) {
            console.log('⚠️ Firebase Auth no disponible');
            return;
        }
        
        // Escuchar cambios de autenticación
        window.auth.onAuthStateChanged(async (user) => {
            if (user) {
                console.log('✅ Usuario autenticado:', user.email);
                
                // Actualizar estado global
                authState.isAuthenticated = true;
                authState.uid = user.uid;
                authState.email = user.email;
                authState.displayName = user.displayName;
                authState.photoURL = user.photoURL;
                
                // Sincronizar con currentUser
                if (currentUser) {
                    currentUser.uid = user.uid;
                    currentUser.email = user.email;
                    if (user.displayName) currentUser.nombre = user.displayName;
                    if (user.photoURL) currentUser.foto = user.photoURL;
                }
                
                // Ocultar botón de Google Sign-In
                hideGoogleSignInButton();
                
                // Cargar perfil del usuario
                await loadUserProfileFromFirebase();
                
            } else {
                console.log('⚠️ Usuario no autenticado');
                authState.isAuthenticated = false;
                authState.uid = null;
                authState.email = null;
                authState.displayName = null;
                authState.photoURL = null;
                
                // Mostrar botón de Google Sign-In
                showGoogleSignInButton();
            }
        });
        
    } catch (error) {
        console.error('❌ Error al inicializar auth:', error);
    }
}

/**
 * Inicia sesión con Google
 */
async function signInWithGoogle() {
    try {
        if (!FIREBASE_ENABLED || !window.auth) {
            showNotification('⚠️ Autenticación no disponible', 'warning');
            return false;
        }
        
        const provider = new firebase.auth.GoogleAuthProvider();
        
        // Mostrar popup de Google
        const result = await window.auth.signInWithPopup(provider);
        
        console.log('✅ Sesión con Google iniciada:', result.user.email);
        
        // Crear perfil en Firebase si no existe
        await UserStorage.saveUser({
            nombre: result.user.displayName || 'Usuario',
            email: result.user.email,
            telefono: '',
            foto: result.user.photoURL || null,
            uid: result.user.uid
        });
        
        return true;
        
    } catch (error) {
        if (error.code === 'auth/popup-closed-by-user') {
            console.log('⚠️ Popup cerrado por usuario');
        } else {
            console.error('❌ Error al iniciar con Google:', error);
            showNotification('Error al iniciar sesión', 'error');
        }
        return false;
    }
}

/**
 * Cierra sesión
 */
async function signOut() {
    try {
        if (FIREBASE_ENABLED && window.auth) {
            await window.auth.signOut();
            console.log('✅ Sesión cerrada');
            showNotification('Sesión cerrada', 'success');
        }
        
        // Reiniciar app
        setTimeout(() => restart(), 1500);
        
    } catch (error) {
        console.error('❌ Error al cerrar sesión:', error);
    }
}

/**
 * Muestra el botón de Google Sign-In
 */
function showGoogleSignInButton() {
    const btn = document.getElementById('googleSignInBtn');
    if (btn) {
        btn.style.display = 'block';
    }
}

/**
 * Oculta el botón de Google Sign-In
 */
function hideGoogleSignInButton() {
    const btn = document.getElementById('googleSignInBtn');
    if (btn) {
        btn.style.display = 'none';
    }
}

/**
 * Carga el perfil del usuario desde Firebase
 */
async function loadUserProfileFromFirebase() {
    try {
        const userData = await UserStorage.getUser();
        if (userData) {
            currentUser.nombre = userData.nombre || currentUser.nombre;
            currentUser.telefono = userData.telefono || currentUser.telefono;
            currentUser.foto = userData.foto || currentUser.foto;
            currentUser.uid = userData.uid || authState.uid;
            
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
        if (FIREBASE_ENABLED && window.auth.currentUser) {
            // Actualizar Firebase Auth
            await window.auth.currentUser.updateProfile({
                displayName: currentUser.nombre,
                photoURL: currentUser.foto
            });
            
            // Actualizar Firestore
            await UserStorage.saveUser({
                nombre: currentUser.nombre,
                telefono: currentUser.telefono,
                foto: currentUser.foto,
                email: authState.email,
                uid: authState.uid
            });
            
            console.log('✅ Perfil actualizado en Firebase');
            return true;
        } else {
            // Solo localStorage
            console.log('📝 Perfil actualizado en localStorage');
            await UserStorage.saveUser(currentUser);
            return true;
        }
    } catch (error) {
        console.error('❌ Error al actualizar perfil:', error);
        return false;
    }
}

/**
 * Verifica si el usuario está autenticado
 */
function isUserAuthenticated() {
    return authState.isAuthenticated;
}

/**
 * Obtiene el ID único del usuario
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

// Log al cargar
console.log('📦 firebase-auth-ui.js cargado - Autenticación lista');
