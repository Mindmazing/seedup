// Estado Global
let balance = 10000;

// Utilidades DOM
const balanceDisplay = document.getElementById('balance-display');

// Navegación
function navigate(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
        view.classList.add('hidden');
    });
    const targetView = document.getElementById(viewId);
    targetView.classList.remove('hidden');
    targetView.classList.add('active');
    
    // Limpiar resultados anteriores al cambiar de pestaña
    if(viewId !== 'simulator') {
        const sr = document.getElementById('sim-result');
        sr.className = '';
        sr.classList.remove('show');
    }
    if(viewId !== 'validator') {
        const vr = document.getElementById('val-result');
        vr.className = '';
        vr.classList.remove('show');
    }
}

// Actualizar UI
function updateBalanceUI() {
    // Formato con separadores de miles
    balanceDisplay.innerText = `S/ ${balance.toLocaleString('es-PE')}`;
}

// Simulador de Inversiones
function invest(amount, risk) {
    const resultBox = document.getElementById('sim-result');
    
    if (balance < amount) {
        showResult(resultBox, '⚠️ Fondos insuficientes para esta inversión.', 'danger-msg');
        return;
    }

    // Lógica de riesgo
    let successProbability = 0;
    let returnMultiplier = 0;

    switch(risk) {
        case 'high':
            successProbability = 0.35; // 35% de éxito
            returnMultiplier = 3.0;    // Triplica inversión
            break;
        case 'medium':
            successProbability = 0.65; // 65% de éxito
            returnMultiplier = 1.5;    // Gana 50% extra
            break;
        case 'low':
            successProbability = 0.90; // 90% de éxito
            returnMultiplier = 1.1;    // Gana 10% extra
            break;
    }

    // Restar inversión inicial
    balance -= amount;
    
    // Determinar resultado
    const isSuccess = Math.random() < successProbability;
    
    if (isSuccess) {
        const winnings = amount * returnMultiplier;
        balance += winnings;
        const profit = winnings - amount;
        showResult(resultBox, `🚀 ¡Inversión exitosa! Retorno total: S/ ${winnings.toFixed(0)} (Ganancia: S/ ${profit.toFixed(0)}).`, 'success-msg');
    } else {
        showResult(resultBox, `📉 La inversión fracasó. Perdiste los S/ ${amount} invertidos. ¡Analiza qué salió mal y vuelve a intentar!`, 'danger-msg');
    }

    updateBalanceUI();
}

// Asistente de Validación
function validateIdea(event) {
    event.preventDefault(); // Evitar recarga
    
    const form = event.target;
    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    const resultBox = document.getElementById('val-result');
    
    let checkedCount = 0;
    checkboxes.forEach(cb => {
        if (cb.checked) checkedCount++;
    });

    const scorePercentage = (checkedCount / checkboxes.length) * 100;

    if (scorePercentage === 100) {
        showResult(resultBox, '🌟 ¡Excelente! Tu idea tiene fundamentos muy sólidos. Tienes luz verde para desarrollar el MVP.', 'success-msg');
    } else if (scorePercentage >= 50) {
        showResult(resultBox, '⚠️ Vas por buen camino, pero te faltan pilares clave. Vuelve a investigar esos puntos antes de lanzar.', 'warning-msg');
    } else {
        showResult(resultBox, '🛑 Riesgo Crítico: Tu modelo de negocio aún está crudo. No inviertas capital hasta resolver estas preguntas básicas.', 'danger-msg');
    }
}

// Función auxiliar para mostrar mensajes
function showResult(element, message, typeClass) {
    element.innerText = message;
    element.className = typeClass + ' show';
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    updateBalanceUI();
});
