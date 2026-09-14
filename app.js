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
        if(!appData.projects) appData.projects = [];
    }
}

// Inicialización de la app
document.addEventListener('DOMContentLoaded', () => {
    loadState();
});

// ==========================================
// THEME TOGGLE (LIGHT / DARK)
// ==========================================
function toggleTheme() {
    const htmlObj = document.documentElement;
    if (htmlObj.classList.contains('dark')) {
        htmlObj.classList.remove('dark');
        localStorage.setItem('color-theme', 'light');
    } else {
        htmlObj.classList.add('dark');
        localStorage.setItem('color-theme', 'dark');
    }
    // Update chart if exists
    if (investmentChart) {
        updateChartTheme();
    }
}

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
        
        navigate('dashboard', document.querySelector('.nav-item'), 'Dashboard');
    }, 500);
}

function updateGlobalUI() {
    const fmt = (num) => `S/ ${Math.floor(num).toLocaleString('es-PE')}`;
    
    document.getElementById('stat-balance').innerText = fmt(appData.balance);
    
    let totalInvestedValue = 0;
    let activeCount = 0;
    appData.projects.forEach(p => {
        if (p.status === 'active') {
            totalInvestedValue += p.currentValue;
            activeCount++;
        }
    });
    
    document.getElementById('total-networth').innerText = fmt(appData.balance + totalInvestedValue);
    document.getElementById('stat-projects').innerText = activeCount;
    document.getElementById('stat-done').innerText = appData.projects.filter(p => p.status === 'liquidated').length;
    
    appData.level = Math.floor(appData.xp / 100) + 1;
    const xpInLevel = appData.xp % 100;
    
    document.getElementById('user-level-text').innerText = `Nivel ${appData.level}`;
    document.getElementById('user-xp-text').innerText = `${xpInLevel}/100`;
    document.getElementById('user-xp-bar').style.width = `${xpInLevel}%`;
}

// ==========================================
// NAVEGACIÓN
// ==========================================
function navigate(viewId, element, breadcrumbText) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active', 'hidden');
        view.classList.add('hidden');
    });
    
    const target = document.getElementById(viewId);
    target.classList.remove('hidden');
    target.style.animation = 'none';
    target.offsetHeight; 
    target.style.animation = null; 
    target.classList.add('active');
    
    if (element) {
        // Reset all links styling
        document.querySelectorAll('.nav-item').forEach(el => {
            el.className = "nav-item flex items-center gap-4 px-4 py-3 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all font-medium";
            const iconSpan = el.querySelector('span');
            if(iconSpan) iconSpan.className = "bg-gray-100 dark:bg-slate-800 p-1.5 rounded-lg text-sm group-hover:bg-white";
        });
        
        // Active link styling (Creative Tim style: dark pill in light mode, primary pill in dark mode)
        element.className = "nav-item active flex items-center gap-4 px-4 py-3 rounded-xl bg-gray-900 text-white dark:bg-brand-primary dark:text-gray-900 font-medium shadow-md transition-all";
        const iconSpan = element.querySelector('span');
        if(iconSpan) iconSpan.className = "bg-white/20 dark:bg-black/10 p-1.5 rounded-lg text-sm";
        
        // Update Titles
        document.getElementById('topbar-title').innerText = breadcrumbText;
        document.getElementById('breadcrumb-current').innerText = breadcrumbText;
    }
    
    const sidebar = document.getElementById('sidebar');
    if(!sidebar.classList.contains('-translate-x-full')) toggleSidebar();
    
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

function getSwalBg() {
    return document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff';
}
function getSwalColor() {
    return document.documentElement.classList.contains('dark') ? '#fff' : '#1f2937';
}

function createNewProject(event) {
    event.preventDefault();
    const name = document.getElementById('new-proj-name').value;
    const type = document.getElementById('new-proj-type').value;
    const amount = parseFloat(document.getElementById('new-proj-amount').value);
    
    if (amount > appData.balance) {
        Swal.fire({ icon: 'error', title: 'Fondos insuficientes', text: 'No tienes suficiente capital líquido.', background: getSwalBg(), color: getSwalColor(), confirmButtonColor: '#ef4444' });
        return;
    }
    
    appData.balance -= amount;
    
    const newProject = {
        id: 'proj_' + Date.now(),
        name: name, type: type, initialAmount: amount, currentValue: amount, month: 0, history: [amount], events: [], validation: [false, false, false, false], status: 'active'
    };
    
    appData.projects.push(newProject);
    appData.activeProjectId = newProject.id; 
    saveState();
    
    event.target.reset();
    Swal.fire({ icon: 'success', title: '¡Proyecto Fundado!', text: `Has iniciado ${name}.`, background: getSwalBg(), color: getSwalColor(), confirmButtonColor: '#00ff88' });
    
    renderDashboardProjects();
    populateProjectSelects();
}

