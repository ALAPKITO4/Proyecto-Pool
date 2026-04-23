/* ============================================
   ADMIN PANEL - FUNCIONALIDADES
   ============================================ */

let adminDb = null;
let adminAuth = null;
let adminUnsubUsers = null;
let adminUnsubPools = null;
let allUsersData = [];
let allPoolsData = [];
let currentAdminUser = null;

const ADMIN_CONFIG = {
    adminEmail: 'admin@pool.com',
    adminUids: []
};

async function initAdmin() {
    initializeFirebase();
    
    if (!FIREBASE_ENABLED) {
        showLoginError('Firebase no está configurado correctamente');
        return;
    }
    
    adminDb = window.db;
    adminAuth = window.auth;
    
    console.log('🔐 Panel de Admin inicializado');
}

async function adminLogin() {
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    
    if (!email || !password) {
        showLoginError('Por favor completa todos los campos');
        return;
    }
    
    try {
        console.log('🔐 Iniciando sesión de admin...');
        
        const userCredential = await adminAuth.signInWithEmailAndPassword(email, password);
        const firebaseUser = userCredential.user;
        
        console.log('✅ Usuario autenticado:', firebaseUser.email);
        
        const userDoc = await adminDb.collection('users').doc(firebaseUser.uid).get();
        
        if (!userDoc.exists) {
            await adminAuth.signOut();
            showLoginError('Este usuario no está registrado en el sistema');
            return;
        }
        
        const userData = userDoc.data();
        
        if (userData.role !== 'admin') {
            await adminAuth.signOut();
            showLoginError('No tienes permisos de administrador');
            return;
        }
        
        currentAdminUser = { uid: firebaseUser.uid, ...userData };
        
        console.log('✅ Admin autenticado:', userData.username);
        
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        document.getElementById('admin-email-display').textContent = userData.email || firebaseUser.email;
        
        loadDashboardData();
        
    } catch (error) {
        console.error('❌ Error de login:', error);
        
        let message = 'Error al iniciar sesión';
        if (error.code === 'auth/user-not-found') {
            message = 'Usuario no encontrado';
        } else if (error.code === 'auth/wrong-password') {
            message = 'Contraseña incorrecta';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Email inválido';
        }
        
        showLoginError(message);
    }
}

