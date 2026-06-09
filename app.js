// --- ESTADO DE LA APLICACIÓN ---
let appState = JSON.parse(localStorage.getItem('powerlog_state')) || {
    currentDayIndex: 1, 
    selectedDayIndex: 1, 
    rutinas: { 1: [], 2: [], 3: [], 4: [], 5: [] },
    historial: []
};

function saveState() {
    localStorage.setItem('powerlog_state', JSON.stringify(appState));
    render();
}

// --- NAVEGACIÓN DE PESTAÑAS ---
function switchTab(tab) {
    const btnRutina = document.getElementById('tab-rutina');
    const btnHistorial = document.getElementById('tab-historial');
    const secRutina = document.getElementById('section-rutina');
    const secHistorial = document.getElementById('section-historial');

    if (tab === 'rutina') {
        btnRutina.className = "flex-1 py-2.5 text-sm font-medium rounded-lg transition flex items-center justify-center gap-2 bg-indigo-600 text-white";
        btnHistorial.className = "flex-1 py-2.5 text-sm font-medium rounded-lg transition flex items-center justify-center gap-2 text-slate-400 hover:text-white";
        secRutina.classList.remove('hidden');
        secHistorial.classList.add('hidden');
    } else {
        btnHistorial.className = "flex-1 py-2.5 text-sm font-medium rounded-lg transition flex items-center justify-center gap-2 bg-indigo-600 text-white";
        btnRutina.className = "flex-1 py-2.5 text-sm font-medium rounded-lg transition flex items-center justify-center gap-2 text-slate-400 hover:text-white";
        secRutina.classList.add('hidden');
        secHistorial.classList.remove('hidden');
        renderHistorial();
    }
}

// --- MODAL ---
function openModalEjercicio() {
    document.getElementById('modal-ejercicio').classList.remove('hidden');
}
function closeModalEjercicio() {
    document.getElementById('modal-ejercicio').classList.add('hidden');
    document.getElementById('input-nombre-ejercicio').value = '';
}

// --- GESTIÓN DE EJERCICIOS ---
function seleccionarDia(dia) {
    appState.selectedDayIndex = dia;
    saveState();
}

function guardarEjercicio() {
    const nombre = document.getElementById('input-nombre-ejercicio').value.trim();
    const seriesCount = parseInt(document.getElementById('input-series').value) || 4;
    const repsSugeridas = document.getElementById('input-reps').value.trim() || '12';

    if (!nombre) return alert('Ponle un nombre al ejercicio');

    let series = [];
    for(let i=0; i < seriesCount; i++) {
        series.push({ peso: '', reps: repsSugeridas });
    }

    // Buscador automático de imágenes mediante Unsplash Source (según palabra clave)
    const keywords = encodeURIComponent(nombre.toLowerCase());
    
    const nuevoEjercicio = {
        id: Date.now(),
        nombre: nombre,
        // Usamos palabras clave del ejercicio para intentar traer fotos dinámicas de fitness
        imagen: `https://images.unsplash.com/featured/400x250/?gym,fitness,${keywords}`,
        series: series
    };

    appState.rutinas[appState.selectedDayIndex].push(nuevoEjercicio);
    closeModalEjercicio();
    saveState();
}

function eliminarEjercicio(id) {
    appState.rutinas[appState.selectedDayIndex] = appState.rutinas[appState.selectedDayIndex].filter(ex => ex.id !== id);
    saveState();
}

function actualizarSerie(ejercicioId, serieIndex, campo, valor) {
    const ejercicio = appState.rutinas[appState.selectedDayIndex].find(ex => ex.id === ejercicioId);
    if (ejercicio) {
        ejercicio.series[serieIndex][campo] = valor;
        localStorage.setItem('powerlog_state', JSON.stringify(appState));
    }
}

function finalizarEntrenamiento() {
    const ejerciciosDelDia = appState.rutinas[appState.selectedDayIndex];
    if (ejerciciosDelDia.length === 0) {
        alert("Agrega ejercicios antes de finalizar el día.");
        return;
    }

    const registroHistorial = {
        id: Date.now(),
        fecha: new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
        diaNombre: `Día ${appState.selectedDayIndex}`,
        ejercicios: JSON.parse(JSON.stringify(ejerciciosDelDia))
    };

    appState.historial.unshift(registroHistorial);

    let proximoDia = appState.selectedDayIndex + 1;
    if (proximoDia > 5) proximoDia = 1;

    appState.currentDayIndex = proximoDia;
    appState.selectedDayIndex = proximoDia; 

    alert(`¡Entrenamiento guardado! Siguiente parada recomendada: Día ${proximoDia}`);
    saveState();
}

function borrarHistorial() {
    if(confirm("¿Seguro que quieres borrar todo el historial?")) {
        appState.historial = [];
        saveState();
        renderHistorial();
    }
}