function renderDashboardProjects() {
    const container = document.getElementById('projects-container');
    container.innerHTML = '';
    
    if (appData.projects.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center py-10 bg-gray-50 dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-700"><p class="text-gray-500 dark:text-slate-500 font-medium">Aún no hay empresas en el portafolio.</p></div>`;
        return;
    }
    
    appData.projects.forEach(p => {
        const profit = p.currentValue - p.initialAmount;
        const profitPerc = ((profit / p.initialAmount) * 100).toFixed(1);
        const profitColor = profit >= 0 ? 'text-green-500' : 'text-red-500';
        
        let actions = p.status === 'active' 
            ? `<button onclick="jumpToSim('${p.id}')" class="text-xs font-bold text-gray-800 dark:text-white hover:text-brand-primary dark:hover:text-brand-primary uppercase tracking-wider transition-colors">Abrir Simulador ➔</button>`
            : `<span class="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase">Cerrado</span>`;

        container.innerHTML += `
            <div class="bg-gray-50 dark:bg-slate-900 border ${p.id === appData.activeProjectId ? 'border-gray-800 dark:border-brand-primary shadow-sm' : 'border-gray-200 dark:border-slate-700'} p-5 rounded-2xl flex flex-col justify-between hover:-translate-y-1 transition-transform">
                <div>
                    <div class="flex justify-between items-start mb-4">
                        <h4 class="font-orbitron font-bold text-gray-800 dark:text-white text-lg truncate pr-2">${p.name}</h4>
                        <span class="text-[0.65rem] px-2 py-1 rounded-md bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-300 uppercase font-bold border border-gray-200 dark:border-slate-700">${typeLabels[p.type].split(' ')[1]}</span>
                    </div>
                    <div class="flex justify-between items-end bg-white dark:bg-brand-darkcard p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                        <div>
                            <span class="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase mb-1 block">Valor Actual</span>
                            <span class="font-orbitron text-lg font-bold text-gray-800 dark:text-white">S/ ${Math.floor(p.currentValue).toLocaleString()}</span>
                        </div>
                        <div class="text-right">
                            <span class="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase mb-1 block">Retorno</span>
                            <span class="font-bold text-sm ${profitColor}">${profit >= 0 ? '+' : ''}${profitPerc}%</span>
                        </div>
                    </div>
                </div>
                <div class="mt-4 pt-4 border-t border-gray-200 dark:border-slate-800/80 flex justify-between items-center">
                    <span class="text-xs text-gray-500 dark:text-slate-400 font-bold">Mes ${p.month}</span>
                    ${actions}
                </div>
            </div>
        `;
    });
}

function jumpToSim(id) {
    appData.activeProjectId = id;
    saveState();
    navigate('simulator', document.querySelectorAll('.nav-item')[1], 'Simulador');
}

