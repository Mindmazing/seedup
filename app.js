// ==========================================
// ESTADO GLOBAL Y PERSISTENCIA
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
    renderSidebarProjects();
}

function loadState() {
    const saved = localStorage.getItem('seedup_data');
    if (saved) {
        appData = JSON.parse(saved);
        if(!appData.projects) appData.projects = [];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadState();
});

// ==========================================
// THEME TOGGLE
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
        renderSidebarProjects();
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
        
        navigate('dashboard', document.querySelector('.nav-item'), 'Panel');
    }, 500);
}

function updateGlobalUI() {
    const fmt = (num) => `$${Math.floor(num).toLocaleString('en-US')}`;
    
    document.getElementById('stat-balance').innerText = fmt(appData.balance);
    
    let totalInvestedValue = 0;
    let activeCount = 0;
    appData.projects.forEach(p => {
        if (p.status === 'active') {
            totalInvestedValue += p.currentValue;
            activeCount++;
        }
    });
    
    document.getElementById('total-networth').innerText = fmt(totalInvestedValue);
    document.getElementById('stat-projects').innerText = activeCount;
    document.getElementById('stat-done').innerText = appData.projects.filter(p => p.status === 'liquidated').length;
    
    appData.level = Math.floor(appData.xp / 100) + 1;
    const xpInLevel = appData.xp % 100;
    
    document.getElementById('user-level-text').innerText = `Nivel ${appData.level}`;
    document.getElementById('user-xp-text').innerText = `${xpInLevel}/100 puntos`;
    document.getElementById('user-xp-bar') ? document.getElementById('user-xp-bar').style.width = `${xpInLevel}%` : null;
}

function renderSidebarProjects() {
    const list = document.getElementById('sidebar-projects-list');
    list.innerHTML = '';
    
    if (appData.projects.length === 0) {
        list.innerHTML = `<div class="px-4 py-2 text-xs text-gray-400 italic">No tienes proyectos</div>`;
        return;
    }
    
    appData.projects.forEach(p => {
        const isClosed = p.status === 'liquidated';
        list.innerHTML += `
        <a href="#" onclick="openAIAnalytics('${p.id}', this)" class="nav-item-proj flex items-center gap-3 px-4 py-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all font-medium text-sm">
            <svg class="w-4 h-4 ${isClosed ? 'text-gray-400' : 'text-[#4ade80]'} flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            <span class="truncate">${p.name}</span>
        </a>`;
    });
}