// --- RENDERIZADO ---
function render() {
    // Banner de recordatorio inteligente
    document.getElementById('reminder-text').innerText = `Hoy te toca entrenar el: Día ${appState.currentDayIndex}`;
    document.getElementById('btn-comenzar-siguiente').onclick = () => {
        appState.selectedDayIndex = appState.currentDayIndex;
        saveState();
    };

    // Botones de días
    const daysContainer = document.getElementById('days-container');
    daysContainer.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const btn = document.createElement('button');
        const isSelected = appState.selectedDayIndex === i;
        const isNextToTrain = appState.currentDayIndex === i;
        
        btn.className = `flex-none px-5 py-3 rounded-xl font-semibold text-sm transition flex flex-col items-center min-w-[75px] ${
            isSelected 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400' 
            : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
        }`;
        
        btn.innerHTML = `
            <span>Día ${i}</span>
            ${isNextToTrain ? '<span class="text-[9px] bg-indigo-900 text-indigo-300 px-1.5 rounded mt-1 font-bold">TOCA</span>' : ''}
        `;
        btn.onclick = () => seleccionarDia(i);
        daysContainer.appendChild(btn);
    }

    // Título e instrucciones del día
    document.getElementById('current-day-title').innerText = `Día ${appState.selectedDayIndex}`;
    const exercisesList = document.getElementById('exercises-list');
    exercisesList.innerHTML = '';

    const ejerciciosActuales = appState.rutinas[appState.selectedDayIndex];

    if (ejerciciosActuales.length === 0) {
        exercisesList.innerHTML = `
            <div class="col-span-full py-12 text-center border-2 border-dashed border-slate-800 rounded-2xl">
                <i data-lucide="dumbbell" class="w-8 h-8 text-slate-600 mx-auto mb-2"></i>
                <p class="text-sm text-slate-500">No hay ejercicios en este día. ¡Agrega uno!</p>
            </div>
        `;
    } else {
        ejerciciosActuales.forEach(ex => {
            const card = document.createElement('div');
            card.className = "bg-slate-800/80 border border-slate-700/60 rounded-2xl overflow-hidden flex flex-col shadow-xl";
            
            let seriesHtml = '';
            ex.series.forEach((serie, idx) => {
                seriesHtml += `
                    <div class="grid grid-cols-12 gap-2 items-center text-xs">
                        <span class="col-span-2 text-slate-500 font-medium text-center">#${idx + 1}</span>
                        <input type="text" placeholder="Peso" value="${serie.peso}" 
                            oninput="actualizarSerie(${ex.id}, ${idx}, 'peso', this.value)"
                            class="col-span-5 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-center text-slate-200 focus:outline-none focus:border-indigo-500">
                        <input type="number" placeholder="Reps" value="${serie.reps}" 
                            oninput="actualizarSerie(${ex.id}, ${idx}, 'reps', this.value)"
                            class="col-span-5 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-center text-slate-200 focus:outline-none focus:border-indigo-500">
                    </div>
                `;
            });

            card.innerHTML = `
                <div class="h-32 bg-slate-700 relative overflow-hidden">
                    <img src="${ex.imagen}" class="w-full h-full object-cover opacity-50 mix-blend-luminosity hover:mix-blend-normal transition duration-500" alt="${ex.nombre}" onerror="this.src='https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400'">
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                    <button onclick="eliminarEjercicio(${ex.id})" class="absolute top-3 right-3 bg-slate-900/80 hover:bg-rose-600 p-2 rounded-xl text-slate-400 hover:text-white transition backdrop-blur-md">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                    <h4 class="absolute bottom-3 left-4 text-base font-bold text-white">${ex.nombre}</h4>
                </div>
                <div class="p-4 flex-1 space-y-2.5">
                    <div class="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center mb-1">
                        <span class="col-span-2">Serie</span>
                        <span class="col-span-5">Peso</span>
                        <span class="col-span-5">Reps</span>
                    </div>
                    ${seriesHtml}
                </div>
            `;
            exercisesList.appendChild(card);
        });
    }
    lucide.createIcons();
}

function renderHistorial() {
    const container = document.getElementById('historial-list');
    container.innerHTML = '';

    if (appState.historial.length === 0) {
        container.innerHTML = `
            <div class="py-12 text-center border-2 border-dashed border-slate-800 rounded-2xl">
                <i data-lucide="history" class="w-8 h-8 text-slate-600 mx-auto mb-2"></i>
                <p class="text-sm text-slate-500">Aún no has completado entrenamientos.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    appState.historial.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = "bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 space-y-2";
        
        let ejerciciosResumen = item.ejercicios.map(ex => {
            return `<span class="inline-block bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2 py-1 rounded-md mr-1.5 mb-1.5 font-medium">${ex.nombre} (${ex.series.length}s)</span>`;
        }).join('');

        itemDiv.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <span class="text-xs font-bold text-indigo-400 uppercase tracking-wide">${item.diaNombre}</span>
                    <h5 class="text-sm font-semibold text-slate-200 capitalize mt-0.5">${item.fecha}</h5>
                </div>
                <span class="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">Completado</span>
            </div>
            <div class="pt-1 flex flex-wrap">
                ${ejerciciosResumen}
            </div>
        `;
        container.appendChild(itemDiv);
    });
    lucide.createIcons();
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    render();
});
