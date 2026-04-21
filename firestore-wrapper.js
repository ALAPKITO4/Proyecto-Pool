/* ============================================
   WRAPPER DE FIRESTORE - ABSTRACCIÓN
   ============================================
   
   Este módulo proporciona funciones que abstraen
   la lectura/escritura de datos. Usa Firebase si
   está disponible, sino fallback a localStorage.
*/

/**
 * MÓDULO: Pool Data Storage
 * Maneja: Crear, leer, actualizar, eliminar pools
 */
const PoolStorage = {
    
    /**
     * Crea o actualiza un pool
     */
    async savePool(poolEvent) {
        try {
            // Opción 1: Si Firebase está habilitado, guardar en Firestore
            if (FIREBASE_ENABLED && window.db) {
                const docRef = await window.db.collection('pools').doc(String(poolEvent.id)).set({
                    ...poolEvent,
                    participantsUids: poolEvent.parents || [], // Para permisos Firestore
                    createdByUid: currentUser.uid || 'anonymous',
                    lastUpdated: new Date().toISOString()
                }, { merge: true }); // ✅ FIX: merge: true para actualizar sin perder datos
                
                console.log('✅ Pool guardado en Firebase con { merge: true }');
                
                // TAMBIÉN guardar en localStorage como backup
                let poolsEvents = JSON.parse(localStorage.getItem('pool_events') || '[]');
                const existingIndex = poolsEvents.findIndex(p => p.id === poolEvent.id);
                if (existingIndex >= 0) {
                    poolsEvents[existingIndex] = poolEvent;
                } else {
                    poolsEvents.push(poolEvent);
                }
                localStorage.setItem('pool_events', JSON.stringify(poolsEvents));
                
                return true;
            } else {
                // Opción 2: Solo localStorage
                console.log('📝 Pool guardado en localStorage (Firebase no disponible)');
                let poolsEvents = JSON.parse(localStorage.getItem('pool_events') || '[]');
                const existingIndex = poolsEvents.findIndex(p => p.id === poolEvent.id);
                if (existingIndex >= 0) {
                    poolsEvents[existingIndex] = poolEvent;
                } else {
                    poolsEvents.push(poolEvent);
                }
                localStorage.setItem('pool_events', JSON.stringify(poolsEvents));
                return true;
            }
            
        } catch (error) {
            console.error('❌ Error al guardar pool:', error);
            // Fallback a localStorage
            let poolsEvents = JSON.parse(localStorage.getItem('pool_events') || '[]');
            const existingIndex = poolsEvents.findIndex(p => p.id === poolEvent.id);
            if (existingIndex >= 0) {
                poolsEvents[existingIndex] = poolEvent;
            } else {
                poolsEvents.push(poolEvent);
            }
            localStorage.setItem('pool_events', JSON.stringify(poolsEvents));
            return true;
        }
    },
    
    /**
     * Obtiene todos los pools del usuario
     */
    async getAllPools() {
        try {
            // Opción 1: Si Firebase está habilitado
            if (FIREBASE_ENABLED && window.db) {
                let querySnapshot;
                // SIEMPRE traer todos los pools de Firestore (sin filtrar por UID porque no hay auth)
                // Esto permite ver pools creados por otros que aceptaste
                querySnapshot = await window.db.collection('pools').get();
                
                const pools = [];
                querySnapshot.forEach(doc => {
                    pools.push(doc.data());
                });
                
                console.log(`✅ Cargados ${pools.length} pools de Firebase`);
                return pools;
            } else {
                // Opción 2: localStorage
                const pools = JSON.parse(localStorage.getItem('pool_events') || '[]');
                console.log(`📝 Cargados ${pools.length} pools de localStorage`);
                return pools;
            }
            
        } catch (error) {
            console.error('❌ Error al obtener pools:', error);
            // Fallback a localStorage
            const pools = JSON.parse(localStorage.getItem('pool_events') || '[]');
            return pools;
        }
    },
    
/**
      * Obtiene un pool por ID
      */
    async getPoolById(poolId) {
        try {
            // Opción 1: Firebase (sin importar si hay login o no)
            if (FIREBASE_ENABLED && window.db) {
                const doc = await window.db.collection('pools').doc(String(poolId)).get();
                if (doc.exists) {
                    console.log('✅ Pool encontrado en Firebase');
                    return doc.data();
                }
            }
            
            // Opción 2: localStorage
            const pools = JSON.parse(localStorage.getItem('pool_events') || '[]');
            const pool = pools.find(p => p.id == poolId);
            if (pool) {
                console.log('📝 Pool encontrado en localStorage');
                return pool;
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Error al obtener pool:', error);
            const pools = JSON.parse(localStorage.getItem('pool_events') || '[]');
            return pools.find(p => p.id == poolId) || null;
        }
    },
    
    /**
     * Actualiza confirmación de un participante
     */
    async updateParticipantStatus(poolId, participantName, newStatus) {
        try {
            const pool = await this.getPoolById(poolId);
            if (!pool) return false;
            
            // Actualizar estado
            if (pool.invitados) {
                const participant = pool.invitados.find(p => p.nombre === participantName);
                if (participant) {
                    participant.estado = newStatus;
                }
            }
            
            // Guardar cambios
            await this.savePool(pool);
            
            console.log(`✅ Participante ${participantName} actualizado a ${newStatus}`);
            return true;
            
        } catch (error) {
            console.error('❌ Error al actualizar participante:', error);
            return false;
        }
    },
    
    /**
     * Elimina un pool
     */
    async deletePool(poolId) {
        try {
            // Firebase
            if (FIREBASE_ENABLED && window.db) {
                await window.db.collection('pools').doc(String(poolId)).delete();
                console.log('✅ Pool eliminado de Firebase');
            }
            
            // localStorage
            let poolsEvents = JSON.parse(localStorage.getItem('pool_events') || '[]');
            poolsEvents = poolsEvents.filter(p => p.id != poolId);
            localStorage.setItem('pool_events', JSON.stringify(poolsEvents));
            
            return true;
            
        } catch (error) {
            console.error('❌ Error al eliminar pool:', error);
            return false;
        }
    },
    
    /**
     * Suscribirse a cambios en tiempo real
     */
    onPoolUpdates(poolId, callback) {
        try {
            if (FIREBASE_ENABLED && window.db) {
                const unsubscribe = window.db.collection('pools').doc(String(poolId))
                    .onSnapshot(doc => {
                        if (doc.exists) {
                            callback(null, doc.data());
                        } else {
                            callback(new Error('Pool no encontrado'));
                        }
                    }, error => {
                        console.error('Error en listener:', error);
                        callback(error);
                    });
                
                return unsubscribe;
            } else {
                console.log('⚠️ Listeners no disponibles sin Firebase');
                return () => {};
            }
        } catch (error) {
            console.error('❌ Error al crear listener:', error);
            return () => {};
        }
    }
};

/**
 * Suscribirse a TODOS los pools en tiempo real
 */
function subscribeToAllPools(callback) {
    try {
        if (FIREBASE_ENABLED && window.db) {
            const unsubscribe = window.db.collection('pools')
                .onSnapshot(snapshot => {
                    const pools = [];
                    snapshot.forEach(doc => {
                        pools.push({ id: doc.id, ...doc.data() });
                    });
                    console.log(`📡 ${pools.length} pools en tiempo real`);
                    callback(pools);
                }, error => {
                    console.error('Error en listener global:', error);
                });
            
            return unsubscribe;
        } else {
            console.log('⚠️ Listener no disponible sin Firebase');
            return () => {};
        }
    } catch (error) {
        console.error('❌ Error al crear listener global:', error);
        return () => {};
    }
}

/**
 * MÓDULO: User Storage
 * Maneja: Perfil de usuario
 */
const UserStorage = {
    
    async saveUser(userData) {
        try {
            // Firebase
            if (FIREBASE_ENABLED && window.auth && window.auth.currentUser) {
                await window.db.collection('users').doc(window.auth.currentUser.uid).set({
                    ...userData,
                    uid: window.auth.currentUser.uid,
                    email: window.auth.currentUser.email,
                    lastUpdated: new Date().toISOString()
                });
                console.log('✅ Usuario guardado en Firebase');
            }
            
            // localStorage
            localStorage.setItem('pool_user_profile', JSON.stringify(userData));
            console.log('📝 Usuario guardado en localStorage');
            
            return true;
            
        } catch (error) {
            console.error('❌ Error al guardar usuario:', error);
            localStorage.setItem('pool_user_profile', JSON.stringify(userData));
            return true;
        }
    },
    
    async getUser() {
        try {
            // Firebase
            if (FIREBASE_ENABLED && window.auth && window.auth.currentUser) {
                const doc = await window.db.collection('users').doc(window.auth.currentUser.uid).get();
                if (doc.exists) {
                    console.log('✅ Usuario cargado de Firebase');
                    return doc.data();
                }
            }
            
            // localStorage
            const stored = localStorage.getItem('pool_user_profile');
            if (stored) {
                console.log('📝 Usuario cargado de localStorage');
                return JSON.parse(stored);
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Error al obtener usuario:', error);
            const stored = localStorage.getItem('pool_user_profile');
            return stored ? JSON.parse(stored) : null;
        }
    }
};

// Log al cargar
console.log('📦 firestore-wrapper.js cargado - Abstracción lista');
