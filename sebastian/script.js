/**
 * ============================================
 * APP DE REGULACIÓN - SEBASTIÁN
 * ============================================
 * 
 * ARQUITECTURA DEL CÓDIGO:
 * 
 * 1. ALMACENAMIENTO:
 *    - Todo se guarda en localStorage
 *    - Clave principal: 'sebastian_app_data'
 *    - Historial limitado a 7 días
 * 
 * 2. MÓDULOS:
 *    - Cada sección tiene funciones de carga y guardado
 *    - El guardado es automático al escribir
 *    - Debounce de 500ms para evitar guardados excesivos
 * 
 * 3. PRIVACIDAD:
 *    - Todo es local, nada sale del navegador
 *    - No hay analytics ni tracking
 */

// ====== CONSTANTES ====== //

/**
 * Frases ancla seleccionadas para transmitir calma y control.
 * Criterios de selección:
 * - No motivacionales vacías
 * - No terapéuticas clínicas
 * - Ancladas a la realidad
 * - Lenguaje adulto y sobrio
 */
const ANCHOR_PHRASES = [
    "Un paso a la vez es suficiente.",
    "No necesitas resolver todo hoy.",
    "Lo que sientes es información, no un mandato.",
    "Puedes hacer una pausa cuando quieras.",
    "Estás más preparado de lo que crees.",
    "Hoy solo necesitas lo esencial.",
    "Tu ritmo es válido.",
    "No tienes que demostrar nada a nadie.",
    "Lo que no controlas no es tu responsabilidad.",
    "Cerrar procesos lleva tiempo, y está bien.",
    "Puedes cambiar de opinión.",
    "Lo mínimo también cuenta.",
    "Tu bienestar importa más que las expectativas.",
    "Hoy puedes elegir qué priorizar.",
    "No todo lo urgente es importante.",
    "Está bien no tener todas las respuestas.",
    "Tu energía es un recurso limitado. Adminístralo.",
    "Puedes decir no.",
    "El descanso también es productivo.",
    "Estás cerrando una etapa. Eso tiene valor."
];

/**
 * Recordatorios de identidad - mensajes breves para el módulo de sentido
 * Enfocados en validación sin condescendencia
 */
const IDENTITY_REMINDERS = [
    "No tengo que demostrar nada para tener valor.",
    "Estoy cerrando un proceso de años. Eso importa.",
    "Mi forma de procesar es diferente, no deficiente.",
    "Puedo pedir ayuda sin perder autonomía.",
    "Mis límites son legítimos."
];

// Clave para localStorage
const STORAGE_KEY = 'sebastian_app_data';

// Días de historial a mantener
const HISTORY_DAYS = 7;

// ====== UTILIDADES ====== //

/**
 * Obtiene la fecha actual en formato legible
 * @returns {string} Fecha formateada
 */
function getFormattedDate() {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return new Date().toLocaleDateString('es-ES', options);
}

/**
 * Obtiene la fecha actual en formato ISO (solo fecha)
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
function getTodayKey() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Debounce para evitar guardados excesivos
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Milisegundos de espera
 * @returns {Function} Función con debounce
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Selecciona un elemento aleatorio de un array
 * @param {Array} array - Array de elementos
 * @returns {*} Elemento aleatorio
 */
function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// ====== ALMACENAMIENTO ====== //

/**
 * Carga todos los datos del localStorage
 * @returns {Object} Datos de la aplicación
 */
function loadData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error al cargar datos:', e);
    }
    return getDefaultData();
}

/**
 * Guarda todos los datos en localStorage
 * @param {Object} data - Datos a guardar
 */
function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Error al guardar datos:', e);
    }
}

/**
 * Obtiene la estructura de datos por defecto
 * @returns {Object} Datos iniciales
 */
function getDefaultData() {
    return {
        today: getTodayKey(),
        control: {
            items: []
        },
        relationships: {
            externalExpectation: '',
            needToProtect: ''
        },
        family: {
            theyExpect: '',
            iDecide: ''
        },
        minimalAction: {
            action: '',
            completed: false
        },
        history: []
    };
}

/**
 * Obtiene los datos del día actual, creando nuevos si es necesario
 * @returns {Object} Datos actualizados
 */
