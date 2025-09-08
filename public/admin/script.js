// Configuración de la API
const API_BASE_URL = window.location.origin;

// Estado global
let users = [];
let subjects = [];
let stats = {};

// Elementos del DOM
const elements = {
    createUserForm: document.getElementById('createUserForm'),
    editUserForm: document.getElementById('editUserForm'),
    usersTable: document.getElementById('usersTable').getElementsByTagName('tbody')[0],
    subjectsContainer: document.getElementById('subjectsContainer'),
    editModal: document.getElementById('editModal'),
    notifications: document.getElementById('notifications')
};

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

// Inicializar la aplicación
async function initializeApp() {
    showLoading('Cargando dashboard...');
    try {
        await Promise.all([
            loadUsers(),
            loadSubjects(),
            loadStats()
        ]);
        hideLoading();
        showNotification('Dashboard cargado exitosamente', 'success');
    } catch (error) {
        hideLoading();
        showNotification('Error al cargar el dashboard: ' + error.message, 'error');
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Formulario de crear usuario
    elements.createUserForm.addEventListener('submit', handleCreateUser);
    
    // Formulario de editar usuario
    elements.editUserForm.addEventListener('submit', handleEditUser);
    
    // Cerrar modal de editar
    document.querySelector('.close').addEventListener('click', closeModal);
    
    // Cerrar modal al hacer click fuera
    window.addEventListener('click', function(event) {
        if (event.target === elements.editModal) {
            closeModal();
        }
        if (event.target === document.getElementById('credentialsModal')) {
            closeCredentialsModal();
        }
    });
    
    // Event listener para el selector de tipo de contraseña
    document.getElementById('passwordOption').addEventListener('change', togglePasswordField);
    
    // Event listeners para botones de toggle de contraseña
    setupPasswordToggleListeners();
    
    // Event listeners para botones del modal de credenciales
    setupCredentialsModalListeners();
    
    // Actualizar datos cada 30 segundos
    setInterval(() => {
        loadUsers();
        loadStats();
    }, 30000);
}

// Configurar event listeners para toggle de contraseña
function setupPasswordToggleListeners() {
    // Delegar eventos para botones de toggle que se crean dinámicamente
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-toggle-password') || 
            e.target.closest('.btn-toggle-password')) {
            e.preventDefault();
            const button = e.target.classList.contains('btn-toggle-password') ? 
                          e.target : e.target.closest('.btn-toggle-password');
            const targetId = button.getAttribute('data-toggle-target');
            if (targetId) {
                togglePasswordVisibility(targetId);
            }
        }
    });
}

// Configurar event listeners para el modal de credenciales
function setupCredentialsModalListeners() {
    // Botón de cerrar credenciales
    const closeCredentialsBtn = document.getElementById('closeCredentialsBtn');
    if (closeCredentialsBtn) {
        closeCredentialsBtn.addEventListener('click', closeCredentialsModal);
    }
    
    // Botón de imprimir
    const printBtn = document.getElementById('printCredentialsBtn');
    if (printBtn) {
        printBtn.addEventListener('click', printCredentials);
    }
    
    // Botón de copiar todo
    const copyAllBtn = document.getElementById('copyAllCredentialsBtn');
    if (copyAllBtn) {
        copyAllBtn.addEventListener('click', copyAllCredentials);
    }
    
    // Botones de copiar individual (delegación de eventos)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-copy') || 
            e.target.closest('.btn-copy')) {
            e.preventDefault();
            const button = e.target.classList.contains('btn-copy') ? 
                          e.target : e.target.closest('.btn-copy');
            const targetId = button.getAttribute('data-copy-target');
            if (targetId) {
                copyToClipboard(targetId);
            }
        }
    });
}