// ==========================================
// UPGRADE MODAL
// ==========================================
function getSwalBg() { return document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff'; }
function getSwalColor() { return document.documentElement.classList.contains('dark') ? '#fff' : '#1f2937'; }

function showUpgradeModal() {
    Swal.fire({
        title: 'Elige tu Plan SeedUp',
        html: `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mt-4 font-inter">
            <!-- Free -->
            <div class="border border-gray-200 dark:border-slate-700 rounded-xl p-5 bg-gray-50 dark:bg-slate-900 shadow-sm flex flex-col justify-between">
                <div>
                    <h3 class="font-bold text-lg text-[#344767] dark:text-white">Plan Básico</h3>
                    <div class="my-3"><span class="text-3xl font-bold text-[#344767] dark:text-white font-orbitron">$0</span><span class="text-gray-500 text-sm"> /mes</span></div>
                    <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-3 mt-4">
                        <li class="flex items-start gap-2"><svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Simulador de micro-inversiones</li>
                        <li class="flex items-start gap-2"><svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Registro de logros básico</li>
                        <li class="flex items-start gap-2"><svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> 1 Proyecto activo</li>
                    </ul>
                </div>
                <button class="mt-6 w-full py-2.5 bg-gray-200 dark:bg-slate-800 text-gray-500 dark:text-slate-400 font-bold rounded-lg cursor-not-allowed uppercase tracking-wide text-xs" disabled>Plan Actual</button>
            </div>
            <!-- Premium -->
            <div class="border-2 border-[#4ade80] rounded-xl p-5 bg-white dark:bg-brand-darkcard shadow-lg relative flex flex-col justify-between">
                <div class="absolute -top-3 right-4 bg-[#4ade80] text-gray-900 text-[0.65rem] font-bold px-2 py-1 rounded shadow uppercase">Recomendado</div>
                <div>
                    <h3 class="font-bold text-lg text-[#344767] dark:text-white flex items-center gap-2">SeedUp Premium <svg class="w-4 h-4 text-[#4ade80]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg></h3>
                    <div class="my-3"><span class="text-3xl font-bold text-[#344767] dark:text-white font-orbitron">$4.99</span><span class="text-gray-500 text-sm"> /mes</span></div>
                    <ul class="text-sm text-gray-600 dark:text-gray-300 space-y-3 mt-4">
                        <li class="flex items-start gap-2"><svg class="w-5 h-5 text-[#4ade80] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Reportes analíticos avanzados</li>
                        <li class="flex items-start gap-2"><svg class="w-5 h-5 text-[#4ade80] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Mentoría digital automatizada (IA)</li>
                        <li class="flex items-start gap-2"><svg class="w-5 h-5 text-[#4ade80] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Herramientas de validación profunda</li>
                        <li class="flex items-start gap-2"><svg class="w-5 h-5 text-[#4ade80] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Proyectos y simulaciones ilimitadas</li>
                    </ul>
                </div>
                <button onclick="Swal.close(); Swal.fire({icon: 'success', title: '¡Gracias por tu interés!', text: 'La pasarela de pago se integrará en la versión final.', background: getSwalBg(), color: getSwalColor(), confirmButtonColor: '#4ade80'})" class="mt-6 w-full py-2.5 bg-[#1a2035] dark:bg-brand-primary text-white dark:text-gray-900 font-bold rounded-lg hover:shadow-lg transition-all uppercase tracking-wide text-xs">Mejorar Ahora</button>
            </div>
        </div>
        `,
        width: 700,
        showConfirmButton: false,
        showCloseButton: true,
        background: getSwalBg(),
        color: getSwalColor()
    });
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
        document.querySelectorAll('.nav-item').forEach(el => {
            el.className = "nav-item flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all font-medium text-sm";
        });
        document.querySelectorAll('.nav-item-proj').forEach(el => {
            el.classList.remove('bg-gray-100', 'dark:bg-slate-800', 'text-[#344767]', 'dark:text-white');
        });
        
        element.className = "nav-item active flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[#1a2035] text-white dark:bg-brand-primary dark:text-gray-900 font-medium shadow-md transition-all text-sm";
        
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

function openAIAnalytics(id, element) {
    appData.activeProjectId = id;
    saveState();
    
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active', 'hidden');
        view.classList.add('hidden');
    });
    
    const target = document.getElementById('ai-analytics');
    target.classList.remove('hidden');
    target.classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(el => {
        el.className = "nav-item flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all font-medium text-sm";
    });
    
    document.querySelectorAll('.nav-item-proj').forEach(el => {
        el.classList.remove('bg-gray-100', 'dark:bg-slate-800', 'text-[#344767]', 'dark:text-white');
    });
    
    if(element) element.classList.add('bg-gray-100', 'dark:bg-slate-800', 'text-[#344767]', 'dark:text-white');
    
    document.getElementById('topbar-title').innerText = "Análisis IA";
    document.getElementById('breadcrumb-current').innerText = "Mentoría IA";
    
    const sidebar = document.getElementById('sidebar');
    if(!sidebar.classList.contains('-translate-x-full')) toggleSidebar();
    
    const p = appData.projects.find(x => x.id === id);
    if(p) renderAIAnalyticsState(p);
}

