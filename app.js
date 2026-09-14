// Estado Global
let balance = 10000;
let investmentChart = null; // Instancia de Chart.js

// ==== AUTENTICACIÓN ====
function handleLogin(event) {
    event.preventDefault();
    
    const loginView = document.getElementById('login-view');
    const dashboardLayout = document.getElementById('dashboard-layout');
    
    // Transición suave
    loginView.classList.add('opacity-0');
    
    setTimeout(() => {
        loginView.classList.add('hidden');
        loginView.classList.remove('flex');
        
        dashboardLayout.classList.remove('hidden');
        // Pequeño delay para trigger opacity transition
        setTimeout(() => {
            dashboardLayout.classList.remove('opacity-0', 'pointer-events-none');
        }, 50);
        
        updateBalanceUI();
    }, 500); // 500ms duration matching tailwind transition-opacity duration-500
}

function logout() {
    const loginView = document.getElementById('login-view');
    const dashboardLayout = document.getElementById('dashboard-layout');
    
    dashboardLayout.classList.add('opacity-0', 'pointer-events-none');
    
    setTimeout(() => {
        dashboardLayout.classList.add('hidden');
        
        loginView.classList.remove('hidden');
        loginView.classList.add('flex');
        
        setTimeout(() => {
            loginView.classList.remove('opacity-0');
        }, 50);
        
        // Resetear vista interna al panel principal
        navigate('dashboard', document.querySelector('.nav-item'));
    }, 500);
}

// ==== NAVEGACIÓN Y UI ====
function navigate(viewId, element) {
    // Actualizar vistas
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
        view.classList.add('hidden');
    });
    const target = document.getElementById(viewId);
    target.classList.remove('hidden');
    
    // Hack para reiniciar animación CSS
    target.style.animation = 'none';
    target.offsetHeight; /* trigger reflow */
    target.style.animation = null; 
    
    target.classList.add('active');
    
    // Actualizar menú activo
    if(element) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        element.classList.add('active');
        
        // Extraer texto limpio para el título
        const titleText = element.querySelector('.font-medium').innerText;
        document.getElementById('topbar-title').innerText = titleText;
    }
    
    // Cerrar sidebar en mobile si está abierta
    const sidebar = document.getElementById('sidebar');
    if(!sidebar.classList.contains('-translate-x-full')) {
        toggleSidebar();
    }
    
    // Inicializar chart si entramos a simulador y no existe
    if (viewId === 'simulator' && !investmentChart) {
        initChart();
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full');
    } else {
        sidebar.classList.add('-translate-x-full');
    }
}

function updateBalanceUI() {
    const formatted = `S/ ${balance.toLocaleString('es-PE', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
    
    const displayTop = document.getElementById('balance-display');
    if(displayTop) displayTop.innerText = formatted;
    
    const dashBal = document.getElementById('dash-balance');
    if(dashBal) dashBal.innerText = formatted;
    
    const profitBal = document.getElementById('dash-profit');
    if(profitBal) {
        const profit = balance - 10000;
        profitBal.innerText = `S/ ${profit.toLocaleString('es-PE', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
        profitBal.className = profit >= 0 ? 'font-orbitron text-2xl text-brand-primary' : 'font-orbitron text-2xl text-red-400';
    }
}

// ==== SIMULADOR (Chart.js) ====
function initChart() {
    const ctx = document.getElementById('investmentChart').getContext('2d');
    
    const data = {
        labels: ['Mes 0', 'Mes 1', 'Mes 2', 'Mes 3', 'Mes 4', 'Mes 5', 'Mes 6', 'Mes 7', 'Mes 8', 'Mes 9', 'Mes 10', 'Mes 11', 'Mes 12'],
        datasets: [{
            label: 'Evolución del Capital (S/)',
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            borderColor: '#00d2ff',
            backgroundColor: 'rgba(0, 210, 255, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
        }]
    };
    
    investmentChart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#cbd5e1', font: { family: 'Inter' } } }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(30, 41, 59, 0.5)' },
                    ticks: { color: '#94a3b8', font: { family: 'Inter' } }
                },
                x: {
                    grid: { color: 'rgba(30, 41, 59, 0.5)' },
                    ticks: { color: '#94a3b8', font: { family: 'Inter' } }
                }
            }
        }
    });
}

