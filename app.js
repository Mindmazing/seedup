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
    
    document.getElementById('total-networth').innerText = fmt(appData.balance + totalInvestedValue);
    document.getElementById('stat-projects').innerText = activeCount;
    document.getElementById('stat-done').innerText = appData.projects.filter(p => p.status === 'liquidated').length;
    
    appData.level = Math.floor(appData.xp / 100) + 1;
    const xpInLevel = appData.xp % 100;
    
    document.getElementById('user-level-text').innerText = `Level ${appData.level}`;
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
        document.querySelectorAll('.nav-item').forEach(el => {
            el.className = "nav-item flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all font-medium text-sm";
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

// ==========================================
// GESTIÓN DE PROYECTOS (CRUD)
// ==========================================
const typeLabels = { high: 'SaaS / App', medium: 'E-commerce', low: 'Franchise' };

function getSwalBg() { return document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff'; }
function getSwalColor() { return document.documentElement.classList.contains('dark') ? '#fff' : '#1f2937'; }

function createNewProject(event) {
    event.preventDefault();
    const name = document.getElementById('new-proj-name').value;
    const type = document.getElementById('new-proj-type').value;
    const amount = parseFloat(document.getElementById('new-proj-amount').value);
    
    if (amount > appData.balance) {
        Swal.fire({ icon: 'error', title: 'Insufficient Funds', text: 'You do not have enough capital.', background: getSwalBg(), color: getSwalColor(), confirmButtonColor: '#ef4444' });
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
    Swal.fire({ icon: 'success', title: 'Project Launched', text: `${name} has been created.`, background: getSwalBg(), color: getSwalColor(), confirmButtonColor: '#4ade80' });
    
    renderDashboardProjects();
    populateProjectSelects();
}

function renderDashboardProjects() {
    const container = document.getElementById('projects-container');
    container.innerHTML = '';
    
    if (appData.projects.length === 0) {
        container.innerHTML = `<tr><td colspan="4" class="text-center py-6 text-gray-400">No projects found.</td></tr>`;
        return;
    }
    
    appData.projects.forEach(p => {
        const isDone = p.status === 'liquidated';
        const prog = isDone ? 100 : Math.round((p.month / 12) * 100);
        
        let actions = !isDone 
            ? `<button onclick="jumpToSim('${p.id}')" class="text-xs font-bold text-blue-500 hover:text-blue-700 uppercase">Simulate</button>`
            : `<span class="text-xs font-bold text-gray-400 uppercase">Done</span>`;

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
    navigate('simulator', document.querySelectorAll('.nav-item')[1], 'Simulator');
}

function populateProjectSelects() {
    const simSelect = document.getElementById('sim-project-select');
    const valSelect = document.getElementById('val-project-select');
    
    simSelect.innerHTML = ''; valSelect.innerHTML = '';
    
    appData.projects.forEach(p => {
        const tag = p.status === 'liquidated' ? ' (Closed)' : '';
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
        { msg: "Featured on TechCrunch. Lead spike.", mod: 0.8, type: 'good' }, 
        { msg: "AWS outage. Users demanding refunds.", mod: -0.5, type: 'bad' },
        { msg: "Angel investor injects capital.", mod: 0.5, type: 'good' },
        { msg: "Critical bug deletes DB.", mod: -0.6, type: 'bad' }
    ],
    medium: [
        { msg: "Viral on TikTok. Sales boost.", mod: 0.3, type: 'good' },
        { msg: "Customs retained your inventory.", mod: -0.2, type: 'bad' },
        { msg: "Black Friday success.", mod: 0.2, type: 'good' }
    ],
    low: [
        { msg: "City repaired sidewalks, traffic up.", mod: 0.05, type: 'good' },
        { msg: "Water cut in the sector.", mod: -0.05, type: 'bad' }
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
    document.getElementById('sim-month-badge').innerText = `Month ${p.month} / 12`;
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
            btnLiq.innerText = "Liquidate Project";
        } else {
            btnLiq.classList.add('hidden');
        }
    } else {
        btnAdv.classList.remove('hidden');
        btnLiq.classList.remove('hidden');
        btnLiq.innerText = "Liquidate Position";
    }
    
    const log = document.getElementById('sim-event-log');
    log.innerHTML = p.events.length === 0 ? '<li class="text-gray-400 dark:text-slate-500 italic text-xs">Advance a month to see events...</li>' : '';
    
    p.events.forEach(e => {
        let icon = e.type === 'good' ? '<svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>' : 
                  (e.type === 'bad' ? '<svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>' : '');
        log.innerHTML = `<li class="flex gap-3 items-start border-b border-gray-100 dark:border-slate-700/50 pb-3">
            <div class="mt-0.5">${icon}</div>
            <div>
                <span class="text-[#344767] dark:text-white font-bold block text-xs">Month ${e.month}</span>
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
            data: { labels: [], datasets: [{ label: 'Valuation', data: [], borderColor: '#4ade80', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 3, fill: true, tension: 0.3, pointBackgroundColor: '#fff', pointBorderColor: '#4ade80', pointBorderWidth: 2 }] },
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
    
    // In Argon design, charts often use a clean white line over the gradient background, but we can stick to green/red for context.
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
            title: `Month ${p.month}: Market Event`,
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
        p.events.push({month: p.month, msg: 'BANKRUPT.', type:'bad'});
        Swal.fire({ icon: 'error', title: 'Bankruptcy', text: 'You lost all liquidity.', background: getSwalBg(), color: getSwalColor(), confirmButtonColor: '#ef4444' });
    }

    if (p.month === 12 && p.status === 'active') {
        Swal.fire({ icon: 'success', title: 'Fiscal Year Complete', text: 'You can now liquidate.', background: getSwalBg(), color: getSwalColor(), confirmButtonColor: '#4ade80' });
    }

    appData.xp += 5;
    saveState();
    renderSimulatorState(p);
}

function liquidateProject() {
    const p = appData.projects.find(x => x.id === appData.activeProjectId);
    if(!p || p.status !== 'active') return;
    
    Swal.fire({
        title: 'Liquidate Position?',
        text: `Return $${Math.floor(p.currentValue).toLocaleString('en-US')} to main balance.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#1a2035',
        cancelButtonColor: '#ef4444',
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        background: getSwalBg(), color: getSwalColor()
    }).then((result) => {
        if (result.isConfirmed) {
            p.status = 'liquidated';
            appData.balance += p.currentValue;
            p.events.push({month: p.month, msg: 'Manual Liquidation.', type:'neutral'});
            saveState();
            renderSimulatorState(p);
            Swal.fire({title: 'Executed', text: 'Capital freed.', icon: 'success', background: getSwalBg(), color: getSwalColor()});
        }
    });
}

// ==========================================
// VALIDADOR LEAN STARTUP
// ==========================================
const validationChecklist = [
    "Interviewed 5 potential customers (Problem/Solution Fit).",
    "Defined my Buyer Persona.",
    "Studied 2 direct competitors.",
    "Drafted a monetization model (Cost structure)."
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
        Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, icon: 'success', title: '+20 XP', text: 'Task completed.', background: getSwalBg(), color: getSwalColor() });
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
        resultBox.innerHTML = '<svg class="w-8 h-8 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> <div class="text-left"><span class="block text-green-700 dark:text-green-400 font-bold">Risk Mitigated</span><span class="text-green-600 dark:text-green-500 font-normal">You have complete validation. Ready to build!</span></div>';
        resultBox.classList.add('border-green-200', 'dark:border-green-500/30', 'bg-green-50', 'dark:bg-green-500/10');
    } else if (score >= 50) {
        resultBox.innerHTML = '<svg class="w-8 h-8 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> <div class="text-left"><span class="block text-yellow-700 dark:text-yellow-400 font-bold">Moderate Risk</span><span class="text-yellow-600 dark:text-yellow-500 font-normal">Missing crucial market validation.</span></div>';
        resultBox.classList.add('border-yellow-200', 'dark:border-yellow-500/30', 'bg-yellow-50', 'dark:bg-yellow-500/10');
    } else {
        resultBox.innerHTML = '<svg class="w-8 h-8 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> <div class="text-left"><span class="block text-red-700 dark:text-red-400 font-bold">Extreme Risk</span><span class="text-red-600 dark:text-red-500 font-normal">Do not launch without talking to real customers.</span></div>';
        resultBox.classList.add('border-red-200', 'dark:border-red-500/30', 'bg-red-50', 'dark:bg-red-500/10');
    }
}
