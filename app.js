// ==========================================
// ESTADO GLOBAL Y PERSISTENCIA (Local Storage)
// ==========================================
let appData = {
    balance: 10000,
    xp: 0,
    level: 1,
    projects: [],
    activeProjectId: null
};

function saveState() {
    localStorage.setItem('seedup_data', JSON.stringify(appData));
    updateGlobalUI();
}

function loadState() {
    const saved = localStorage.getItem('seedup_data');
    if (saved) {
        appData = JSON.parse(saved);
        // Compatibilidad hacia atrás si faltan propiedades en caché
        if(!appData.projects) appData.projects = [];
    }
}

function resetState() {
    appData = { balance: 10000, xp: 0, level: 1, projects: [], activeProjectId: null };
    saveState();
}

// Inicialización de la app
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    // Renderizamos si ya estamos logueados (para esta demo forzamos inicio limpio)
    // updateGlobalUI();
});

// ==========================================
// AUTENTICACIÓN Y UI GLOBAL
// ==========================================
function handleLogin(event) {
    event.preventDefault();
    const loginView = document.getElementById('login-view');
    const dashboardLayout = document.getElementById('dashboard-layout');
    
    loginView.classList.add('opacity-0');
    setTimeout(() => {
        loginView.classList.add('hidden');
        loginView.classList.remove('flex');
        
        dashboardLayout.classList.remove('hidden');
        setTimeout(() => dashboardLayout.classList.remove('opacity-0', 'pointer-events-none'), 50);
        
        // Cargar UI completa
        updateGlobalUI();
        renderDashboardProjects();
        populateProjectSelects();
    }, 500);
}

function logout() {
    const loginView = document.getElementById('login-view');
    const dashboardLayout = document.getElementById('dashboard-layout');
    
    dashboardLayout.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => {
        dashboardLayout.classList.add('hidden');
        loginView.classList.remove('hidden');
        loginView.classList.add('flex');
        setTimeout(() => loginView.classList.remove('opacity-0'), 50);
        
        navigate('dashboard', document.querySelector('.nav-item'));
    }, 500);
}

function updateGlobalUI() {
    // Formatear balances
    const fmt = (num) => `S/ ${Math.floor(num).toLocaleString('es-PE')}`;
    
    document.getElementById('global-balance').innerText = fmt(appData.balance);
    
    // Calcular Patrimonio Total (Balance Líquido + Valoraciones Actuales de Proyectos)
    let totalInvestedValue = 0;
    appData.projects.forEach(p => {
        if (p.status === 'active') totalInvestedValue += p.currentValue;
    });
    document.getElementById('total-networth').innerText = fmt(appData.balance + totalInvestedValue);
    
    // Nivel y XP
    // Cada 100 XP = 1 Nivel
    appData.level = Math.floor(appData.xp / 100) + 1;
    const xpInLevel = appData.xp % 100;
    
    document.getElementById('user-level-text').innerText = `Nivel ${appData.level}`;
    document.getElementById('user-xp-text').innerText = `${xpInLevel} / 100 XP`;
    document.getElementById('user-xp-bar').style.width = `${xpInLevel}%`;
}

// ==========================================
// NAVEGACIÓN
// ==========================================
function navigate(viewId, element) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active', 'hidden');
        view.classList.add('hidden');
    });
    
    const target = document.getElementById(viewId);
    target.classList.remove('hidden');
    // Hack para trigger de animación
    target.style.animation = 'none';
    target.offsetHeight; 
    target.style.animation = null; 
    target.classList.add('active');
    
    if (element) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        element.classList.add('active');
        document.getElementById('topbar-title').innerText = element.querySelector('.font-medium').innerText;
    }
    
    const sidebar = document.getElementById('sidebar');
    if(!sidebar.classList.contains('-translate-x-full')) toggleSidebar();
    
    // Lógica por vista
    if (viewId === 'dashboard') renderDashboardProjects();
    if (viewId === 'simulator') {
        populateProjectSelects();
        switchSimulatorProject(appData.activeProjectId);
    }
    if (viewId === 'validator') {
        populateProjectSelects();
        switchValProject(appData.activeProjectId);
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('-translate-x-full');
}

// ==========================================
// GESTIÓN DE PROYECTOS (CRUD)
// ==========================================
const typeLabels = { high: '🚀 Startup Tech', medium: '🛒 E-commerce', low: '🏪 Franquicia' };