function showLoginError(message) {
    const errorDiv = document.getElementById('login-error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

async function adminLogout() {
    try {
        if (adminAuth) {
            await adminAuth.signOut();
        }
        
        currentAdminUser = null;
        
        if (adminUnsubUsers) adminUnsubUsers();
        if (adminUnsubPools) adminUnsubPools();
        
        document.getElementById('admin-dashboard').style.display = 'none';
        document.getElementById('login-screen').style.display = 'flex';
        
        document.getElementById('admin-email').value = '';
        document.getElementById('admin-password').value = '';
        
        console.log('✅ Sesión de admin cerrada');
        
    } catch (error) {
        console.error('❌ Error al cerrar sesión:', error);
    }
}

async function loadDashboardData() {
    await Promise.all([
        loadUsersData(),
        loadPoolsData(),
        loadStats()
    ]);
}

async function loadUsersData() {
    try {
        console.log('👥 Cargando usuarios...');
        
        const snapshot = await adminDb.collection('users').get();
        
        allUsersData = [];
        snapshot.forEach(doc => {
            allUsersData.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`✅ ${allUsersData.length} usuarios cargados`);
        
        renderUsersTable(allUsersData);
        updateUserStats(allUsersData);
        
        if (adminUnsubUsers) adminUnsubUsers();
        adminUnsubUsers = adminDb.collection('users')
            .onSnapshot(snapshot => {
                allUsersData = [];
                snapshot.forEach(doc => {
                    allUsersData.push({ id: doc.id, ...doc.data() });
                });
                renderUsersTable(allUsersData);
                updateUserStats(allUsersData);
                console.log('📡 Usuarios actualizados en tiempo real');
            });
        
    } catch (error) {
        console.error('❌ Error al cargar usuarios:', error);
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('users-table-body');
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    const filterStatus = document.getElementById('user-filter').value;
    
    let filteredUsers = users.filter(user => {
        const matchesSearch = !searchTerm || 
            (user.email && user.email.toLowerCase().includes(searchTerm)) ||
            (user.username && user.username.toLowerCase().includes(searchTerm)) ||
            (user.nombre && user.nombre.toLowerCase().includes(searchTerm));
        
        let matchesFilter = true;
        if (filterStatus === 'active') {
            matchesFilter = user.status !== 'blocked';
        } else if (filterStatus === 'blocked') {
            matchesFilter = user.status === 'blocked';
        } else if (filterStatus === 'admin') {
            matchesFilter = user.role === 'admin';
        }
        
        return matchesSearch && matchesFilter;
    });
    
    tbody.innerHTML = filteredUsers.map(user => {
        const status = user.status === 'blocked' ? 'blocked' : 'active';
        const roleBadge = user.role === 'admin' ? '<span class="badge badge-admin">Admin</span>' : 'Usuario';
        const statusBadge = status === 'blocked' ? 
            '<span class="badge badge-blocked">Bloqueado</span>' : 
            '<span class="badge badge-active">Activo</span>';
        
        const createdDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES') : '-';
        
        return `
            <tr>
                <td>${user.username || user.nombre || '-'}</td>
                <td>${user.email || '-'}</td>
                <td>${roleBadge}</td>
                <td>${statusBadge}</td>
                <td>${createdDate}</td>
                <td>
                    ${user.role !== 'admin' ? `
                        <button class="action-btn btn-warning" onclick="toggleUserBlock('${user.id}')">
                            ${status === 'blocked' ? '✅ Desbloquear' : '🚫 Bloquear'}
                        </button>
                        <button class="action-btn btn-success" onclick="makeUserAdmin('${user.id}')">
                            ⬆️ Admin
                        </button>
                    ` : ''}
                    <button class="action-btn btn-info" onclick="viewUserDetails('${user.id}')">
                        👁️ Ver
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('total-users').textContent = filteredUsers.length;
}

function updateUserStats(users) {
    const activeCount = users.filter(u => u.status !== 'blocked').length;
    const blockedCount = users.filter(u => u.status === 'blocked').length;
    const adminCount = users.filter(u => u.role === 'admin').length;
    
    document.getElementById('active-users').textContent = activeCount;
    document.getElementById('blocked-users').textContent = blockedCount;
    document.getElementById('admin-count').textContent = adminCount;
}

function filterUsers() {
    renderUsersTable(allUsersData);
}

async function toggleUserBlock(uid) {
    try {
        const userDoc = await adminDb.collection('users').doc(uid).get();
        const userData = userDoc.data();
        
        const newStatus = userData.status === 'blocked' ? 'active' : 'blocked';
        
        await adminDb.collection('users').doc(uid).update({
            status: newStatus,
            updatedAt: new Date().toISOString(),
            updatedBy: currentAdminUser.uid
        });
        
        console.log(`✅ Usuario ${uid} ${newStatus === 'blocked' ? 'bloqueado' : 'desbloqueado'}`);
        
    } catch (error) {
        console.error('❌ Error al cambiar estado:', error);
    }
}

async function makeUserAdmin(uid) {
    try {
        if (!confirm('¿Estás seguro de hacer a este usuario ADMIN? Tendrá acceso completo.')) {
            return;
        }
        
        await adminDb.collection('users').doc(uid).update({
            role: 'admin',
            updatedAt: new Date().toISOString(),
            updatedBy: currentAdminUser.uid
        });
        
        console.log(`✅ Usuario ${uid} now is admin`);
        
    } catch (error) {
        console.error('❌ Error al hacer admin:', error);
    }
}

function viewUserDetails(uid) {
    const user = allUsersData.find(u => u.id === uid);
    if (!user) return;
    
    const details = JSON.stringify(user, null, 2);
    alert('Datos del usuario:\n\n' + details);
}

async function loadPoolsData() {
    try {
        console.log('🏊 Cargando pools...');
        
        const snapshot = await adminDb.collection('pools').get();
        
        allPoolsData = [];
        snapshot.forEach(doc => {
            allPoolsData.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`✅ ${allPoolsData.length} pools cargados`);
        
        renderPoolsTable(allPoolsData);
        updatePoolStats(allPoolsData);
        
        if (adminUnsubPools) adminUnsubPools();
        adminUnsubPools = adminDb.collection('pools')
            .onSnapshot(snapshot => {
                allPoolsData = [];
                snapshot.forEach(doc => {
                    allPoolsData.push({ id: doc.id, ...doc.data() });
                });
                renderPoolsTable(allPoolsData);
                updatePoolStats(allPoolsData);
                console.log('📡 Pools actualizados en tiempo real');
            });
        
    } catch (error) {
        console.error('❌ Error al cargar pools:', error);
    }
}

function renderPoolsTable(pools) {
    const tbody = document.getElementById('pools-table-body');
    const searchTerm = document.getElementById('pool-search').value.toLowerCase();
    
    const filteredPools = pools.filter(pool => {
        return !searchTerm || 
            (pool.nombre && pool.nombre.toLowerCase().includes(searchTerm)) ||
            (pool.id && pool.id.toString().includes(searchTerm));
    });
    
    tbody.innerHTML = filteredPools.map(pool => {
        const createdDate = pool.createdAt ? new Date(pool.createdAt).toLocaleDateString('es-ES') : '-';
        const participantes = pool.parents ? pool.parents.length : (pool.invitados ? pool.invitados.length : 0);
        
        return `
            <tr>
                <td>${pool.id || '-'}</td>
                <td>${pool.nombre || '-'}</td>
                <td>${pool.createdByUid || '-'}</td>
                <td>${createdDate}</td>
                <td>${participantes}</td>
                <td>
                    <button class="action-btn btn-danger" onclick="deletePool('${pool.id}')">
                        🗑️ Eliminar
                    </button>
                    <button class="action-btn btn-info" onclick="viewPoolDetails('${pool.id}')">
                        👁️ Ver
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('total-pools').textContent = filteredPools.length;
}

function updatePoolStats(pools) {
    const now = new Date();
    const activeCount = pools.filter(p => {
        if (!pool.fecha) return false;
        return new Date(p.fecha) >= now;
    }).length;
    
    const completedCount = pools.filter(p => {
        if (!pool.fecha) return false;
        return new Date(p.fecha) < now;
    }).length;
    
    document.getElementById('active-pools').textContent = activeCount;
    document.getElementById('completed-pools').textContent = completedCount;
}

function filterPools() {
    renderPoolsTable(allPoolsData);
}

async function deletePool(poolId) {
    try {
        if (!confirm(`¿Estás seguro de eliminar el pool ${poolId}? Esta acción no se puede deshacer.`)) {
            return;
        }
        
        await adminDb.collection('pools').doc(poolId).delete();
        
        console.log(`✅ Pool ${poolId} eliminado`);
        
    } catch (error) {
        console.error('❌ Error al eliminar pool:', error);
    }
}

function viewPoolDetails(poolId) {
    const pool = allPoolsData.find(p => p.id == poolId);
    if (!pool) return;
    
    const details = JSON.stringify(pool, null, 2);
    alert('Datos del pool:\n\n' + details);
}

async function loadStats() {
    const googleUsers = allUsersData.filter(u => u.authMethod === 'google').length;
    const emailUsers = allUsersData.filter(u => u.authMethod === 'email-password').length;
    const appleUsers = allUsersData.filter(u => u.authMethod === 'apple').length;
    
    document.getElementById('google-users').textContent = googleUsers;
    document.getElementById('email-users').textContent = emailUsers;
    document.getElementById('apple-users').textContent = appleUsers;
    
    const recentActivity = [...allUsersData]
        .filter(u => u.createdAt)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);
    
    const activityBody = document.getElementById('activity-table-body');
    activityBody.innerHTML = recentActivity.map(user => `
        <tr>
            <td>${user.username || user.email || '-'}</td>
            <td>Registro</td>
            <td>${new Date(user.createdAt).toLocaleString('es-ES')}</td>
        </tr>
    `).join('');
}

async function loadCollectionData() {
    const collection = document.getElementById('collection-select').value;
    const loadingDiv = document.getElementById('db-loading');
    const contentDiv = document.getElementById('db-content');
    
    loadingDiv.style.display = 'block';
    contentDiv.innerHTML = '';
    
    try {
        console.log(`📂 Cargando colección: ${collection}`);
        
        const snapshot = await adminDb.collection(collection).get();
        
        const data = [];
        snapshot.forEach(doc => {
            data.push({ id: doc.id, ...doc.data() });
        });
        
        loadingDiv.style.display = 'none';
        
        if (data.length === 0) {
            contentDiv.innerHTML = 'No hay datos en esta colección';
        } else {
            contentDiv.innerHTML = JSON.stringify(data, null, 2);
        }
        
        console.log(`✅ ${data.length} documentos cargados de ${collection}`);
        
    } catch (error) {
        loadingDiv.style.display = 'none';
        contentDiv.innerHTML = 'Error al cargar: ' + error.message;
        console.error('❌ Error al cargar colección:', error);
    }
}

function listenToCollection() {
    const collection = document.getElementById('collection-select').value;
    const contentDiv = document.getElementById('db-content');
    
    console.log(`🎧 Escuchando cambios en tiempo real: ${collection}`);
    
    adminDb.collection(collection)
        .onSnapshot(snapshot => {
            const data = [];
            snapshot.forEach(doc => {
                data.push({ id: doc.id, ...doc.data() });
            });
            
            contentDiv.innerHTML = JSON.stringify(data, null, 2);
            console.log(`📡 ${data.length} documentos (tiempo real)`);
        }, error => {
            console.error('❌ Error en listener:', error);
        });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.admin-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    event.target.classList.add('active');
    document.getElementById(`panel-${tabName}`).classList.add('active');
    
    if (tabName === 'database') {
        loadCollectionData();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initAdmin();
});

console.log('📦 admin.js cargado - Panel de Admin listo');