function populateProjectSelects() {
    const simSelect = document.getElementById('sim-project-select');
    const valSelect = document.getElementById('val-project-select');
    
    simSelect.innerHTML = ''; valSelect.innerHTML = '';
    
    appData.projects.forEach(p => {
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
// SIMULADOR AVANZADO
// ==========================================
let investmentChart = null;

const eventCards = {
    high: [
        { msg: "¡Product Hunt #1! Entra gran demanda.", mod: 0.8, type: 'good' }, 
        { msg: "Servidor caído. Usuarios exigen reembolso.", mod: -0.5, type: 'bad' },
        { msg: "Levantaste capital semilla de Angel Investor.", mod: 0.5, type: 'good' },
        { msg: "Bug crítico borra bases de datos.", mod: -0.6, type: 'bad' }
    ],
    medium: [
        { msg: "Viral en Instagram Reels. Ventas suben.", mod: 0.3, type: 'good' },
        { msg: "Problema aduanero retiene tu inventario.", mod: -0.2, type: 'bad' },
        { msg: "Black Friday exitoso.", mod: 0.2, type: 'good' }
    ],
    low: [
        { msg: "Alcaldía repara aceras mejorando tránsito.", mod: 0.05, type: 'good' },
        { msg: "Corte de agua en el sector afecta el día.", mod: -0.05, type: 'bad' }
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
    document.getElementById('sim-active-state').className = "p-6 grid grid-cols-1 lg:grid-cols-12 gap-8"; // ensure it restores grid
    
    renderSimulatorState(p);
}

function renderSimulatorState(p) {
    document.getElementById('sim-month-badge').innerText = `Mes ${p.month} / 12`;
    document.getElementById('sim-current-val').innerText = `S/ ${Math.floor(p.currentValue).toLocaleString()}`;
    
    const profit = p.currentValue - p.initialAmount;
    const profitPerc = ((profit / p.initialAmount) * 100).toFixed(1);
    
    const badge = document.getElementById('sim-profit-badge');
    badge.innerText = `${profit >= 0 ? '+' : ''}${profitPerc}%`;
    badge.className = `text-sm font-bold mb-1 ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`;
    
    const textHeader = document.getElementById('sim-month-text');
    textHeader.innerText = `(${profit >= 0 ? '+' : ''}${profitPerc}%)`;
    textHeader.className = `font-bold ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`;
    
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
    
    const log = document.getElementById('sim-event-log');
    log.innerHTML = p.events.length === 0 ? '<li class="text-gray-400 dark:text-slate-500 italic p-3 border border-dashed border-gray-200 dark:border-slate-700 rounded-lg">Avanza un mes para empezar...</li>' : '';
    
    p.events.forEach(e => {
        const color = e.type === 'good' ? 'text-green-500' : (e.type === 'bad' ? 'text-red-500' : 'text-gray-500 dark:text-slate-400');
        log.innerHTML = `<li class="${color} flex gap-2 border-b border-gray-100 dark:border-slate-800 pb-2"><span class="text-gray-400 dark:text-slate-500 font-bold">[M${e.month}]</span> ${e.msg}</li>` + log.innerHTML;
    });

    drawChart(p);
}

function updateChartTheme() {
    if (!investmentChart) return;
    const isDark = document.documentElement.classList.contains('dark');
    
    investmentChart.options.scales.x.ticks.color = isDark ? '#94a3b8' : '#64748b';
    investmentChart.options.scales.y.ticks.color = isDark ? '#94a3b8' : '#64748b';
    investmentChart.options.scales.x.grid.color = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    investmentChart.options.scales.y.grid.color = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    
    investmentChart.update();
}

function drawChart(p) {
    const isDark = document.documentElement.classList.contains('dark');
    
    if (!investmentChart) {
        const ctx = document.getElementById('investmentChart').getContext('2d');
        // The image shows a beautiful bright green chart with white text usually
        investmentChart = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [{ label: 'Valoración', data: [], borderColor: '#4ade80', backgroundColor: 'rgba(74, 222, 128, 0.1)', borderWidth: 3, fill: true, tension: 0.3, pointBackgroundColor: '#fff', pointBorderColor: '#4ade80', pointBorderWidth: 2 }] },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } }, // Hide legend to match image
                scales: {
                    y: { grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }, ticks: { color: isDark ? '#94a3b8' : '#64748b', font: {family: 'Inter'} } },
                    x: { grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }, ticks: { color: isDark ? '#94a3b8' : '#64748b', font: {family: 'Inter'} } }
                }
            }
        });
    }
    
    const labels = [];
    for(let i=0; i<=12; i++) labels.push(`M${i}`);
    
    const dataPad = [...p.history];
    while(dataPad.length <= 12) dataPad.push(null);
    
    investmentChart.data.labels = labels;
    investmentChart.data.datasets[0].data = dataPad;
    
    // Smooth beautiful chart colors
    const profit = p.currentValue - p.initialAmount;
    if (profit >= 0) {
        investmentChart.data.datasets[0].borderColor = '#4ade80'; // Bright Green
        investmentChart.data.datasets[0].backgroundColor = 'rgba(74, 222, 128, 0.1)';
        investmentChart.data.datasets[0].pointBorderColor = '#4ade80';
    } else {
        investmentChart.data.datasets[0].borderColor = '#f87171'; // Red
        investmentChart.data.datasets[0].backgroundColor = 'rgba(248, 113, 113, 0.1)';
        investmentChart.data.datasets[0].pointBorderColor = '#f87171';
    }
    
    investmentChart.update();
}

function advanceMonth() {
    const p = appData.projects.find(x => x.id === appData.activeProjectId);
    if (!p || p.month >= 12 || p.status !== 'active') return;
    
    p.month++;
    
    let volatility = p.type === 'high' ? 0.3 : (p.type === 'medium' ? 0.12 : 0.04);
    let drift = p.type === 'high' ? 0.03 : (p.type === 'medium' ? 0.015 : 0.005);
    
    let shock = (Math.random() + Math.random() + Math.random() - 1.5) * 2; 
    
    if (Math.random() < 0.20) {
        const eventsArr = eventCards[p.type];
        const randomEvt = eventsArr[Math.floor(Math.random() * eventsArr.length)];
        shock += randomEvt.mod;
        p.events.push({ month: p.month, msg: randomEvt.msg, type: randomEvt.type });
        appData.xp += 10;
        
        Swal.fire({
            toast: true, position: 'top-end', showConfirmButton: false, timer: 4000,
            icon: randomEvt.type === 'good' ? 'success' : 'warning',
            title: `Mes ${p.month}: Noticia del Mercado`,
            text: randomEvt.msg,
            background: getSwalBg(), color: getSwalColor()
        });
    }

    const monthlyChange = drift + (shock * volatility);
    p.currentValue = p.currentValue * (1 + monthlyChange);
    if (p.currentValue < 0) p.currentValue = 0;
    
    p.history.push(p.currentValue);
    
    if (p.currentValue < (p.initialAmount * 0.05)) { 
        p.status = 'liquidated';
        p.events.push({month: p.month, msg: 'BANCARROTA. Operaciones detenidas.', type:'bad'});
        Swal.fire({ icon: 'error', title: 'Quiebra Total', text: 'Te quedaste sin liquidez.', background: getSwalBg(), color: getSwalColor(), confirmButtonColor: '#ef4444' });
    }

    if (p.month === 12 && p.status === 'active') {
        Swal.fire({ icon: 'success', title: 'Ejercicio Fiscal Completado', text: 'Puedes retirar los dividendos al dashboard.', background: getSwalBg(), color: getSwalColor(), confirmButtonColor: '#00ff88' });
    }

    appData.xp += 5;
    saveState();
    renderSimulatorState(p);
}