function createNewProject(event) {
    event.preventDefault();
    const name = document.getElementById('new-proj-name').value;
    const type = document.getElementById('new-proj-type').value;
    const amount = parseFloat(document.getElementById('new-proj-amount').value);
    
    if (amount > appData.balance) {
        Swal.fire({ icon: 'error', title: 'Fondos insuficientes', text: 'No tienes suficiente capital semilla.', background: '#0f172a', color: '#fff', confirmButtonColor: '#ef4444' });
        return;
    }
    
    // Restar capital
    appData.balance -= amount;
    
    // Crear objeto
    const newProject = {
        id: 'proj_' + Date.now(),
        name: name,
        type: type,
        initialAmount: amount,
        currentValue: amount,
        month: 0,
        history: [amount], // valor mes a mes
        events: [],
        validation: [false, false, false, false],
        status: 'active' // active, liquidated
    };
    
    appData.projects.push(newProject);
    appData.activeProjectId = newProject.id; // Auto seleccionar
    saveState();
    
    // Reset Form
    event.target.reset();
    
    Swal.fire({ icon: 'success', title: '¡Proyecto Creado!', text: `Has fundado ${name}. Ve al Simulador para empezar a operar.`, background: '#0f172a', color: '#fff', confirmButtonColor: '#00ff88' });
    
    renderDashboardProjects();
    populateProjectSelects();
}

function renderDashboardProjects() {
    const container = document.getElementById('projects-container');
    container.innerHTML = '';
    
    if (appData.projects.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center py-10 bg-brand-dark rounded-xl border border-slate-800"><p class="text-slate-500">Aún no tienes negocios. Crea tu primer proyecto abajo.</p></div>`;
        return;
    }
    
    appData.projects.forEach(p => {
        const profit = p.currentValue - p.initialAmount;
        const profitPerc = ((profit / p.initialAmount) * 100).toFixed(1);
        const profitColor = profit >= 0 ? 'text-brand-primary' : 'text-red-400';
        
        let actions = p.status === 'active' 
            ? `<button onclick="jumpToSim('${p.id}')" class="text-sm bg-brand-secondary/20 text-brand-secondary hover:bg-brand-secondary hover:text-black px-3 py-1.5 rounded transition-colors">Abrir Simulador</button>`
            : `<span class="text-xs bg-slate-800 text-slate-400 px-3 py-1.5 rounded">Liquidado (Cerrado)</span>`;

        container.innerHTML += `
            <div class="bg-[#111926] border ${p.id === appData.activeProjectId ? 'border-brand-primary' : 'border-slate-800'} p-5 rounded-2xl flex flex-col justify-between">
                <div>
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-orbitron font-bold text-white text-lg truncate">${p.name}</h4>
                        <span class="text-[0.65rem] px-2 py-1 rounded bg-slate-800 text-slate-300 uppercase">${typeLabels[p.type]}</span>
                    </div>
                    <div class="mt-4 flex justify-between items-end">
                        <div>
                            <span class="text-xs text-slate-500 block mb-1">Valoración / Mes ${p.month}</span>
                            <span class="font-orbitron text-xl text-white">S/ ${Math.floor(p.currentValue).toLocaleString()}</span>
                        </div>
                        <div class="text-right">
                            <span class="text-xs text-slate-500 block mb-1">Retorno</span>
                            <span class="font-bold ${profitColor}">${profit >= 0 ? '+' : ''}${profitPerc}%</span>
                        </div>
                    </div>
                </div>
                <div class="mt-5 pt-4 border-t border-slate-800 flex justify-between items-center">
                    ${actions}
                </div>
            </div>
        `;
    });
}

function jumpToSim(id) {
    appData.activeProjectId = id;
    saveState();
    navigate('simulator', document.querySelectorAll('.nav-item')[1]);
}

function populateProjectSelects() {
    const simSelect = document.getElementById('sim-project-select');
    const valSelect = document.getElementById('val-project-select');
    
    simSelect.innerHTML = ''; valSelect.innerHTML = '';
    
    appData.projects.forEach(p => {
        // Solo mostrar activos en el simulador, o mostrar todos con tag
        const tag = p.status === 'liquidated' ? ' (Cerrado)' : '';
        const option = `<option value="${p.id}">${p.name}${tag}</option>`;
        simSelect.innerHTML += option;
        valSelect.innerHTML += option;
    });
    
    if(appData.activeProjectId) {
        simSelect.value = appData.activeProjectId;
        valSelect.value = appData.activeProjectId;
    }
}