// Cargar usuarios
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/users`);
        if (!response.ok) throw new Error('Error al cargar usuarios');
        
        const data = await response.json();
        users = data.data || [];
        renderUsersTable();
        updateUserStats();
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        showNotification('Error al cargar usuarios', 'error');
    }
}

// Cargar materias
async function loadSubjects() {
    try {
        console.log('Cargando materias desde:', `${API_BASE_URL}/api/questions/subjects`);
        const response = await fetch(`${API_BASE_URL}/api/questions/subjects`);
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Datos de materias recibidos:', data);
        
        subjects = data.data || [];
        console.log('Materias procesadas:', subjects);
        
        renderSubjects();
    } catch (error) {
        console.error('Error cargando materias:', error);
        showNotification(`Error al cargar materias: ${error.message}`, 'error');
        
        // Mostrar mensaje en el contenedor de materias
        if (elements.subjectsContainer) {
            elements.subjectsContainer.innerHTML = `<p class="loading">Error: ${error.message}</p>`;
        }
    }
}

// Cargar estadísticas
async function loadStats() {
    try {
        console.log('Cargando estadísticas desde:', `${API_BASE_URL}/api/questions/stats`);
        const response = await fetch(`${API_BASE_URL}/api/questions/stats`);
        
        console.log('Response status para stats:', response.status);
        
        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Datos de estadísticas recibidos:', data);
        
        stats = data.data || {};
        console.log('Estadísticas procesadas:', stats);
        
        renderStats();
        renderSubjects(); // Las materias dependen de las estadísticas
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
        showNotification(`Error al cargar estadísticas: ${error.message}`, 'error');
        
        // Fallback: crear estadísticas vacías para evitar errores
        stats = { total: 0, bySubject: {}, byType: { normal: 0, general: 0 } };
        renderStats();
    }
}

// Renderizar tabla de usuarios
function renderUsersTable() {
    if (!elements.usersTable) {
        console.error('Elemento usersTable no encontrado');
        return;
    }
    
    elements.usersTable.innerHTML = '';
    
    if (!users || users.length === 0) {
        const row = elements.usersTable.insertRow();
        row.innerHTML = '<td colspan="9" class="text-center">No hay usuarios registrados</td>';
        return;
    }
    
    users.forEach(user => {
        const row = elements.usersTable.insertRow();
        const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Nunca';
        const canTakeGeneral = user.canTakeGeneralExam ? 
            '<span class="badge badge-success">Sí</span>' : 
            '<span class="badge badge-warning">No</span>';
        const isVip = user.hasVipAccess ? 
            '<span class="badge badge-premium">🌟 VIP</span>' : 
            '<span class="badge badge-normal">Normal</span>';
        
        row.innerHTML = `
            <td class="user-avatar">${user.avatar || '👤'}</td>
            <td>${user.name}</td>
            <td><code>${user.id}</code></td>
            <td>${user.totalPoints || 0}</td>
            <td>${user.level || 1}</td>
            <td>${lastLogin}</td>
            <td>${canTakeGeneral}</td>
            <td>${isVip}</td>
            <td>
                <button class="btn-secondary edit-user-btn" data-user-id="${user.id}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-danger delete-user-btn" data-user-id="${user.id}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </td>
        `;
    });
    
    // Agregar event listeners a los botones
    addUserButtonListeners();
}

// Agregar event listeners a los botones de usuarios
function addUserButtonListeners() {
    // Botones de editar
    document.querySelectorAll('.edit-user-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const userId = this.getAttribute('data-user-id');
            console.log('Editando usuario:', userId);
            editUser(userId);
        });
    });
    
    // Botones de eliminar
    document.querySelectorAll('.delete-user-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const userId = this.getAttribute('data-user-id');
            console.log('Eliminando usuario:', userId);
            deleteUser(userId);
        });
    });
}

// Renderizar materias
function renderSubjects() {
    if (!elements.subjectsContainer) {
        console.error('Elemento subjectsContainer no encontrado');
        return;
    }
    
    elements.subjectsContainer.innerHTML = '';
    
    if (!stats || !stats.bySubject || Object.keys(stats.bySubject).length === 0) {
        elements.subjectsContainer.innerHTML = '<p class="loading">No hay datos de materias disponibles</p>';
        return;
    }
    
    try {
        Object.entries(stats.bySubject).forEach(([subject, data]) => {
            const subjectCard = document.createElement('div');
            subjectCard.className = 'subject-card';
            subjectCard.innerHTML = `
                <h3><i class="fas fa-book"></i> ${subject}</h3>
                <div class="subject-stats">
                    <div class="subject-stat">
                        <div class="subject-stat-number">${data.normal || 0}</div>
                        <div class="subject-stat-label">Normales</div>
                    </div>
                    <div class="subject-stat">
                        <div class="subject-stat-number">${data.general || 0}</div>
                        <div class="subject-stat-label">Generales</div>
                    </div>
                    <div class="subject-stat">
                        <div class="subject-stat-number">${data.total || 0}</div>
                        <div class="subject-stat-label">Total</div>
                    </div>
                </div>
            `;
            elements.subjectsContainer.appendChild(subjectCard);
        });
    } catch (error) {
        console.error('Error renderizando materias:', error);
        elements.subjectsContainer.innerHTML = '<p class="loading">Error cargando materias</p>';
    }
}

// Renderizar estadísticas
function renderStats() {
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('totalQuestions').textContent = stats.total || 0;
    document.getElementById('totalSubjects').textContent = Object.keys(stats.bySubject || {}).length;
    
    // Usuarios activos (que han hecho login en los últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsers = users.filter(user => {
        if (!user.lastLogin) return false;
        return new Date(user.lastLogin) > thirtyDaysAgo;
    }).length;
    
    document.getElementById('activeUsers').textContent = activeUsers;
}

// Actualizar estadísticas de usuarios
function updateUserStats() {
    const activeUsers = users.filter(user => {
        if (!user.lastLogin) return false;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(user.lastLogin) > thirtyDaysAgo;
    }).length;
    
    document.getElementById('activeUsers').textContent = activeUsers;
}

// Manejar creación de usuario
async function handleCreateUser(event) {
    event.preventDefault();
    
    const passwordOption = document.getElementById('passwordOption').value;
    const customPassword = document.getElementById('customPassword').value;
    
    // Validar contraseña personalizada si se eligió esa opción
    if (passwordOption === 'custom' && (!customPassword || customPassword.length < 6)) {
        showNotification('La contraseña personalizada debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    const userData = {
        name: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        gender: document.getElementById('userGender').value,
        avatar: document.getElementById('userAvatar').value,
        canTakeGeneralExam: document.getElementById('canTakeGeneralExam').checked,
        hasVipAccess: document.getElementById('hasVipAccess').checked,
        passwordOption: passwordOption,
        customPassword: passwordOption === 'custom' ? customPassword : undefined
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) throw new Error('Error al crear usuario');
        
        const result = await response.json();
        
        // Mostrar credenciales en el modal
        showCredentialsModal(result.data);
        
        showNotification(`Usuario "${userData.name}" creado exitosamente`, 'success');
        elements.createUserForm.reset();
        document.getElementById('customPasswordGroup').style.display = 'none';
        await loadUsers();
        
    } catch (error) {
        console.error('Error creando usuario:', error);
        showNotification('Error al crear usuario: ' + error.message, 'error');
    }
}

// Editar usuario
function editUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUserName').value = user.name;
    document.getElementById('editUserAvatar').value = user.avatar || '👤';
    document.getElementById('editCanTakeGeneralExam').checked = user.canTakeGeneralExam || false;
    
    elements.editModal.style.display = 'block';
}

// Manejar edición de usuario
async function handleEditUser(event) {
    event.preventDefault();
    
    const userId = document.getElementById('editUserId').value;
    const userData = {
        name: document.getElementById('editUserName').value,
        avatar: document.getElementById('editUserAvatar').value,
        canTakeGeneralExam: document.getElementById('editCanTakeGeneralExam').checked
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) throw new Error('Error al actualizar usuario');
        
        showNotification('Usuario actualizado exitosamente', 'success');
        closeModal();
        await loadUsers();
        
    } catch (error) {
        console.error('Error actualizando usuario:', error);
        showNotification('Error al actualizar usuario: ' + error.message, 'error');
    }
}

// Eliminar usuario
async function deleteUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    if (!confirm(`¿Estás seguro de que deseas eliminar al usuario "${user.name}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Error al eliminar usuario');
        
        showNotification(`Usuario "${user.name}" eliminado exitosamente`, 'success');
        await loadUsers();
        
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        showNotification('Error al eliminar usuario: ' + error.message, 'error');
    }
}