function renderAIAnalyticsState(p) {
    document.getElementById('ai-proj-name').innerText = p.name;
    document.getElementById('ai-proj-desc').innerText = p.description || 'Sin descripción provista.';
    document.getElementById('ai-proj-budget').innerText = `$${Math.floor(p.initialAmount).toLocaleString('en-US')}`;
    
    const resultsBox = document.getElementById('ai-results-box');
    resultsBox.innerHTML = `
        <div class="flex items-center justify-center py-10">
            <div class="animate-pulse flex flex-col items-center text-center">
                <svg class="w-12 h-12 text-[#4ade80] mb-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span class="text-[#344767] dark:text-white font-bold text-lg">SeedUp AI está analizando el modelo...</span>
                <span class="text-gray-500 dark:text-slate-400 text-sm mt-1">Evaluando mercado, competencia y riesgo financiero.</span>
            </div>
        </div>
    `;

    setTimeout(() => {
        let riskStr = p.type === 'high' ? 'Alto Riesgo (SaaS / App)' : (p.type === 'medium' ? 'Riesgo Medio (E-commerce)' : 'Bajo Riesgo (Franquicia)');
        let analysis = '';
        if (p.type === 'high') {
            analysis = `Este modelo presenta alta escalabilidad tecnológica pero requiere un "product-market fit" extremadamente rápido. Con un capital aislado de $${p.initialAmount.toLocaleString('en-US')}, tu pista de aterrizaje (runway) inicial es muy sensible a los costos de desarrollo.<br><br><strong>💡 Recomendación del Agente:</strong> Prioriza construir un prototipo de baja fidelidad y validar la retención de usuarios en los primeros 3 meses antes de invertir fuerte en marketing de pago.`;
        } else if (p.type === 'medium') {
            analysis = `El sector de E-commerce tiene barreras de entrada moderadas pero una competencia feroz. Tu mayor reto financiero será optimizar el CAC (Costo de Adquisición de Cliente).<br><br><strong>💡 Recomendación del Agente:</strong> Utiliza micro-influencers para validar el interés orgánico y optimiza tu cadena de suministro antes de quemar tus $${p.initialAmount.toLocaleString('en-US')} en publicidad masiva.`;
        } else {
            analysis = `Los modelos tradicionales como franquicias gozan de un flujo de caja mucho más predecible. La clave del éxito radicará en la ubicación y la eficiencia de tus operaciones diarias.<br><br><strong>💡 Recomendación del Agente:</strong> Mantén tus costos fijos iniciales estrictamente por debajo del 40% de tu capital de $${p.initialAmount.toLocaleString('en-US')} para asegurar tu supervivencia durante el primer año.`;
        }

        resultsBox.innerHTML = `
            <div class="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-8 text-sm text-gray-700 dark:text-gray-300 shadow-sm w-full animate-[fadeUp_0.4s_ease_forwards]">
                <div class="flex items-center gap-3 mb-5">
                    <div class="w-10 h-10 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <div>
                        <h4 class="font-bold text-[#344767] dark:text-white text-lg">Diagnóstico de Viabilidad Completado</h4>
                        <span class="text-xs text-green-600 dark:text-green-400 font-bold">Generado exitosamente</span>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div class="bg-white dark:bg-brand-darkcard p-4 rounded-lg border border-gray-100 dark:border-slate-700/50">
                        <span class="text-xs text-gray-500 block mb-1 uppercase tracking-wide font-bold">Perfil de Riesgo Detectado</span>
                        <span class="text-[#344767] dark:text-white font-bold">${riskStr}</span>
                    </div>
                    <div class="bg-white dark:bg-brand-darkcard p-4 rounded-lg border border-gray-100 dark:border-slate-700/50">
                        <span class="text-xs text-gray-500 block mb-1 uppercase tracking-wide font-bold">Salud Financiera Inicial</span>
                        <span class="text-[#344767] dark:text-white font-bold">Presupuesto Simulado de $${p.initialAmount.toLocaleString('en-US')}</span>
                    </div>
                </div>
                
                <div class="bg-indigo-50 dark:bg-indigo-500/10 border-l-4 border-indigo-500 p-5 rounded-r-lg">
                    <p class="leading-relaxed text-indigo-900 dark:text-indigo-200 text-sm">${analysis}</p>
                </div>
                
                <div class="mt-6 flex justify-end">
                    <button onclick="navigate('simulator', document.querySelectorAll('.nav-item')[1], 'Simulador'); switchSimulatorProject('${p.id}');" class="bg-[#1a2035] dark:bg-brand-primary text-white dark:text-gray-900 px-6 py-2 rounded-lg font-bold text-sm hover:shadow-lg transition-all uppercase">Ir al Simulador de Mercado</button>
                </div>
            </div>
        `;
    }, 2500);
}

