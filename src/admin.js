// Configuración de Supabase
const SUPABASE_URL = 'https://jzzrnuxwjygtluuopewp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6enJudXh3anlndGx1dW9wZXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDQyNzYsImV4cCI6MjA4MjA4MDI3Nn0.MbYdoRXnIc93ZFuFUCtLr11x6GZmMCrZShQeD2gDJfE';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variables de Gráficos
let distributionChart;
let timelineChart;

// Inicialización
window.addEventListener('load', async () => {
    initCharts();
    // Los datos se cargarán solo tras poner la contraseña
});

// Seguridad Admin
function checkAdminPassword() {
    const input = document.getElementById('admin-password-input');
    const errorMsg = document.getElementById('admin-error-msg');
    
    // ⚠️ CONTRASEÑA DE ADMINISTRADOR ⚠️
    // Puedes cambiarla aquí por la que tú quieras
    const ADMIN_PASS = "admin1234";

    if (input.value === ADMIN_PASS) {
        // Contraseña correcta
        document.getElementById('admin-login-modal').classList.add('hidden');
        document.getElementById('dashboard-content').classList.remove('hidden');
        
        // Cargar datos ahora que estamos autorizados
        loadInitialData();
        subscribeToRealtime();
    } else {
        // Contraseña incorrecta
        errorMsg.classList.remove('hidden');
        input.classList.add('border-red-500');
        input.value = '';
        input.focus();
    }
}

function initCharts() {
    // Gráfico de Distribución (Pie/Bar)
    const ctxDist = document.getElementById('distributionChart').getContext('2d');
    distributionChart = new Chart(ctxDist, {
        type: 'bar',
        data: {
            labels: ['Muy Frío (-2)', 'Fresco (-1)', 'Bien (0)', 'Calor (1)', 'Muy Calor (2)'],
            datasets: [{
                label: 'Votos',
                data: [0, 0, 0, 0, 0],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.6)', // Azul
                    'rgba(147, 197, 253, 0.6)', // Azul claro
                    'rgba(34, 197, 94, 0.6)',  // Verde
                    'rgba(251, 146, 60, 0.6)', // Naranja
                    'rgba(239, 68, 68, 0.6)'   // Rojo
                ],
                borderColor: [
                    'rgb(59, 130, 246)',
                    'rgb(147, 197, 253)',
                    'rgb(34, 197, 94)',
                    'rgb(251, 146, 60)',
                    'rgb(239, 68, 68)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });

    // Gráfico de Línea Temporal
    const ctxTime = document.getElementById('timelineChart').getContext('2d');
    timelineChart = new Chart(ctxTime, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Sensación Térmica',
                data: [],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: { 
                y: { 
                    min: -2, 
                    max: 2,
                    ticks: { stepSize: 1 }
                } 
            }
        }
    });
}

async function loadInitialData() {
    // Obtener todos los votos (Limitado a últimos 100 para demo)
    const { data, error } = await supabaseClient
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error cargando datos:', error);
        alert('Error cargando datos. Asegúrate de haber ejecutado el script de políticas SQL.');
        return;
    }

    updateDashboard(data);
}

function updateDashboard(data) {
    // 1. Actualizar Stats
    document.getElementById('total-votes').textContent = data.length;
    
    if (data.length > 0) {
        const sum = data.reduce((acc, curr) => acc + curr.voto, 0);
        const avg = (sum / data.length).toFixed(2);
        document.getElementById('avg-comfort').textContent = avg;
        document.getElementById('avg-comfort').className = `text-3xl font-bold ${getColorForValue(avg)}`;
        document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
    }

    // 2. Actualizar Gráfico Distribución
    const counts = [0, 0, 0, 0, 0]; // -2, -1, 0, 1, 2
    data.forEach(d => {
        const index = d.voto + 2; // Map -2..2 to 0..4
        if (index >= 0 && index <= 4) counts[index]++;
    });
    distributionChart.data.datasets[0].data = counts;
    distributionChart.update();

    // 3. Actualizar Gráfico Temporal (Invertir array para cronológico)
    const timelineData = [...data].reverse().slice(-20); // Últimos 20
    timelineChart.data.labels = timelineData.map(d => new Date(d.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
    timelineChart.data.datasets[0].data = timelineData.map(d => d.voto);
    timelineChart.update();

    // 4. Actualizar Tabla
    const tbody = document.getElementById('feed-body');
    tbody.innerHTML = '';
    data.slice(0, 10).forEach(d => { // Mostrar últimos 10
        const row = `
            <tr class="bg-white border-b hover:bg-gray-50">
                <td class="px-6 py-4">${new Date(d.created_at).toLocaleTimeString()}</td>
                <td class="px-6 py-4">${d.aula_id}</td>
                <td class="px-6 py-4 font-bold ${getColorForValue(d.voto)}">${getLabelForValue(d.voto)}</td>
                <td class="px-6 py-4 text-xs text-gray-400">${d.user_id ? 'Registrado' : 'Anónimo'}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function subscribeToRealtime() {
    supabaseClient
        .channel('public:feedback')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedback' }, payload => {
            console.log('Nuevo voto recibido!', payload);
            // Recargar datos completos para simplificar actualización de gráficos
            // En producción, optimizaríamos haciendo push al array local
            loadInitialData(); 
        })
        .subscribe();
}

// Helpers
function getColorForValue(val) {
    val = parseFloat(val);
    if (val <= -1.5) return 'text-blue-600';
    if (val <= -0.5) return 'text-blue-400';
    if (val >= 1.5) return 'text-red-600';
    if (val >= 0.5) return 'text-orange-500';
    return 'text-green-600';
}

function getLabelForValue(val) {
    if (val === -2) return 'Muy Frío';
    if (val === -1) return 'Fresco';
    if (val === 0) return 'Bien';
    if (val === 1) return 'Calor';
    if (val === 2) return 'Muy Calor';
    return val;
}