// Cerrar modal
function closeModal() {
    elements.editModal.style.display = 'none';
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    elements.notifications.appendChild(notification);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// Mostrar estado de carga
function showLoading(message = 'Cargando...') {
    const loading = document.createElement('div');
    loading.id = 'loadingIndicator';
    loading.className = 'loading';
    loading.textContent = message;
    document.body.appendChild(loading);
}

// Ocultar estado de carga
function hideLoading() {
    const loading = document.getElementById('loadingIndicator');
    if (loading) {
        loading.parentNode.removeChild(loading);
    }
}

// Funciones utilitarias
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatNumber(number) {
    return new Intl.NumberFormat('es-ES').format(number);
}

// Mostrar modal de credenciales
function showCredentialsModal(userData) {
    document.getElementById('createdUserName').textContent = userData.displayUsername || userData.username || userData.name;
    document.getElementById('createdUserId').textContent = userData.id;
    document.getElementById('createdUserPassword').textContent = userData.plainPassword || '••••••••';
    
    document.getElementById('credentialsModal').style.display = 'block';
}

// Cerrar modal de credenciales
function closeCredentialsModal() {
    document.getElementById('credentialsModal').style.display = 'none';
}

// Alternar visibilidad del campo de contraseña personalizada
function togglePasswordField() {
    const passwordOption = document.getElementById('passwordOption').value;
    const customPasswordGroup = document.getElementById('customPasswordGroup');
    
    if (passwordOption === 'custom') {
        customPasswordGroup.style.display = 'block';
        document.getElementById('customPassword').setAttribute('required', 'required');
    } else {
        customPasswordGroup.style.display = 'none';
        document.getElementById('customPassword').removeAttribute('required');
        document.getElementById('customPassword').value = '';
    }
}

// Alternar visibilidad de contraseña
function togglePasswordVisibility(elementId) {
    const element = document.getElementById(elementId);
    const button = element.parentNode.querySelector('.btn-toggle-password i') || 
                   element.nextElementSibling.querySelector('i');
    
    if (element.type === 'password' || element.classList.contains('password-display')) {
        if (element.type) {
            element.type = 'text';
        } else {
            element.classList.add('visible');
        }
        button.className = 'fas fa-eye-slash';
    } else {
        if (element.type) {
            element.type = 'password';
        } else {
            element.classList.remove('visible');
        }
        button.className = 'fas fa-eye';
    }
}

// Copiar al portapapeles
async function copyToClipboard(elementId) {
    try {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error('Elemento no encontrado:', elementId);
            showNotification('Error: elemento no encontrado', 'error');
            return;
        }
        
        const text = element.textContent || element.value || element.innerText;
        
        if (!text) {
            showNotification('No hay texto para copiar', 'warning');
            return;
        }
        
        // Intentar usar la API moderna del portapapeles
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            showNotification('Copiado al portapapeles', 'success');
        } else {
            // Fallback para navegadores más antiguos o contextos no seguros
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            textArea.setSelectionRange(0, 99999); // Para dispositivos móviles
            
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (success) {
                showNotification('Copiado al portapapeles', 'success');
            } else {
                showNotification('Error al copiar', 'error');
            }
        }
    } catch (error) {
        console.error('Error copiando al portapapeles:', error);
        showNotification('Error al copiar: ' + error.message, 'error');
    }
}

