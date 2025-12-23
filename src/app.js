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
    supabaseClient.auth.onAuthStateChange((_event, session) => {
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

async function login() {
    const email = prompt("Ingresa tu email para recibir un enlace mágico de acceso:");
    if (!email) return;

    const { error } = await supabaseClient.auth.signInWithOtp({ email });
    if (error) alert('Error: ' + error.message);
    else alert('¡Enlace enviado! Revisa tu correo electrónico.');
}

async function logout() {
    await supabaseClient.auth.signOut();
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