function liquidateProject() {
    const p = appData.projects.find(x => x.id === appData.activeProjectId);
    if(!p || p.status !== 'active') return;
    
    Swal.fire({
        title: '¿Liquidar Posición?',
        text: `Retornarás S/ ${Math.floor(p.currentValue).toLocaleString()} al balance general.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981', // Tailwind Emerald 500
        cancelButtonColor: '#ef4444',
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        background: getSwalBg(), color: getSwalColor()
    }).then((result) => {
        if (result.isConfirmed) {
            p.status = 'liquidated';
            appData.balance += p.currentValue;
            p.events.push({month: p.month, msg: 'Liquidación manual ejecutada.', type:'neutral'});
            saveState();
            renderSimulatorState(p);
            Swal.fire({title: 'Ejecutado', text: 'Capital liberado.', icon: 'success', background: getSwalBg(), color: getSwalColor()});
        }
    });
}

// ==========================================
// VALIDADOR LEAN STARTUP
// ==========================================
const validationChecklist = [
    "Hablé con 5 clientes (Entrevistas de Problema).",
    "Definí a mi Buyer Persona (Arquetipo de Cliente).",
    "Estudié a 2 competidores y mi ventaja competitiva.",
    "Boceté un modelo de monetización (Estructura de costos)."
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
        const borderClass = p.validation[i] ? 'border-gray-900 dark:border-brand-primary' : 'border-gray-200 dark:border-slate-700';
        const textClass = p.validation[i] ? 'text-gray-900 dark:text-brand-primary font-bold' : 'text-gray-600 dark:text-slate-400 group-hover:text-gray-900 dark:group-hover:text-white';
        
        container.innerHTML += `
            <label class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-900 border ${borderClass} rounded-xl cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm group">
                <input type="checkbox" onchange="toggleValidation(${i})" ${checked} class="w-5 h-5 rounded text-gray-900 dark:text-brand-primary focus:ring-gray-900 dark:focus:ring-brand-primary accent-gray-900 dark:accent-brand-primary cursor-pointer">
                <span class="${textClass} transition-colors text-sm">${text}</span>
            </label>
        `;
    });
    
    evaluateValidation(p);
}

function toggleValidation(index) {
    const p = appData.projects.find(x => x.id === appData.activeProjectId);
    p.validation[index] = !p.validation[index];
    
    if (p.validation[index]) {
        appData.xp += 20;
        Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, icon: 'success', title: '+20 XP', text: 'Validación completada.', background: getSwalBg(), color: getSwalColor() });
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
    
    resultBox.className = 'mt-8 p-6 rounded-xl border text-center font-bold text-sm shadow-sm transition-all duration-300';
    
    if (score === 100) {
        resultBox.innerHTML = '<span class="text-3xl block mb-2">🚀</span> RIESGO MITIGADO. Tienes validación completa. ¡A construir!';
        resultBox.classList.add('bg-green-50', 'dark:bg-green-500/10', 'border-green-200', 'dark:border-green-500', 'text-green-700', 'dark:text-green-400');
    } else if (score >= 50) {
        resultBox.innerHTML = '<span class="text-3xl block mb-2">⚠️</span> RIESGO MODERADO. Falta validar información crucial en el mercado.';
        resultBox.classList.add('bg-yellow-50', 'dark:bg-yellow-500/10', 'border-yellow-200', 'dark:border-yellow-500', 'text-yellow-700', 'dark:text-yellow-400');
    } else {
        resultBox.innerHTML = '<span class="text-3xl block mb-2">🛑</span> RIESGO EXTREMO. No lances tu producto hasta hablar con clientes reales.';
        resultBox.classList.add('bg-red-50', 'dark:bg-red-500/10', 'border-red-200', 'dark:border-red-500', 'text-red-700', 'dark:text-red-400');
    }
}