// Copiar todas las credenciales
async function copyAllCredentials() {
    try {
        const name = document.getElementById('createdUserName').textContent;
        const userId = document.getElementById('createdUserId').textContent;
        const password = document.getElementById('createdUserPassword').textContent;
        
        if (!name || !userId || !password) {
            showNotification('Error: faltan datos de credenciales', 'error');
            return;
        }
        
        const credentialsText = `Credenciales de Usuario - App Ejército
=====================================
Usuario: ${name}
ID: ${userId}
Contraseña: ${password}
=====================================
Fecha: ${new Date().toLocaleString()}`;
        
        // Usar la API moderna del portapapeles
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(credentialsText);
            showNotification('Todas las credenciales copiadas al portapapeles', 'success');
        } else {
            // Fallback
            const textArea = document.createElement('textarea');
            textArea.value = credentialsText;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (success) {
                showNotification('Todas las credenciales copiadas al portapapeles', 'success');
            } else {
                showNotification('Error al copiar credenciales', 'error');
            }
        }
    } catch (error) {
        console.error('Error copiando credenciales:', error);
        showNotification('Error al copiar: ' + error.message, 'error');
    }
}

// Imprimir credenciales
function printCredentials() {
    try {
        const name = document.getElementById('createdUserName').textContent;
        const userId = document.getElementById('createdUserId').textContent;
        const password = document.getElementById('createdUserPassword').textContent;
        
        if (!name || !userId || !password) {
            showNotification('Error: faltan datos para imprimir', 'error');
            return;
        }
        
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
            showNotification('Error: no se pudo abrir ventana de impresión. Verifica el bloqueador de popups.', 'error');
            return;
        }
        
        const printContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Credenciales de Usuario - App Ejército</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            margin: 0;
            background: white;
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #3498db;
            padding-bottom: 20px;
        }
        .credentials { 
            background: #f9f9f9; 
            padding: 20px; 
            border-radius: 8px; 
            border: 1px solid #ddd;
        }
        .credential { 
            margin: 15px 0; 
            display: flex;
            align-items: center;
        }
        .label { 
            font-weight: bold; 
            width: 150px;
            color: #2c3e50;
        }
        .value { 
            font-family: 'Courier New', monospace; 
            background: white; 
            padding: 8px 12px; 
            border-radius: 4px; 
            border: 1px solid #bdc3c7;
            flex: 1;
        }
        .footer { 
            margin-top: 30px; 
            text-align: center; 
            color: #666; 
            font-size: 14px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        @media print { 
            .no-print { display: none; } 
            body { margin: 0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>🪖 App Ejército - Credenciales de Usuario</h2>
    </div>
    <div class="credentials">
        <div class="credential">
            <div class="label">Usuario:</div>
            <div class="value">${name}</div>
        </div>
        <div class="credential">
            <div class="label">ID de Usuario:</div>
            <div class="value">${userId}</div>
        </div>
        <div class="credential">
            <div class="label">Contraseña:</div>
            <div class="value">${password}</div>
        </div>
    </div>
    <div class="footer">
        <p>Fecha de creación: ${new Date().toLocaleString()}</p>
        <p><strong>Importante:</strong> Mantener estas credenciales en lugar seguro.</p>
    </div>
    <script>
        window.onload = function() {
            window.print();
        };
    </script>
</body>
</html>`;
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        showNotification('Abriendo ventana de impresión...', 'success');
        
    } catch (error) {
        console.error('Error imprimiendo credenciales:', error);
        showNotification('Error al imprimir: ' + error.message, 'error');
    }
}

// Generar contraseña aleatoria (función auxiliar para el backend)
function generateRandomPassword(length = 8) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

// Solo exportar las funciones que realmente necesitan ser globales
window.editUser = editUser;
window.deleteUser = deleteUser;