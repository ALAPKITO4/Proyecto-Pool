/* ============================================
   CONFIGURACIÓN DE FIREBASE
   ============================================ */

/**
 * IMPORTANTE: Debes crear tu proyecto en Firebase y reemplazar estas credenciales
 * 
 * PASOS:
 * 1. Ir a https://console.firebase.google.com
 * 2. Click en "Crear Proyecto"
 * 3. Nombre: "pool-app"
 * 4. Crear proyecto
 * 5. En la sección "Compilación", activar:
 *    - Cloud Firestore
 *    - Authentication
 * 6. En Authentication, habilitar "Google"
 * 7. En Project Settings, copiar la config web
 * 8. Reemplazar los valores a continuación
 */

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyA2veaCsBBMxFozXw4iyWDFhU0L_phFoNo",
    authDomain: "pool-909a8.firebaseapp.com",
    projectId: "pool-909a8",
    storageBucket: "pool-909a8.appspot.com",
    messagingSenderId: "235736364004",
    appId: "1:235736364004:web:24d4f21dc3089789324df1"
};

/**
 * Flag para indicar si Firebase está disponible
 * Si no está configurado correctamente, la app usará localStorage automáticamente
 */
let FIREBASE_ENABLED = false;

/**
 * Verifica si Firebase está configurado correctamente
 */
function isFirebaseConfigured() {
    return FIREBASE_CONFIG.apiKey && 
           FIREBASE_CONFIG.apiKey !== 'TU_API_KEY_AQUI' &&
           FIREBASE_CONFIG.projectId && 
           FIREBASE_CONFIG.projectId !== 'pool-app-xxxxxx';
}

/**
 * Inicializa Firebase
 * Si hay error, la app continúa sin Firebase (fallback a localStorage)
 */
function initializeFirebase() {
    try {
        // Verificar que Firebase está disponible globalmente
        if (typeof firebase === 'undefined') {
            console.warn('⚠️ Firebase SDK no cargó correctamente. Usando localStorage.');
            return false;
        }

        // Inicializar Firebase con config
        firebase.initializeApp(FIREBASE_CONFIG);
        
        // Obtener referencias globales
        window.db = firebase.firestore();
        window.auth = firebase.auth();
        
        console.log('✅ Firebase inicializado correctamente');
        FIREBASE_ENABLED = true;
        return true;
        
    } catch (error) {
        console.error('❌ Error al inicializar Firebase:', error);
        console.warn('⚠️ La app continuará sin Firebase, usando localStorage.');
        FIREBASE_ENABLED = false;
        return false;
    }
}

/**
 * Verifica si el proyecto está correctamente configurado
 */
function checkFirebaseConfig() {
    const hasAllKeys = 
        FIREBASE_CONFIG.apiKey !== 'TU_API_KEY_AQUI' &&
        FIREBASE_CONFIG.projectId !== 'pool-app-xxxxxx';
    
    if (!hasAllKeys) {
        console.warn('⚠️ Firebase no configurado. Reemplaza los valores en firebase-config.js');
        return false;
    }
    
    return true;
}

// Log al cargar el script
console.log('📦 firebase-config.js cargado');

