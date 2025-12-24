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
        loadLeaderboard();
        loadConfig();
        loadAulasConfig();
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
    document.getElementById('last-update').textContent = new Date().toLocaleTimeString();

    // Calcular y mostrar promedio por aula
    const aulasAvgContainer = document.getElementById('aulas-avg-container');
    aulasAvgContainer.innerHTML = '';

    if (data.length > 0) {
        // Agrupar por aula
        const aulasGroups = {};
        data.forEach(d => {
            if (!aulasGroups[d.aula_id]) aulasGroups[d.aula_id] = [];
            aulasGroups[d.aula_id].push(d.voto);
        });

        // Calcular promedios y renderizar
        Object.keys(aulasGroups).sort((a, b) => a - b).forEach(aulaId => {
            const votes = aulasGroups[aulaId];
            const avg = (votes.reduce((a, b) => a + b, 0) / votes.length).toFixed(2);
            
            const div = document.createElement('div');
            div.className = 'bg-gray-50 p-3 rounded border text-center';
            div.innerHTML = `
                <div class="text-xs text-gray-500 uppercase font-bold mb-1">Aula ${aulaId}</div>
                <div class="text-2xl font-bold ${getColorForValue(avg)}">${avg}</div>
                <div class="text-xs text-gray-400">${votes.length} votos</div>
            `;
            aulasAvgContainer.appendChild(div);
        });
    } else {
        aulasAvgContainer.innerHTML = '<p class="text-gray-400 text-sm col-span-full">No hay datos suficientes.</p>';
    }

    // 2. Actualizar Gráfico Distribución
    const counts = [0, 0, 0, 0, 0]; // -2, -1, 0, 1, 2
    data.forEach(d => {
        const index = d.voto + 2; // Map -2..2 to 0..4
        if (index >= 0 && index <= 4) counts[index]++;
    });
    distributionChart.data.datasets[0].data = counts;
    distributionChart.update();

    // 3. Actualizar Gráfico Temporal (Por Aula)
    const timelineData = [...data].reverse(); // Usar todos los datos cargados (100) para tener mejor histórico
    
    // Agrupar por Aula
    const aulas = {};
    timelineData.forEach(d => {
        if (!aulas[d.aula_id]) aulas[d.aula_id] = [];
        aulas[d.aula_id].push(d);
    });

    // Generar datasets
    const datasets = Object.keys(aulas).map(aulaId => {
        const aulaData = aulas[aulaId];
        const color = getColorForAula(aulaId);
        
        return {
            label: `Aula ${aulaId}`,
            data: aulaData.map(d => ({
                x: new Date(d.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                y: d.voto
            })),
            borderColor: color,
            backgroundColor: color,
            tension: 0.3,
            pointRadius: 4,
            fill: false
        };
    });

    // Usamos un set de todas las etiquetas de tiempo para el eje X (opcional, Chart.js lo maneja bien si pasamos objetos x/y pero en line chart espera labels comunes a veces)
    // Para simplificar en este gráfico básico, usaremos las etiquetas de TODOS los puntos ordenados
    timelineChart.data.labels = timelineData.map(d => new Date(d.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
    timelineChart.data.datasets = datasets;
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

async function loadLeaderboard() {
    const { data, error } = await supabaseClient
        .from('perfiles')
        .select('email, puntos')
        .order('puntos', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error cargando leaderboard:', error);
        return;
    }

    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';
    data.forEach(user => {
        // Mask email for privacy
        const emailParts = user.email.split('@');
        const maskedEmail = emailParts[0]; // Mostrar solo parte local
        
        const row = `
            <tr class="bg-white border-b hover:bg-gray-50">
                <td class="px-4 py-3 font-medium text-gray-900">${maskedEmail}</td>
                <td class="px-4 py-3 text-right font-bold text-blue-600">${user.puntos} pts</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function subscribeToRealtime() {
    // Canal de Feedback
    supabaseClient
        .channel('public:feedback')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedback' }, payload => {
            console.log('Nuevo voto recibido!', payload);
            loadInitialData(); 
        })
        .subscribe();

    // Canal de Perfiles (Puntos)
    supabaseClient
        .channel('public:perfiles')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'perfiles' }, payload => {
            console.log('Puntos actualizados!', payload);
            loadLeaderboard(); 
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

function getColorForAula(id) {
    // Generar un color consistente basado en el ID del aula
    const colors = [
        '#2563eb', // Blue 600
        '#dc2626', // Red 600
        '#16a34a', // Green 600
        '#d97706', // Amber 600
        '#9333ea', // Purple 600
        '#0891b2', // Cyan 600
        '#be123c', // Rose 700
        '#4d7c0f', // Lime 700
        '#4338ca', // Indigo 700
        '#b45309'  // Amber 700
    ];
    return colors[id % colors.length];
}

// --- Configuración ---

async function loadConfig() {
    const { data, error } = await supabaseClient
        .from('config')
        .select('value')
        .eq('key', 'min_vote_interval_minutes')
        .single();

    if (data) {
        document.getElementById('config-interval').value = data.value;
    }
}

async function saveConfig() {
    const val = document.getElementById('config-interval').value;
    if (val < 5 || val > 15) {
        alert('El intervalo debe estar entre 5 y 15 minutos.');
        return;
    }

    const { error } = await supabaseClient
        .from('config')
        .upsert({ key: 'min_vote_interval_minutes', value: val });

    if (error) {
        console.error('Error guardando config:', error);
        alert('Error al guardar configuración.');
    } else {
        alert('Configuración guardada correctamente.');
    }
}

async function loadAulasConfig() {
    const { data, error } = await supabaseClient
        .from('aulas')
        .select('id, nombre, is_active')
        .order('id');

    if (error) {
        console.error('Error cargando aulas:', error);
        return;
    }

    const container = document.getElementById('aulas-config-list');
    container.innerHTML = '';
    
    data.forEach(aula => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between bg-gray-50 p-2 rounded';
        div.innerHTML = `
            <span class="text-sm font-medium text-gray-700">${aula.nombre}</span>
            <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" class="sr-only peer" 
                    ${aula.is_active ? 'checked' : ''} 
                    onchange="toggleAula(${aula.id}, this.checked)">
                <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
        `;
        container.appendChild(div);
    });
}

async function toggleAula(id, isActive) {
    const { error } = await supabaseClient
        .from('aulas')
        .update({ is_active: isActive })
        .eq('id', id);

    if (error) {
        console.error('Error actualizando aula:', error);
        alert('Error al actualizar estado del aula.');
        loadAulasConfig(); // Revert UI
    }
}

// --- Exportación CSV ---

async function downloadVotesCSV() {
    // Descargar TODOS los votos (sin límite de 100)
    const { data: votes, error: votesError } = await supabaseClient
        .from('feedback')
        .select('created_at, aula_id, voto, session_id, user_id')
        .order('created_at', { ascending: false });

    if (votesError) {
        alert('Error descargando datos: ' + votesError.message);
        return;
    }

    if (!votes || votes.length === 0) {
        alert('No hay datos para exportar.');
        return;
    }

    // Obtener emails de usuarios
    const userIds = [...new Set(votes.map(v => v.user_id).filter(id => id))];
    let userMap = {};

    if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabaseClient
            .from('perfiles')
            .select('id, email')
            .in('id', userIds);
        
        if (!profilesError && profiles) {
            profiles.forEach(p => {
                userMap[p.id] = p.email;
            });
        }
    }

    // Convertir a CSV
    const headers = ['Timestamp', 'Aula ID', 'Voto', 'Session ID', 'User ID', 'Email'];
    const csvContent = [
        headers.join(','),
        ...votes.map(row => [
            new Date(row.created_at).toISOString(),
            row.aula_id,
            row.voto,
            row.session_id || '',
            row.user_id || '',
            userMap[row.user_id] || '' // Email si existe
        ].join(','))
    ].join('\n');

    downloadFile(csvContent, `votos_confort_${new Date().toISOString().slice(0,10)}.csv`);
}

async function downloadPointsCSV() {
    const { data, error } = await supabaseClient
        .from('perfiles')
        .select('email, puntos')
        .order('puntos', { ascending: false });

    if (error) {
        alert('Error descargando datos: ' + error.message);
        return;
    }

    if (!data || data.length === 0) {
        alert('No hay datos para exportar.');
        return;
    }

    // Convertir a CSV
    const headers = ['Email', 'Puntos Totales'];
    const csvContent = [
        headers.join(','),
        ...data.map(row => [
            row.email,
            row.puntos
        ].join(','))
    ].join('\n');

    downloadFile(csvContent, `puntos_usuarios_${new Date().toISOString().slice(0,10)}.csv`);
}

function downloadFile(content, fileName) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