// ==========================================
// GESTIÓN DE PROYECTOS (CRUD)
// ==========================================
const typeLabels = { high: 'SaaS / App', medium: 'E-commerce', low: 'Franquicia' };

function createNewProject(event) {
    event.preventDefault();
    const name = document.getElementById('new-proj-name').value;
    const desc = document.getElementById('new-proj-desc').value;
    const type = document.getElementById('new-proj-type').value;
    const amount = parseFloat(document.getElementById('new-proj-amount').value);
    
    // Capital no está enlazado a appData.balance, así que pueden simular la cantidad que quieran.
    
    const newProject = {
        id: 'proj_' + Date.now(),
        name: name, 
        description: desc,
        type: type, 
        initialAmount: amount, 
        currentValue: amount, 
        month: 0, 
        history: [amount], 
        events: [], 
        validation: [false, false, false, false], 
        status: 'active'
    };
    
    appData.projects.push(newProject);
    appData.activeProjectId = newProject.id; 
    saveState();
    
    event.target.reset();
    Swal.fire({ icon: 'success', title: 'Proyecto Aislado Creado', text: `La empresa ${name} ha sido lanzada en el simulador.`, background: getSwalBg(), color: getSwalColor(), confirmButtonColor: '#4ade80' });
    
    renderDashboardProjects();
    populateProjectSelects();
    renderSidebarProjects(); // Update sidebar!
}