function getTodayData() {
    let data = loadData();
    const today = getTodayKey();
    
    // Si es un nuevo día, archivar el anterior y empezar fresco
    if (data.today !== today) {
        archiveDay(data);
        data = {
            ...getDefaultData(),
            today: today,
            history: data.history || []
        };
        saveData(data);
    }
    
    return data;
}

/**
 * Archiva los datos del día anterior en el historial
 * @param {Object} data - Datos a archivar
 */
function archiveDay(data) {
    // Solo archivar si hay contenido significativo
    const hasContent = 
        data.control?.items?.length > 0 ||
        data.minimalAction?.action?.trim() ||
        data.relationships?.externalExpectation?.trim() ||
        data.family?.theyExpect?.trim();
    
    if (hasContent && data.today) {
        const historyEntry = {
            date: data.today,
            control: data.control?.items || [],
            minimalAction: {
                action: data.minimalAction?.action || '',
                completed: data.minimalAction?.completed || false
            }
        };
        
        data.history = data.history || [];
        data.history.unshift(historyEntry);
        
        // Limitar a los últimos 7 días
        data.history = data.history.slice(0, HISTORY_DAYS);
    }
}

// ====== INICIALIZACIÓN DE LA INTERFAZ ====== //

/**
 * Inicializa toda la aplicación
 */
function initApp() {
    const data = getTodayData();
    
    // Mostrar fecha actual
    document.getElementById('currentDate').textContent = getFormattedDate();
    
    // Mostrar saludo personalizado
    updateGreeting();
    
    // Mostrar frase ancla aleatoria
    document.getElementById('anchorPhrase').textContent = getRandomItem(ANCHOR_PHRASES);
    
    // Cargar recordatorios de identidad
    loadIdentityReminders();
    
    // Cargar datos guardados en los campos
    loadControlModule(data);
    loadRelationshipsModule(data);
    loadFamilyModule(data);
    loadMinimalAction(data);
    loadHistory(data);
    
    // Configurar eventos
    setupEventListeners();
    
    console.log('App inicializada correctamente');
}

/**
 * Actualiza el saludo según la hora del día
 */
function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Hola, Sebastián';
    
    if (hour >= 5 && hour < 12) {
        greeting = 'Buenos días, Sebastián';
    } else if (hour >= 12 && hour < 19) {
        greeting = 'Buenas tardes, Sebastián';
    } else {
        greeting = 'Buenas noches, Sebastián';
    }
    
    document.getElementById('greeting').textContent = greeting;
}

/**
 * Carga los recordatorios de identidad en la interfaz
 */
function loadIdentityReminders() {
    const container = document.getElementById('identityCards');
    if (!container) return;
    
    container.innerHTML = IDENTITY_REMINDERS.map(reminder => 
        `<div class="identity-card">${reminder}</div>`
    ).join('');
}

// ====== MÓDULO: CONTROL PERSONAL ====== //

/**
 * Carga el módulo de control con datos guardados
 * @param {Object} data - Datos de la aplicación
 */
function loadControlModule(data) {
    const input = document.getElementById('controlInput');
    if (input && data.control?.items?.length > 0) {
        input.value = data.control.items.join('\n');
    }
}

/**
 * Guarda los elementos de control
 */
const saveControl = debounce(() => {
    const input = document.getElementById('controlInput');
    if (!input) return;
    
    const data = loadData();
    const items = input.value.split('\n').filter(item => item.trim());
    data.control = { items };
    saveData(data);
    
    showSaveIndicator('controlSaved');
}, 500);

// ====== MÓDULO: RELACIONES ====== //

/**
 * Carga el módulo de relaciones con datos guardados
 * @param {Object} data - Datos de la aplicación
 */
function loadRelationshipsModule(data) {
    const expectationField = document.getElementById('externalExpectation');
    const protectField = document.getElementById('needToProtect');
    
    if (expectationField && data.relationships?.externalExpectation) {
        expectationField.value = data.relationships.externalExpectation;
    }
    if (protectField && data.relationships?.needToProtect) {
        protectField.value = data.relationships.needToProtect;
    }
}

/**
 * Guarda los datos de relaciones
 */
