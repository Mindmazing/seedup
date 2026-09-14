// Estado Global
let balance = 10000;
let investmentChart = null; // Instancia de Chart.js

// ==== AUTENTICACIÓN ====
function handleLogin(event) {
    event.preventDefault();
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('dashboard-layout').style.display = 'flex';
    updateBalanceUI();
}

function logout() {
    document.getElementById('dashboard-layout').style.display = 'none';
    document.getElementById('login-view').classList.remove('hidden');
    
    // Resetear al login
    navigate('dashboard', document.querySelector('.sidebar-nav a:first-child'));
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
    // Pequeño delay para trigger de animación CSS
    setTimeout(() => target.classList.add('active'), 10);
    
    // Actualizar menú activo
    if(element) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        element.classList.add('active');
        document.getElementById('topbar-title').innerText = element.innerText.replace(/[^\w\s\á\é\í\ó\ú\Á\É\Í\Ó\Ú]/g, '').trim();
    }
    
    // Cerrar sidebar en mobile si está abierta
    const sidebar = document.getElementById('sidebar');
    if(sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
    }
    
    // Inicializar chart si entramos a simulador y no existe
    if (viewId === 'simulator' && !investmentChart) {
        initChart();
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function updateBalanceUI() {
    const formatted = `S/ ${balance.toLocaleString('es-PE', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
    document.getElementById('balance-display').innerText = formatted;
    
    const dashBal = document.getElementById('dash-balance');
    if(dashBal) dashBal.innerText = formatted;
    
    const profitBal = document.getElementById('dash-profit');
    if(profitBal) {
        const profit = balance - 10000;
        profitBal.innerText = `S/ ${profit.toLocaleString('es-PE', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
        profitBal.style.color = profit >= 0 ? 'var(--brand-primary)' : 'var(--brand-danger)';
    }
}

// ==== SIMULADOR (Chart.js) ====
function initChart() {
    const ctx = document.getElementById('investmentChart').getContext('2d');
    
    // Datos iniciales vacíos o demo
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
                legend: { labels: { color: '#f8fafc' } }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: { color: '#1e293b' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { color: '#1e293b' },
                    ticks: { color: '#94a3b8' }
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
        showFeedback(feedbackBox, 'Por favor, ingresa un monto válido.', 'var(--brand-warning)');
        return;
    }
    
    if (amount > balance) {
        showFeedback(feedbackBox, 'Capital insuficiente para esta simulación.', 'var(--brand-danger)');
        return;
    }
    
    // Parámetros por riesgo
    let volatility = 0;
    let drift = 0; // Tendencia general
    
    if (type === 'high') {
        volatility = 0.4;  // Alta variación mes a mes
        drift = 0.05;      // Ligera tendencia a subir mucho o caer en picada
    } else if (type === 'medium') {
        volatility = 0.15;
        drift = 0.02;
    } else {
        volatility = 0.05; // Muy estable
        drift = 0.008;     // Crecimiento lento pero seguro
    }
    
    // Generar camino aleatorio (Random Walk con drift)
    let currentVal = amount;
    const dataPoints = [currentVal];
    
    for (let i = 1; i <= 12; i++) {
        // Shock aleatorio normalizado rudimentario
        const shock = (Math.random() + Math.random() + Math.random() - 1.5) * 2; 
        const monthlyChange = drift + (shock * volatility);
        
        currentVal = currentVal * (1 + monthlyChange);
        
        // Un negocio puede quebrar (llegar a 0) pero no tener valor negativo aquí
        if (currentVal < 0) currentVal = 0;
        
        dataPoints.push(currentVal);
    }
    
    const finalAmount = dataPoints[12];
    const profit = finalAmount - amount;
    
    // Actualizar Gráfico
    investmentChart.data.datasets[0].data = dataPoints;
    investmentChart.data.datasets[0].borderColor = profit >= 0 ? '#00ff88' : '#ff4757';
    investmentChart.data.datasets[0].backgroundColor = profit >= 0 ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 71, 87, 0.1)';
    investmentChart.update();
    
    // Descontar inversión inicial y sumar el valor final al balance real
    balance = balance - amount + finalAmount;
    updateBalanceUI();
    
    // Mostrar feedback
    if (profit >= 0) {
        showFeedback(feedbackBox, `¡Éxito! En 12 meses, tu inversión de S/ ${amount} se convirtió en S/ ${finalAmount.toFixed(0)} (+S/ ${profit.toFixed(0)}).`, 'var(--brand-primary)');
    } else {
        showFeedback(feedbackBox, `Fracaso. En 12 meses perdiste S/ ${Math.abs(profit).toFixed(0)}. Valor final: S/ ${finalAmount.toFixed(0)}.`, 'var(--brand-danger)');
    }
}

function showFeedback(element, message, color) {
    element.style.display = 'block';
    element.innerText = message;
    element.style.border = `1px solid ${color}`;
    element.style.color = color;
    element.style.backgroundColor = color.replace(')', ', 0.1)').replace('rgb', 'rgba').replace('var(--brand-primary)', 'rgba(0,255,136,0.1)').replace('var(--brand-danger)', 'rgba(255,71,87,0.1)').replace('var(--brand-warning)', 'rgba(255,165,2,0.1)');
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
    
    resultBox.classList.remove('hidden', 'diagnosis-success', 'diagnosis-warning', 'diagnosis-danger');
    
    if (score === 100) {
        resultBox.innerText = '🔥 Nivel de Viabilidad: EXCELENTE. Has validado todos los pilares del Lean Startup. Tienes luz verde para desarrollar el MVP.';
        resultBox.classList.add('diagnosis-success');
    } else if (score >= 60) {
        resultBox.innerText = '⚠️ Nivel de Viabilidad: MEDIO. Vas por buen camino, pero te faltan validar piezas clave. Te recomendamos investigar más tu modelo de ingresos y competencia.';
        resultBox.classList.add('diagnosis-warning');
    } else {
        resultBox.innerText = '🛑 Nivel de Viabilidad: RIESGO ALTO. Tu idea está basada en supuestos no validados. Habla con clientes potenciales antes de gastar 1 centavo.';
        resultBox.classList.add('diagnosis-danger');
    }
}