function renderDashboardProjects() {
    const container = document.getElementById('projects-container');
    container.innerHTML = '';
    
    if (appData.projects.length === 0) {
        container.innerHTML = `<tr><td colspan="4" class="text-center py-6 text-gray-400">No hay proyectos.</td></tr>`;
        return;
    }
    
    appData.projects.forEach(p => {
        const isDone = p.status === 'liquidated';
        const prog = isDone ? 100 : Math.round((p.month / 12) * 100);
        
        let actions = !isDone 
            ? `<button onclick="jumpToSim('${p.id}')" class="text-xs font-bold text-blue-500 hover:text-blue-700 uppercase">Simular</button>`
            : `<span class="text-xs font-bold text-gray-400 uppercase">Cerrado</span>`;

        container.innerHTML += `
            <tr class="border-b border-gray-100 dark:border-slate-800 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                <td class="py-3 px-1">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-gray-300">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                        </div>
                        <div class="flex flex-col">
                            <h6 class="text-sm leading-normal font-bold text-[#344767] dark:text-white">${p.name}</h6>
                            <span class="text-xs text-gray-500 dark:text-slate-400">${typeLabels[p.type]}</span>
                        </div>
                    </div>
                </td>
                <td class="py-3 text-sm font-bold text-[#344767] dark:text-white">
                    $${Math.floor(p.currentValue).toLocaleString('en-US')}
                </td>
                <td class="py-3 text-sm">
                    ${actions}
                </td>
                <td class="py-3">
                    <div class="w-32 mx-auto">
                        <div class="flex mb-1 items-center justify-between">
                            <span class="text-xs font-bold text-gray-500 dark:text-slate-400">${prog}%</span>
                        </div>
                        <div class="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                            <div class="bg-gradient-to-r from-blue-400 to-blue-500 h-1.5 rounded-full" style="width: ${prog}%"></div>
                        </div>
                    </div>
                </td>
            </tr>
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
        { msg: "Destacado en TechCrunch. Aumento de leads.", mod: 0.8, type: 'good' }, 
        { msg: "Caída de AWS. Usuarios exigen reembolsos.", mod: -0.5, type: 'bad' },
        { msg: "Inversionista Ángel inyecta capital.", mod: 0.5, type: 'good' },
        { msg: "Bug crítico borra bases de datos.", mod: -0.6, type: 'bad' }
    ],
    medium: [
        { msg: "Viral en TikTok. Aumento de ventas.", mod: 0.3, type: 'good' },
        { msg: "Aduana retiene tu inventario.", mod: -0.2, type: 'bad' },
        { msg: "Black Friday muy exitoso.", mod: 0.2, type: 'good' }
    ],
    low: [
        { msg: "La alcaldía repara calles, mejora el tráfico.", mod: 0.05, type: 'good' },
        { msg: "Corte de agua en tu sector.", mod: -0.05, type: 'bad' }
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
    document.getElementById('sim-current-val').innerText = `$${Math.floor(p.currentValue).toLocaleString('en-US')}`;
    
    const profit = p.currentValue - p.initialAmount;
    const profitPerc = ((profit / p.initialAmount) * 100).toFixed(1);
    
    const badge = document.getElementById('sim-profit-badge');
    badge.innerText = `${profit >= 0 ? '+' : ''}${profitPerc}%`;
    badge.className = `text-xs font-bold mb-1 ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`;
    
    const textHeader = document.getElementById('sim-month-text');
    textHeader.innerText = `${profit >= 0 ? '+' : ''}${profitPerc}%`;
    textHeader.className = `font-bold ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`;
    
    const btnAdv = document.getElementById('btn-advance-month');
    const btnLiq = document.getElementById('btn-liquidate');
    
    if (p.status === 'liquidated' || p.month >= 12) {
        btnAdv.classList.add('hidden');
        if (p.status === 'active') {
            btnLiq.classList.remove('hidden');
            btnLiq.innerText = "Liquidar Proyecto";
        } else {
            btnLiq.classList.add('hidden');
        }
    } else {
        btnAdv.classList.remove('hidden');
        btnLiq.classList.remove('hidden');
        btnLiq.innerText = "Liquidar Posición";
    }
    
    const log = document.getElementById('sim-event-log');
    log.innerHTML = p.events.length === 0 ? '<li class="text-gray-400 dark:text-slate-500 italic text-xs">Avanza un mes para ver eventos...</li>' : '';
    
    p.events.forEach(e => {
        let icon = e.type === 'good' ? '<svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>' : 
                  (e.type === 'bad' ? '<svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>' : '');
        log.innerHTML = `<li class="flex gap-3 items-start border-b border-gray-100 dark:border-slate-700/50 pb-3">
            <div class="mt-0.5">${icon}</div>
            <div>
                <span class="text-[#344767] dark:text-white font-bold block text-xs">Mes ${e.month}</span>
                <span class="text-gray-500 dark:text-slate-400 text-xs">${e.msg}</span>
            </div>
        </li>` + log.innerHTML;
    });

    drawChart(p);
}

function updateChartTheme() {
    if (!investmentChart) return;
    const isDark = document.documentElement.classList.contains('dark');
    
    investmentChart.options.scales.x.ticks.color = isDark ? '#94a3b8' : '#cbd5e1';
    investmentChart.options.scales.y.ticks.color = isDark ? '#94a3b8' : '#cbd5e1';
    investmentChart.options.scales.x.grid.color = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)';
    investmentChart.options.scales.y.grid.color = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)';
    
    investmentChart.update();
}

function drawChart(p) {
    const isDark = document.documentElement.classList.contains('dark');
    
    if (!investmentChart) {
        const ctx = document.getElementById('investmentChart').getContext('2d');
        investmentChart = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [{ label: 'Valoración', data: [], borderColor: '#4ade80', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 3, fill: true, tension: 0.3, pointBackgroundColor: '#fff', pointBorderColor: '#4ade80', pointBorderWidth: 2 }] },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)' }, ticks: { color: isDark ? '#94a3b8' : '#cbd5e1', font: {family: 'Inter'} } },
                    x: { grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)' }, ticks: { color: isDark ? '#94a3b8' : '#cbd5e1', font: {family: 'Inter'} } }
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
    
    const profit = p.currentValue - p.initialAmount;
    if (profit >= 0) {
        investmentChart.data.datasets[0].borderColor = '#4ade80';
        investmentChart.data.datasets[0].pointBorderColor = '#4ade80';
    } else {
        investmentChart.data.datasets[0].borderColor = '#f87171';
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
            title: `Mes ${p.month}: Evento de Mercado`,
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
        p.events.push({month: p.month, msg: 'BANCARROTA TOTAL.', type:'bad'});
        Swal.fire({ icon: 'error', title: 'Bancarrota', text: 'Perdiste toda la liquidez del proyecto.', background: getSwalBg(), color: getSwalColor(), confirmButtonColor: '#ef4444' });
    }

    if (p.month === 12 && p.status === 'active') {
        Swal.fire({ icon: 'success', title: 'Año Fiscal Completado', text: 'El proyecto finalizó su ciclo de evaluación.', background: getSwalBg(), color: getSwalColor(), confirmButtonColor: '#4ade80' });
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
        text: `Detendrás la simulación de este proyecto para siempre.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#1a2035',
        cancelButtonColor: '#ef4444',
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        background: getSwalBg(), color: getSwalColor()
    }).then((result) => {
        if (result.isConfirmed) {
            p.status = 'liquidated';
            // Ya no sumamos al balance global.
            p.events.push({month: p.month, msg: 'Liquidación Manual.', type:'neutral'});
            saveState();
            renderSimulatorState(p);
            Swal.fire({title: 'Ejecutado', text: 'Simulación detenida.', icon: 'success', background: getSwalBg(), color: getSwalColor()});
        }
    });
}

