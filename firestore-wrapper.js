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
                
                // 📋 ORDENAR POOLS: Más nuevas arriba (createdAt DESC)
                pools.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateB - dateA; // Descendente: más nueva primero
                });
                
                console.log(`✅ Cargados ${pools.length} pools de Firebase (ordenados por fecha)`);
                return pools;
            } else {
                // Opción 2: localStorage
                const pools = JSON.parse(localStorage.getItem('pool_events') || '[]');
                
                // 📋 ORDENAR POOLS: Más nuevas arriba (createdAt DESC)
                pools.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateB - dateA;
                });
                
                console.log(`📝 Cargados ${pools.length} pools de localStorage (ordenados por fecha)`);
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
        console.log('🗑️ INICIANDO ELIMINACIÓN DEL POOL:', poolId);
        
        let firestoreDeleted = false;
        let localStorageDeleted = false;
        
        try {
            // PASO 1: Eliminar de Firebase PRIMERO (es la fuente de verdad)
            if (FIREBASE_ENABLED && window.db) {
                try {
                    console.log('   📡 Eliminando de Firestore...');
                    const poolRef = window.db.collection('pools').doc(String(poolId));
                    
                    // Verificar que el documento existe antes de eliminar
                    const docSnapshot = await poolRef.get();
                    if (docSnapshot.exists) {
                        await poolRef.delete();
                        console.log('   ✅ Pool ELIMINADO EXITOSAMENTE de Firestore');
                        firestoreDeleted = true;
                        
                        // Verificar que se eliminó
                        const afterDelete = await poolRef.get();
                        if (!afterDelete.exists) {
                            console.log('   ✓ Verificación: El documento NO existe en Firestore (eliminación confirmada)');
                        } else {
                            console.warn('   ⚠️ ADVERTENCIA: El documento AÚN EXISTE en Firestore después de delete');
                        }
                    } else {
                        console.warn('   ⚠️ El documento NO existe en Firestore. Quizás ya fue eliminado.');
                        firestoreDeleted = true; // Considerarlo como eliminado
                    }
                } catch (firestoreError) {
                    console.error('   ❌ ERROR al eliminar de Firestore:', firestoreError.message);
                    console.error('   Código de error:', firestoreError.code);
                    // NO continuar si falla en Firestore
                    throw new Error(`Firestore delete failed: ${firestoreError.message}`);
                }
            } else {
                console.log('   ⚠️ Firebase no disponible, saltando Firestore');
            }
            
            // PASO 2: Solo si Firestore fue exitoso (o no hay Firebase), eliminar de localStorage
            try {
                console.log('   💾 Eliminando de localStorage...');
                let poolsEvents = JSON.parse(localStorage.getItem('pool_events') || '[]');
                const beforeCount = poolsEvents.length;
                poolsEvents = poolsEvents.filter(p => p.id != poolId);
                const afterCount = poolsEvents.length;
                
                if (afterCount < beforeCount) {
                    localStorage.setItem('pool_events', JSON.stringify(poolsEvents));
                    console.log(`   ✅ Eliminado de localStorage (${beforeCount} → ${afterCount} pools)`);
                    localStorageDeleted = true;
                } else {
                    console.log('   ℹ️ El pool no estaba en localStorage');
                    localStorageDeleted = true; // No es un error si no estaba aquí
                }
            } catch (storageError) {
                console.error('   ⚠️ Error al eliminar de localStorage:', storageError.message);
                // Esto no es crítico, continuar
            }
            
            // Resultado final
            const success = firestoreDeleted || !FIREBASE_ENABLED;
            if (success) {
                console.log('✅ ELIMINACIÓN COMPLETADA:', {
                    poolId,
                    firestoreDeleted,
                    localStorageDeleted,
                    firebaseEnabled: FIREBASE_ENABLED
                });
            }
            
            return success;
            
        } catch (error) {
            console.error('❌ ERROR CRÍTICO al eliminar pool:', error.message);
            console.error('   El pool NO fue eliminado. Estado anterior:');
            console.error('   - Firestore eliminado:', firestoreDeleted);
            console.error('   - localStorage eliminado:', localStorageDeleted);
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
                    
                    // 📋 ORDENAR POOLS: Más nuevas arriba (createdAt DESC)
                    pools.sort((a, b) => {
                        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                        return dateB - dateA;
                    });
                    
                    console.log(`📡 ${pools.length} pools en tiempo real (ordenados)`);
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
                }, { merge: true }); // ✅ merge: true para actualizar sin perder datos
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
    
    async getUser(uid = null) {
        try {
            // Determinar qué UID usar
            const targetUid = uid || (window.auth?.currentUser?.uid);
            
            // Firebase
            if (FIREBASE_ENABLED && window.db && targetUid) {
                const doc = await window.db.collection('users').doc(targetUid).get();
                if (doc.exists) {
                    console.log('✅ Usuario cargado de Firebase:', targetUid);
                    return doc.data();
                }
            }
            
            // localStorage (fallback)
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
