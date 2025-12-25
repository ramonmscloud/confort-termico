// Configuración de Supabase
const SUPABASE_URL = 'https://jzzrnuxwjygtluuopewp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6enJudXh3anlndGx1dW9wZXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDQyNzYsImV4cCI6MjA4MjA4MDI3Nn0.MbYdoRXnIc93ZFuFUCtLr11x6GZmMCrZShQeD2gDJfE';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variables de Gráficos
let distributionChart;
let timelineChart;
let aulasDistributionChart;
let voteOptions = {}; // Cache de opciones de voto

// Inicialización
window.addEventListener('load', async () => {
    // Cargar opciones de voto primero para configurar gráficos correctamente
    await loadVoteOptionsData();
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
        renderVoteOptionsConfig(); // Renderizar tabla de configuración
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
    // Preparar etiquetas y colores basados en voteOptions
    const labels = [-2, -1, 0, 1, 2].map(v => voteOptions[v]?.label || v);
    const bgColors = [-2, -1, 0, 1, 2].map(v => getTailwindColorHex(voteOptions[v]?.color || 'bg-gray-500'));

    // Gráfico de Distribución (Pie/Bar)
    const ctxDist = document.getElementById('distributionChart').getContext('2d');
    distributionChart = new Chart(ctxDist, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Votos',
                data: [0, 0, 0, 0, 0],
                backgroundColor: bgColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });

    // Gráfico de Distribución por Aulas (Stacked Bar)
    const ctxAulas = document.getElementById('aulasDistributionChart').getContext('2d');
    aulasDistributionChart = new Chart(ctxAulas, {
        type: 'bar',
        data: {
            labels: [], // Nombres de aulas
            datasets: [] // Datasets dinámicos por tipo de voto
        },
        options: {
            responsive: true,
            scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } }
            },
            plugins: {
                legend: { position: 'top' }
            }
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

// Helper para convertir clases tailwind a hex (aproximado para Chart.js)
function getTailwindColorHex(className) {
    const map = {
        'bg-blue-500': 'rgba(59, 130, 246, 0.8)',
        'bg-blue-300': 'rgba(147, 197, 253, 0.8)',
        'bg-green-500': 'rgba(34, 197, 94, 0.8)',
        'bg-orange-500': 'rgba(249, 115, 22, 0.8)',
        'bg-red-500': 'rgba(239, 68, 68, 0.8)',
        // Fallbacks
        'bg-blue-600': 'rgba(37, 99, 235, 0.8)',
        'bg-red-600': 'rgba(220, 38, 38, 0.8)',
        'bg-green-600': 'rgba(22, 163, 74, 0.8)',
        'bg-yellow-500': 'rgba(234, 179, 8, 0.8)',
        'bg-purple-500': 'rgba(168, 85, 247, 0.8)'
    };
    return map[className] || 'rgba(156, 163, 175, 0.8)'; // Gray default }
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

    // Estructuras para gráficos
    const aulasGroups = {};
    const counts = [0, 0, 0, 0, 0]; // -2, -1, 0, 1, 2

    if (data.length > 0) {
        // Agrupar por aula y contar globales
        data.forEach(d => {
            // Global counts
            const index = d.voto + 2; // Map -2..2 to 0..4
            if (index >= 0 && index <= 4) counts[index]++;

            // Aula groups
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

    // 2. Actualizar Gráfico Distribución Global
    distributionChart.data.datasets[0].data = counts;
    distributionChart.update();

    // 3. Actualizar Gráfico Distribución por Aulas
    updateAulasDistributionChart(aulasGroups);

    // 4. Actualizar Gráfico Temporal (Por Aula)
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

    // Usamos un set de todas las etiquetas de tiempo para el eje X
    timelineChart.data.labels = timelineData.map(d => new Date(d.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
    timelineChart.data.datasets = datasets;
    timelineChart.update();

    // 5. Actualizar Tabla
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

function updateAulasDistributionChart(aulasGroups) {
    const aulaIds = Object.keys(aulasGroups).sort((a, b) => a - b);
    
    // Preparar datasets para cada tipo de voto (-2 a 2)
    const datasets = [-2, -1, 0, 1, 2].map(voteVal => {
        return {
            label: voteOptions[voteVal]?.label || voteVal,
            data: aulaIds.map(id => {
                // Contar cuantos votos de este tipo hay en esta aula
                return aulasGroups[id].filter(v => v === voteVal).length;
            }),
            backgroundColor: getTailwindColorHex(voteOptions[voteVal]?.color || 'bg-gray-500')
        };
    });

    aulasDistributionChart.data.labels = aulaIds.map(id => `Aula ${id}`);
    aulasDistributionChart.data.datasets = datasets;
    aulasDistributionChart.update();
}

// --- Gestión de Opciones de Voto ---

async function loadVoteOptionsData() {
    const { data, error } = await supabaseClient
        .from('vote_options')
        .select('*')
        .order('value');

    if (error || !data || data.length === 0) {
        console.warn('Usando opciones por defecto (tabla vacía o error)');
        // Defaults
        voteOptions = {
            '-2': { value: -2, label: 'Muy Frío', icon: '🥶', color: 'bg-blue-500' },
            '-1': { value: -1, label: 'Fresco', icon: '❄️', color: 'bg-blue-300' },
            '0': { value: 0, label: 'Bien', icon: '😊', color: 'bg-green-500' },
            '1': { value: 1, label: 'Calor', icon: '🔥', color: 'bg-orange-500' },
            '2': { value: 2, label: 'Muy Calor', icon: '🥵', color: 'bg-red-500' }
        };
    } else {
        voteOptions = {};
        data.forEach(opt => {
            voteOptions[opt.value] = opt;
        });
    }
}

function renderVoteOptionsConfig() {
    const tbody = document.getElementById('vote-options-list');
    tbody.innerHTML = '';

    [-2, -1, 0, 1, 2].forEach(val => {
        const opt = voteOptions[val] || { value: val, label: '', icon: '', color: '' };
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="p-3 text-gray-700 font-bold">${val}</td>
            <td class="p-3"><input type="text" id="opt-icon-${val}" value="${opt.icon}" class="w-12 p-1 border rounded text-center text-xl"></td>
            <td class="p-3"><input type="text" id="opt-label-${val}" value="${opt.label}" class="w-full p-1 border rounded"></td>
            <td class="p-3">
                <select id="opt-color-${val}" class="p-1 border rounded w-full">
                    <option value="bg-blue-500" ${opt.color === 'bg-blue-500' ? 'selected' : ''}>Azul (Muy Frío)</option>
                    <option value="bg-blue-300" ${opt.color === 'bg-blue-300' ? 'selected' : ''}>Azul Claro (Fresco)</option>
                    <option value="bg-green-500" ${opt.color === 'bg-green-500' ? 'selected' : ''}>Verde (Bien)</option>
                    <option value="bg-orange-500" ${opt.color === 'bg-orange-500' ? 'selected' : ''}>Naranja (Calor)</option>
                    <option value="bg-red-500" ${opt.color === 'bg-red-500' ? 'selected' : ''}>Rojo (Muy Calor)</option>
                    <option value="bg-purple-500" ${opt.color === 'bg-purple-500' ? 'selected' : ''}>Morado</option>
                    <option value="bg-yellow-500" ${opt.color === 'bg-yellow-500' ? 'selected' : ''}>Amarillo</option>
                </select>
            </td>
            <td class="p-3">
                <button onclick="saveVoteOption(${val})" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Guardar</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function saveVoteOption(value) {
    const label = document.getElementById(`opt-label-${value}`).value;
    const icon = document.getElementById(`opt-icon-${value}`).value;
    const color = document.getElementById(`opt-color-${value}`).value;

    const { error } = await supabaseClient
        .from('vote_options')
        .upsert({ value, label, icon, color });

    if (error) {
        console.error('Error guardando opción:', error);
        alert('Error al guardar opción.');
    } else {
        // Actualizar cache local
        voteOptions[value] = { value, label, icon, color };
        alert('Opción actualizada. Recarga la página de votación para ver cambios.');
        
        // Actualizar gráficos
        initCharts(); // Re-init para actualizar labels/colores
        loadInitialData(); // Recargar datos
    }
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
    return voteOptions[val]?.label || val;
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