const saveRelationships = debounce(() => {
    const data = loadData();
    data.relationships = {
        externalExpectation: document.getElementById('externalExpectation')?.value || '',
        needToProtect: document.getElementById('needToProtect')?.value || ''
    };
    saveData(data);
    
    showSaveIndicator('relationshipsSaved');
}, 500);

// ====== MÓDULO: FAMILIA ====== //

/**
 * Carga el módulo de familia con datos guardados
 * @param {Object} data - Datos de la aplicación
 */
function loadFamilyModule(data) {
    const theyExpectField = document.getElementById('familyExpects');
    const iDecideField = document.getElementById('iDecideToday');
    
    if (theyExpectField && data.family?.theyExpect) {
        theyExpectField.value = data.family.theyExpect;
    }
    if (iDecideField && data.family?.iDecide) {
        iDecideField.value = data.family.iDecide;
    }
}

/**
 * Guarda los datos de familia
 */
const saveFamily = debounce(() => {
    const data = loadData();
    data.family = {
        theyExpect: document.getElementById('familyExpects')?.value || '',
        iDecide: document.getElementById('iDecideToday')?.value || ''
    };
    saveData(data);
    
    showSaveIndicator('familySaved');
}, 500);

// ====== MÓDULO: ACCIÓN MÍNIMA ====== //

/**
 * Carga la acción mínima con datos guardados
 * @param {Object} data - Datos de la aplicación
 */
function loadMinimalAction(data) {
    const actionInput = document.getElementById('minimalActionInput');
    const checkbox = document.getElementById('actionCompleted');
    const checkboxText = document.querySelector('#minimalActionModule .checkbox-text');
    
    if (actionInput && data.minimalAction?.action) {
        actionInput.value = data.minimalAction.action;
    }
    
    if (checkbox) {
        checkbox.checked = data.minimalAction?.completed || false;
        if (checkboxText && checkbox.checked) {
            checkboxText.textContent = '¡Completada!';
        }
    }
}

/**
 * Guarda la acción mínima
 */
const saveMinimalAction = debounce(() => {
    const data = loadData();
    data.minimalAction = {
        action: document.getElementById('minimalActionInput')?.value || '',
        completed: document.getElementById('actionCompleted')?.checked || false
    };
    saveData(data);
    
    showSaveIndicator('actionSaved');
}, 500);

/**
 * Maneja el cambio del checkbox de acción completada
 */
function handleActionComplete() {
    const checkbox = document.getElementById('actionCompleted');
    const checkboxText = document.querySelector('#minimalActionModule .checkbox-text');
    
    if (checkbox && checkboxText) {
        checkboxText.textContent = checkbox.checked ? '¡Completada!' : 'Marcar como hecha';
    }
    
    saveMinimalAction();
}

// ====== HISTORIAL ====== //

/**
 * Carga y muestra el historial
 * @param {Object} data - Datos de la aplicación
 */
function loadHistory(data) {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    const history = data.history || [];
    
    if (history.length === 0) {
        historyList.innerHTML = '<div class="no-history">Aún no hay historial. Tus registros aparecerán aquí.</div>';
        return;
    }
    
    historyList.innerHTML = history.map(entry => {
        const date = new Date(entry.date).toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'short'
        });
        
        let content = '';
        
        if (entry.minimalAction?.action) {
            content += `<div class="history-content">
                <strong>Acción:</strong> ${escapeHtml(entry.minimalAction.action)}
                ${entry.minimalAction.completed ? '<span class="history-completed">✓ Completada</span>' : ''}
            </div>`;
        }
        
        if (entry.control?.length > 0) {
            content += `<div class="history-content">
                <strong>Controlé:</strong> ${entry.control.map(i => escapeHtml(i)).join(', ')}
            </div>`;
        }
        
        return `<div class="history-item">
            <div class="history-date">${date}</div>
            ${content || '<div class="history-content">Sin registros ese día</div>'}
        </div>`;
    }).join('');
}

/**
 * Alterna la visibilidad del historial
 */
function toggleHistory() {
    const historyList = document.getElementById('historyList');
    const toggleBtn = document.getElementById('historyToggle');
    
    if (historyList && toggleBtn) {
        historyList.classList.toggle('active');
        toggleBtn.textContent = historyList.classList.contains('active') 
            ? 'Ocultar historial' 
            : 'Ver últimos 7 días';
    }
}

