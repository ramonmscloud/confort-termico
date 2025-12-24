// Configuración de Supabase
const SUPABASE_URL = 'https://jzzrnuxwjygtluuopewp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6enJudXh3anlndGx1dW9wZXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDQyNzYsImV4cCI6MjA4MjA4MDI3Nn0.MbYdoRXnIc93ZFuFUCtLr11x6GZmMCrZShQeD2gDJfE';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Estado
let currentAulaId = 1;
let currentUser = null;

// Inicialización
window.addEventListener('load', async () => {
    // Detectar aula
    const urlParams = new URLSearchParams(window.location.search);
    const aulaParam = urlParams.get('aula');
    if (aulaParam) currentAulaId = parseInt(aulaParam);

    // Verificar sesión
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        handleUserLogin(session.user);
    }

    // Escuchar cambios de auth
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
            // El usuario ha hecho clic en el enlace de recuperación
            // Mostramos el modal de cambio de contraseña inmediatamente
            openChangePasswordModal();
            alert("Por favor, establece tu nueva contraseña ahora.");
        }
        
        if (session) handleUserLogin(session.user);
        else handleUserLogout();
    });
});

// Gestión de Usuarios
async function handleUserLogin(user) {
    currentUser = user;
    document.getElementById('login-btn').classList.add('hidden');
    document.getElementById('user-info').classList.remove('hidden');
    document.getElementById('user-email').textContent = user.email.split('@')[0]; // Mostrar solo parte local del email
    
    await fetchPoints();
}

function handleUserLogout() {
    currentUser = null;
    document.getElementById('login-btn').classList.remove('hidden');
    document.getElementById('user-info').classList.add('hidden');
}

function login() {
    document.getElementById('auth-modal').classList.remove('hidden');
}

function closeAuthModal() {
    document.getElementById('auth-modal').classList.add('hidden');
}

async function handleAuth(type) {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    if (!email || !password) {
        alert("Por favor, introduce email y contraseña");
        return;
    }

    let error = null;
    
    if (type === 'signup') {
        const { error: signUpError } = await supabaseClient.auth.signUp({
            email,
            password
        });
        error = signUpError;
        if (!error) {
            alert("¡Registro exitoso! Si no entras automáticamente, pulsa 'Entrar'.");
        }
    } else {
        const { error: signInError } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        error = signInError;
    }

    if (error) {
        alert("Error: " + error.message);
    } else {
        closeAuthModal();
    }
}

// Gestión de Cambio de Contraseña
function openChangePasswordModal() {
    document.getElementById('change-password-modal').classList.remove('hidden');
}

function closeChangePasswordModal() {
    document.getElementById('change-password-modal').classList.add('hidden');
    document.getElementById('new-password').value = '';
}

async function handleChangePassword() {
    const newPassword = document.getElementById('new-password').value;
    
    if (!newPassword) {
        alert("Por favor, ingresa una nueva contraseña");
        return;
    }

    if (newPassword.length < 6) {
        alert("La contraseña debe tener al menos 6 caracteres");
        return;
    }

    const { error } = await supabaseClient.auth.updateUser({ 
        password: newPassword 
    });

    if (error) {
        alert("Error al actualizar contraseña: " + error.message);
    } else {
        alert("¡Contraseña actualizada correctamente!");
        closeChangePasswordModal();
    }
}

async function logout() {
    await supabaseClient.auth.signOut();
}

// Gestión de Recuperación de Contraseña
function openForgotPasswordModal() {
    closeAuthModal(); // Cerrar el de login si está abierto
    document.getElementById('forgot-password-modal').classList.remove('hidden');
}

function closeForgotPasswordModal() {
    document.getElementById('forgot-password-modal').classList.add('hidden');
    document.getElementById('recovery-email').value = '';
    document.getElementById('recovery-message').classList.add('hidden');
}

async function sendPasswordResetEmail(btnElement) {
    const email = document.getElementById('recovery-email').value;
    const msgDiv = document.getElementById('recovery-message');
    
    // Reset mensaje
    msgDiv.classList.add('hidden');
    msgDiv.className = 'hidden text-sm p-2 rounded text-center';

    if (!email) {
        msgDiv.textContent = "Por favor, ingresa tu email.";
        msgDiv.className = "text-sm p-2 rounded text-center bg-red-100 text-red-700 block";
        return;
    }

    const originalText = btnElement.innerText;
    btnElement.innerText = "Enviando...";
    btnElement.disabled = true;

    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin // Redirige aquí para que detectemos el evento PASSWORD_RECOVERY
        });

        if (error) {
            console.error("Error recuperación:", error);
            msgDiv.className = "text-sm p-2 rounded text-center bg-red-100 text-red-700 block";
            
            if (error.message.includes("rate limit")) {
                msgDiv.textContent = "⚠️ Demasiados intentos. Espera un poco.";
            } else {
                msgDiv.textContent = "Error: " + error.message;
            }
        } else {
            msgDiv.className = "text-sm p-2 rounded text-center bg-green-100 text-green-700 block";
            msgDiv.textContent = "✅ Correo enviado. Revisa tu bandeja de entrada (y spam).";
            // No cerramos el modal inmediatamente para que lea el mensaje
        }
    } catch (err) {
        msgDiv.className = "text-sm p-2 rounded text-center bg-red-100 text-red-700 block";
        msgDiv.textContent = "Error inesperado: " + err.message;
    } finally {
        btnElement.innerText = originalText;
        btnElement.disabled = false;
    }
}

async function fetchPoints() {
    if (!currentUser) return;
    
    const { data, error } = await supabaseClient
        .from('perfiles')
        .select('puntos')
        .eq('id', currentUser.id)
        .single();
    
    if (data) {
        document.getElementById('user-points').textContent = `${data.puntos} pts`;
    }
}

// Función para votar
async function votar(valor) {
    const statusDiv = document.getElementById('status-message');
    statusDiv.className = 'p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50';
    statusDiv.innerHTML = 'Enviando tu voto...';
    statusDiv.classList.remove('hidden');

    try {
        let sessionId = localStorage.getItem('confort_session_id');
        if (!sessionId) {
            sessionId = crypto.randomUUID();
            localStorage.setItem('confort_session_id', sessionId);
        }

        const payload = { 
            aula_id: currentAulaId, 
            voto: valor,
            session_id: sessionId
        };

        // Si hay usuario, añadir ID para ganar puntos
        if (currentUser) {
            payload.user_id = currentUser.id;
        }

        const { error } = await supabaseClient.from('feedback').insert([payload]);

        if (error) throw error;

        statusDiv.className = 'p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50';
        statusDiv.innerHTML = currentUser 
            ? '¡Voto registrado! +10 puntos añadidos.' 
            : '¡Voto registrado! Inicia sesión para ganar puntos.';
        
        // Actualizar puntos si está logueado
        if (currentUser) {
            setTimeout(fetchPoints, 1000); // Esperar un poco al trigger
        }

    } catch (err) {
        console.error('Error al votar:', err);
        statusDiv.className = 'p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50';
        statusDiv.innerHTML = `Error: ${err.message || JSON.stringify(err)}`;
    }
}