// ==========================================
// VALIDADOR LEAN STARTUP
// ==========================================
const validationChecklist = [
    "Entrevistas de problema (Ajuste Problema/Solución).",
    "Definición clara de Buyer Persona.",
    "Análisis de 2 competidores directos.",
    "Borrador de modelo de monetización."
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
        const borderClass = p.validation[i] ? 'border-[#344767] dark:border-brand-primary' : 'border-gray-200 dark:border-slate-700';
        const textClass = p.validation[i] ? 'text-[#344767] dark:text-brand-primary font-bold' : 'text-gray-500 dark:text-slate-400 group-hover:text-gray-800 dark:group-hover:text-white';
        
        container.innerHTML += `
            <label class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-900 border ${borderClass} rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-all shadow-sm group">
                <input type="checkbox" onchange="toggleValidation(${i})" ${checked} class="w-4 h-4 rounded text-[#344767] dark:text-brand-primary focus:ring-[#344767] dark:focus:ring-brand-primary accent-[#344767] dark:accent-brand-primary cursor-pointer">
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
        Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, icon: 'success', title: '+20 XP', text: 'Tarea completada.', background: getSwalBg(), color: getSwalColor() });
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
    
    resultBox.className = 'mt-6 p-5 rounded-lg border bg-gray-50 dark:bg-slate-900 text-sm shadow-sm transition-all duration-300 flex items-center gap-3';
    
    if (score === 100) {
        resultBox.innerHTML = '<svg class="w-8 h-8 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> <div class="text-left"><span class="block text-green-700 dark:text-green-400 font-bold">Riesgo Mitigado</span><span class="text-green-600 dark:text-green-500 font-normal">Validación completa. ¡Listo para construir!</span></div>';
        resultBox.classList.add('border-green-200', 'dark:border-green-500/30', 'bg-green-50', 'dark:bg-green-500/10');
    } else if (score >= 50) {
        resultBox.innerHTML = '<svg class="w-8 h-8 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> <div class="text-left"><span class="block text-yellow-700 dark:text-yellow-400 font-bold">Riesgo Moderado</span><span class="text-yellow-600 dark:text-yellow-500 font-normal">Falta validación crucial de mercado.</span></div>';
        resultBox.classList.add('border-yellow-200', 'dark:border-yellow-500/30', 'bg-yellow-50', 'dark:bg-yellow-500/10');
    } else {
        resultBox.innerHTML = '<svg class="w-8 h-8 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> <div class="text-left"><span class="block text-red-700 dark:text-red-400 font-bold">Riesgo Extremo</span><span class="text-red-600 dark:text-red-500 font-normal">No lances sin hablar con clientes reales.</span></div>';
        resultBox.classList.add('border-red-200', 'dark:border-red-500/30', 'bg-red-50', 'dark:bg-red-500/10');
    }
}