function runSimulation() {
    const amount = parseFloat(document.getElementById('sim-amount').value);
    const type = document.getElementById('sim-type').value;
    const feedbackBox = document.getElementById('sim-feedback');
    
    if (isNaN(amount) || amount <= 0) {
        showFeedback(feedbackBox, 'Por favor, ingresa un monto válido.', 'border-yellow-500/50 bg-yellow-500/10 text-yellow-500');
        return;
    }
    
    if (amount > balance) {
        showFeedback(feedbackBox, 'Capital insuficiente para esta simulación.', 'border-red-500/50 bg-red-500/10 text-red-400');
        return;
    }
    
    let volatility = 0;
    let drift = 0;
    
    if (type === 'high') {
        volatility = 0.4;
        drift = 0.05;
    } else if (type === 'medium') {
        volatility = 0.15;
        drift = 0.02;
    } else {
        volatility = 0.05;
        drift = 0.008;
    }
    
    let currentVal = amount;
    const dataPoints = [currentVal];
    
    for (let i = 1; i <= 12; i++) {
        const shock = (Math.random() + Math.random() + Math.random() - 1.5) * 2; 
        const monthlyChange = drift + (shock * volatility);
        currentVal = currentVal * (1 + monthlyChange);
        if (currentVal < 0) currentVal = 0;
        dataPoints.push(currentVal);
    }
    
    const finalAmount = dataPoints[12];
    const profit = finalAmount - amount;
    
    investmentChart.data.datasets[0].data = dataPoints;
    investmentChart.data.datasets[0].borderColor = profit >= 0 ? '#00ff88' : '#ef4444';
    investmentChart.data.datasets[0].backgroundColor = profit >= 0 ? 'rgba(0, 255, 136, 0.15)' : 'rgba(239, 68, 68, 0.15)';
    investmentChart.update();
    
    balance = balance - amount + finalAmount;
    updateBalanceUI();
    
    if (profit >= 0) {
        showFeedback(feedbackBox, `¡Éxito! En 12 meses, tu inversión de S/ ${amount} se convirtió en S/ ${finalAmount.toFixed(0)} (+S/ ${profit.toFixed(0)}).`, 'border-[#00ff88]/50 bg-[#00ff88]/10 text-[#00ff88]');
    } else {
        showFeedback(feedbackBox, `Fracaso. En 12 meses perdiste S/ ${Math.abs(profit).toFixed(0)}. Valor final: S/ ${finalAmount.toFixed(0)}.`, 'border-red-500/50 bg-red-500/10 text-red-400');
    }
}

function showFeedback(element, message, tailwindClasses) {
    element.classList.remove('hidden', 'border-yellow-500/50', 'bg-yellow-500/10', 'text-yellow-500', 'border-red-500/50', 'bg-red-500/10', 'text-red-400', 'border-[#00ff88]/50', 'bg-[#00ff88]/10', 'text-[#00ff88]');
    
    const classes = tailwindClasses.split(' ');
    element.classList.add(...classes);
    element.innerText = message;
    element.style.display = 'block';
}

// ==== VALIDADOR ====
function validateIdea(event) {
    event.preventDefault();
    const form = event.target;
    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    const resultBox = document.getElementById('val-result');
    
    let checkedCount = 0;
    checkboxes.forEach(cb => { if (cb.checked) checkedCount++; });
    const score = (checkedCount / checkboxes.length) * 100;
    
    resultBox.classList.remove('hidden', 'bg-[#00ff88]/10', 'border-[#00ff88]', 'text-[#00ff88]', 'bg-yellow-500/10', 'border-yellow-500', 'text-yellow-500', 'bg-red-500/10', 'border-red-500', 'text-red-400');
    
    if (score === 100) {
        resultBox.innerText = '🔥 Nivel de Viabilidad: EXCELENTE. Has validado todos los pilares del Lean Startup. Tienes luz verde para desarrollar el MVP.';
        resultBox.classList.add('bg-[#00ff88]/10', 'border-[#00ff88]', 'text-[#00ff88]');
    } else if (score >= 60) {
        resultBox.innerText = '⚠️ Nivel de Viabilidad: MEDIO. Vas por buen camino, pero te faltan validar piezas clave. Te recomendamos investigar más tu modelo de ingresos y competencia.';
        resultBox.classList.add('bg-yellow-500/10', 'border-yellow-500', 'text-yellow-500');
    } else {
        resultBox.innerText = '🛑 Nivel de Viabilidad: RIESGO ALTO. Tu idea está basada en supuestos no validados. Habla con clientes potenciales antes de gastar 1 centavo.';
        resultBox.classList.add('bg-red-500/10', 'border-red-500', 'text-red-400');
    }
}