// ==========================================
// SIMULADOR AVANZADO E INTERACTIVO
// ==========================================
let investmentChart = null;

const eventCards = {
    high: [
        { msg: "¡Un influencer recomendó tu App!", mod: 0.8, type: 'good' }, // +80% shock
        { msg: "Caída del servidor principal (AWS). Usuarios furiosos.", mod: -0.5, type: 'bad' },
        { msg: "Ronda de capital exitosa. Entra nuevo flujo.", mod: 0.5, type: 'good' },
        { msg: "Demanda por copyright de un competidor.", mod: -0.6, type: 'bad' }
    ],
    medium: [
        { msg: "Campaña en TikTok se hizo viral localmente.", mod: 0.3, type: 'good' },
        { msg: "Problemas con el proveedor en China. Falta de stock.", mod: -0.2, type: 'bad' },
        { msg: "Festividad local aumenta las compras.", mod: 0.2, type: 'good' }
    ],
    low: [
        { msg: "Aumento leve en la zona peatonal del local.", mod: 0.05, type: 'good' },
        { msg: "Reparaciones en la calle dificultan el acceso.", mod: -0.05, type: 'bad' }
    ]
};

function switchSimulatorProject(forceId) {
    const select = document.getElementById('sim-project-select');
    appData.activeProjectId = forceId || select.value;
    
    const p = appData.projects.find(x => x.id === appData.activeProjectId);
    
    if (!p) {
        document.getElementById('sim-empty-state').classList.remove('hidden');
        document.getElementById('sim-active-state').classList.add('hidden');
        return;
    }
    
    document.getElementById('sim-empty-state').classList.add('hidden');
    document.getElementById('sim-active-state').classList.remove('hidden');
    
    renderSimulatorState(p);
}

function renderSimulatorState(p) {
    document.getElementById('sim-month-badge').innerText = `Mes ${p.month} / 12`;
    document.getElementById('sim-current-val').innerText = `S/ ${Math.floor(p.currentValue).toLocaleString()}`;
    
    const profit = p.currentValue - p.initialAmount;
    const badge = document.getElementById('sim-profit-badge');
    badge.innerText = `${profit >= 0 ? '+' : ''}S/ ${Math.floor(profit).toLocaleString()}`;
    badge.className = `ml-2 text-sm font-bold px-2 py-1 rounded ${profit >= 0 ? 'bg-brand-primary/20 text-brand-primary' : 'bg-red-500/20 text-red-500'}`;
    
    // Botones
    const btnAdv = document.getElementById('btn-advance-month');
    const btnLiq = document.getElementById('btn-liquidate');
    
    if (p.status === 'liquidated' || p.month >= 12) {
        btnAdv.classList.add('hidden');
        if (p.status === 'active') {
            btnLiq.classList.remove('hidden');
            btnLiq.innerText = "Liquidar Proyecto (Cerrar Año)";
        } else {
            btnLiq.classList.add('hidden');
        }
    } else {
        btnAdv.classList.remove('hidden');
        btnLiq.classList.remove('hidden');
        btnLiq.innerText = "Liquidar antes de tiempo";
    }
    
    // Log de Eventos
    const log = document.getElementById('sim-event-log');
    log.innerHTML = p.events.length === 0 ? '<li class="text-slate-500 italic">No hay eventos aún. Avanza un mes.</li>' : '';
    
    p.events.forEach(e => {
        const color = e.type === 'good' ? 'text-brand-primary' : (e.type === 'bad' ? 'text-red-400' : 'text-slate-300');
        log.innerHTML = `<li class="${color} flex gap-2"><span class="text-slate-500">[Mes ${e.month}]</span> ${e.msg}</li>` + log.innerHTML;
    });

    drawChart(p);
}