// ====== BOTÓN STOP / PAUSA ====== //

/**
 * Alterna el panel de pausa
 */
function togglePausePanel() {
    const panel = document.getElementById('pausePanel');
    const button = document.getElementById('stopButton');
    
    if (panel && button) {
        panel.classList.toggle('active');
        button.textContent = panel.classList.contains('active') 
            ? '✕ Cerrar pausa' 
            : '⏸ PAUSA';
    }
}

/**
 * Cierra el panel de pausa
 */
function closePausePanel() {
    const panel = document.getElementById('pausePanel');
    const button = document.getElementById('stopButton');
    
    if (panel && button) {
        panel.classList.remove('active');
        button.textContent = '⏸ PAUSA';
    }
}

// ====== NAVEGACIÓN POR PILARES ====== //

/**
 * Navega hacia un módulo específico
 * @param {string} moduleId - ID del módulo
 */
function navigateToModule(moduleId) {
    const module = document.getElementById(moduleId);
    if (module) {
        module.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Actualizar tabs activos
        document.querySelectorAll('.pillar-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.target === moduleId) {
                tab.classList.add('active');
            }
        });
    }
}

// ====== UTILIDADES DE UI ====== //

/**
 * Muestra un indicador de guardado temporal
 * @param {string} elementId - ID del elemento indicador
 */
function showSaveIndicator(elementId) {
    const indicator = document.getElementById(elementId);
    if (indicator) {
        indicator.classList.remove('show');
        // Forzar reflow para reiniciar la animación
        void indicator.offsetWidth;
        indicator.classList.add('show');
    }
}

/**
 * Escapa HTML para prevenir XSS
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ====== CONFIGURACIÓN DE EVENTOS ====== //

/**
 * Configura todos los event listeners de la aplicación
 */
function setupEventListeners() {
    // Botón STOP / Pausa
    const stopButton = document.getElementById('stopButton');
    if (stopButton) {
        stopButton.addEventListener('click', togglePausePanel);
    }
    
    const closePauseBtn = document.getElementById('closePauseBtn');
    if (closePauseBtn) {
        closePauseBtn.addEventListener('click', closePausePanel);
    }
    
    // Módulo Control
    const controlInput = document.getElementById('controlInput');
    if (controlInput) {
        controlInput.addEventListener('input', saveControl);
    }
    
    // Módulo Relaciones
    const externalExpectation = document.getElementById('externalExpectation');
    const needToProtect = document.getElementById('needToProtect');
    if (externalExpectation) {
        externalExpectation.addEventListener('input', saveRelationships);
    }
    if (needToProtect) {
        needToProtect.addEventListener('input', saveRelationships);
    }
    
    // Módulo Familia
    const familyExpects = document.getElementById('familyExpects');
    const iDecideToday = document.getElementById('iDecideToday');
    if (familyExpects) {
        familyExpects.addEventListener('input', saveFamily);
    }
    if (iDecideToday) {
        iDecideToday.addEventListener('input', saveFamily);
    }
    
    // Módulo Acción Mínima
    const minimalActionInput = document.getElementById('minimalActionInput');
    const actionCompleted = document.getElementById('actionCompleted');
    if (minimalActionInput) {
        minimalActionInput.addEventListener('input', saveMinimalAction);
    }
    if (actionCompleted) {
        actionCompleted.addEventListener('change', handleActionComplete);
    }
    
    // Historial
    const historyToggle = document.getElementById('historyToggle');
    if (historyToggle) {
        historyToggle.addEventListener('click', toggleHistory);
    }
    
    // Navegación por pilares
    document.querySelectorAll('.pillar-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            navigateToModule(tab.dataset.target);
        });
    });
    
    // Permitir cambiar frase ancla al hacer clic
    const anchorPhrase = document.getElementById('anchorPhrase');
    if (anchorPhrase) {
        anchorPhrase.addEventListener('click', () => {
            anchorPhrase.textContent = getRandomItem(ANCHOR_PHRASES);
        });
        anchorPhrase.style.cursor = 'pointer';
        anchorPhrase.title = 'Clic para cambiar frase';
    }
}

// ====== INICIO ====== //

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);