function drawChart(p) {
    if (!investmentChart) {
        const ctx = document.getElementById('investmentChart').getContext('2d');
        investmentChart = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [{ label: 'Valoración (S/)', data: [], borderColor: '#00d2ff', backgroundColor: 'rgba(0, 210, 255, 0.1)', borderWidth: 3, fill: true, tension: 0.1 }] },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    y: { grid: { color: 'rgba(30,41,59,0.5)' }, ticks: { color: '#94a3b8' } },
                    x: { grid: { color: 'rgba(30,41,59,0.5)' }, ticks: { color: '#94a3b8' } }
                }
            }
        });
    }
    
    const labels = [];
    for(let i=0; i<=12; i++) labels.push(`Mes ${i}`);
    
    // Rellenar lo que falta con nulls para que la gráfica llegue hasta el 12 visualmente
    const dataPad = [...p.history];
    while(dataPad.length <= 12) dataPad.push(null);
    
    investmentChart.data.labels = labels;
    investmentChart.data.datasets[0].data = dataPad;
    
    const profit = p.currentValue - p.initialAmount;
    investmentChart.data.datasets[0].borderColor = profit >= 0 ? '#00ff88' : '#ef4444';
    investmentChart.data.datasets[0].backgroundColor = profit >= 0 ? 'rgba(0,255,136,0.1)' : 'rgba(239,68,68,0.1)';
    
    investmentChart.update();
}

function advanceMonth() {
    const p = appData.projects.find(x => x.id === appData.activeProjectId);
    if (!p || p.month >= 12 || p.status !== 'active') return;
    
    p.month++;
    
    // Lógica financiera Random Walk
    let volatility = p.type === 'high' ? 0.3 : (p.type === 'medium' ? 0.12 : 0.04);
    let drift = p.type === 'high' ? 0.03 : (p.type === 'medium' ? 0.015 : 0.005);
    
    // Shock aleatorio estándar (-1 a 1)
    let shock = (Math.random() + Math.random() + Math.random() - 1.5) * 2; 
    
    // Verificación de "Evento Sorpresa" (20% de prob)
    let eventHappened = null;
    if (Math.random() < 0.20) {
        const eventsArr = eventCards[p.type];
        const randomEvt = eventsArr[Math.floor(Math.random() * eventsArr.length)];
        shock += randomEvt.mod;
        eventHappened = { month: p.month, msg: randomEvt.msg, type: randomEvt.type };
        p.events.push(eventHappened);
        
        // Bonus de XP por sobrevivir eventos
        appData.xp += 10;
        
        // Notificación Visual Premium
        Swal.fire({
            toast: true, position: 'top-end', showConfirmButton: false, timer: 4000,
            icon: randomEvt.type === 'good' ? 'success' : 'warning',
            title: `Mes ${p.month}: Evento Inesperado`,
            text: randomEvt.msg,
            background: '#0f172a', color: '#fff'
        });
    }

    const monthlyChange = drift + (shock * volatility);
    p.currentValue = p.currentValue * (1 + monthlyChange);
    if (p.currentValue < 0) p.currentValue = 0;
    
    p.history.push(p.currentValue);
    
    // Si la empresa quiebra
    if (p.currentValue < (p.initialAmount * 0.05)) { // Queda menos del 5%
        p.status = 'liquidated';
        p.events.push({month: p.month, msg: '¡QUIEBRA TOTAL! El proyecto se quedó sin liquidez.', type:'bad'});
        Swal.fire({ icon: 'error', title: 'Bancarrota', text: 'Tu negocio ha quebrado. Aprende de los errores e inicia otro.', background: '#0f172a', color: '#fff', confirmButtonColor: '#ef4444' });
    }

    // Al llegar al mes 12
    if (p.month === 12 && p.status === 'active') {
        Swal.fire({ icon: 'success', title: '¡Año Completado!', text: 'El año fiscal ha terminado. Puedes liquidar el proyecto y retornar las ganancias a tu capital central.', background: '#0f172a', color: '#fff', confirmButtonColor: '#00ff88' });
    }

    appData.xp += 5; // XP por sobrevivir un mes
    saveState();
    renderSimulatorState(p);
}

function liquidateProject() {
    const p = appData.projects.find(x => x.id === appData.activeProjectId);
    if(!p || p.status !== 'active') return;
    
    Swal.fire({
        title: '¿Liquidar Proyecto?',
        text: `Venderás las acciones y retornarás S/ ${Math.floor(p.currentValue).toLocaleString()} a tu capital central.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#00ff88',
        cancelButtonColor: '#ef4444',
        confirmButtonText: 'Sí, Liquidar',
        cancelButtonText: 'Cancelar',
        background: '#0f172a', color: '#fff'
    }).then((result) => {
        if (result.isConfirmed) {
            p.status = 'liquidated';
            appData.balance += p.currentValue;
            p.events.push({month: p.month, msg: 'Proyecto liquidado por el usuario.', type:'neutral'});
            saveState();
            renderSimulatorState(p);
            Swal.fire({title: 'Liquidado', text: 'Fondos retornados a tu cuenta.', icon: 'success', background: '#0f172a', color: '#fff'});
        }
    });
}

// ==========================================
// VALIDADOR LEAN STARTUP
// ==========================================
const validationChecklist = [
    "He entrevistado a 5 clientes potenciales (Problem/Solution Fit).",
    "Tengo definido el perfil demográfico de mi cliente ideal (Buyer Persona).",
    "Conozco al menos 2 competidores y sé cómo me diferencio.",
    "Calculé mis costos operativos y tengo un modelo de monetización claro."
];

function switchValProject(forceId) {
    const select = document.getElementById('val-project-select');
    appData.activeProjectId = forceId || select.value;
    
    const p = appData.projects.find(x => x.id === appData.activeProjectId);
    
    if (!p) {
        document.getElementById('val-empty-state').classList.remove('hidden');
        document.getElementById('val-active-state').classList.add('hidden');
        return;
    }
    
    document.getElementById('val-empty-state').classList.add('hidden');
    document.getElementById('val-active-state').classList.remove('hidden');
    
    renderValidatorState(p);
}

function renderValidatorState(p) {
    const container = document.getElementById('validator-checklist');
    container.innerHTML = '';
    
    validationChecklist.forEach((text, i) => {
        const checked = p.validation[i] ? 'checked' : '';
        container.innerHTML += `
            <label class="flex items-start gap-4 p-5 bg-[#111926] border ${p.validation[i] ? 'border-brand-primary/50' : 'border-slate-700'} rounded-xl cursor-pointer hover:bg-[#152033] transition-all group">
                <div class="relative flex items-center justify-center mt-0.5">
                    <input type="checkbox" onchange="toggleValidation(${i})" ${checked} class="custom-checkbox appearance-none w-6 h-6 border-2 border-slate-500 rounded bg-transparent checked:bg-brand-primary checked:border-brand-primary transition-colors cursor-pointer">
                </div>
                <span class="${p.validation[i] ? 'text-brand-primary font-medium' : 'text-slate-300 group-hover:text-white'} transition-colors">${text}</span>
            </label>
        `;
    });
    
    evaluateValidation(p);
}

function toggleValidation(index) {
    const p = appData.projects.find(x => x.id === appData.activeProjectId);
    const wasChecked = p.validation[index];
    
    p.validation[index] = !wasChecked;
    
    // Otorgar o quitar XP
    if (p.validation[index]) {
        appData.xp += 20;
        Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, icon: 'success', title: '+20 XP', text: 'Hito de negocio validado.', background: '#0f172a', color: '#00ff88' });
    } else {
        appData.xp -= 20;
    }
    
    saveState();
    renderValidatorState(p);
}

function evaluateValidation(p) {
    const resultBox = document.getElementById('val-result-box');
    const checkedCount = p.validation.filter(x => x).length;
    const score = (checkedCount / p.validation.length) * 100;
    
    resultBox.className = 'mt-8 p-6 rounded-xl border text-center font-medium transition-all duration-500';
    
    if (score === 100) {
        resultBox.innerHTML = '<span class="text-3xl block mb-2">🚀</span> Nivel de Viabilidad: EXCELENTE.<br>Has validado todos los pilares. Tienes luz verde para lanzar.';
        resultBox.classList.add('bg-brand-primary/10', 'border-brand-primary', 'text-brand-primary');
    } else if (score >= 50) {
        resultBox.innerHTML = '<span class="text-3xl block mb-2">⚠️</span> Nivel de Viabilidad: MEDIO.<br>Vas por buen camino, pero te faltan validar piezas clave.';
        resultBox.classList.add('bg-yellow-500/10', 'border-yellow-500', 'text-yellow-500');
    } else {
        resultBox.innerHTML = '<span class="text-3xl block mb-2">🛑</span> Nivel de Viabilidad: RIESGO ALTO.<br>Tu idea está basada en supuestos no validados. Habla con clientes.';
        resultBox.classList.add('bg-red-500/10', 'border-red-500', 'text-red-400');
    }
}
