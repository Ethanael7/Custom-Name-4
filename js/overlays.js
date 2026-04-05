let overlayData = {};
let activeTrigger = null;

export async function initOverlays() {
    try {
        const res = await fetch('data/overlays.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        overlayData = await res.json();
        console.log('✅ Overlay data loaded:', Object.keys(overlayData).length, 'overlays');
    } catch (err) {
        console.error('❌ Failed to load overlay data:', err);
        overlayData = {};
    }

    // Attach event listeners to all data trigger buttons
    document.querySelectorAll('.data-trigger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePanel(btn);
        });
        
        // Keyboard accessibility
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                togglePanel(btn);
            }
        });
    });

    // Close button
    const closeBtn = document.querySelector('.data-panel__close');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closePanel();
        });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeTrigger) {
            closePanel();
        }
    });

    // Close when clicking outside panel
    document.addEventListener('click', (e) => {
        const panel = document.getElementById('dataPanel');
        if (!panel.contains(e.target) && !e.target.closest('.data-trigger')) {
            closePanel();
        }
    });
}

function togglePanel(trigger) {
    const panelId = trigger.dataset.overlay;
    const data = overlayData[panelId];
    
    if (!data) {
        console.warn('⚠️ No data found for overlay:', panelId);
        alert('Data not found: ' + panelId + '\n\nMake sure data/overlays.json exists and contains this key.');
        return;
    }

    // If this trigger is already active, close it
    if (activeTrigger === trigger) {
        closePanel();
        return;
    }

    // Close any open panel first
    closePanel();

    // Set this as the active trigger
    activeTrigger = trigger;
    trigger.setAttribute('aria-expanded', 'true');

    // Populate panel content
    const panel = document.getElementById('dataPanel');
    document.getElementById('panelTitle').textContent = data.title;
    document.getElementById('panelCaption').textContent = data.caption;
    document.getElementById('panelSource').textContent = `Source: ${data.source}`;
    
    // Render chart placeholder
    const chartContainer = document.getElementById('panelChart');
    chartContainer.innerHTML = renderChartPlaceholder(data);

    // Show panel
    panel.setAttribute('aria-hidden', 'false');
    panel.classList.add('active');
    panel.dataset.activeOverlay = panelId;

    // Position panel near trigger
    positionPanel(trigger, panel);

    // Focus the close button for accessibility
    const closeBtn = panel.querySelector('.data-panel__close');
    if (closeBtn) {
        setTimeout(() => closeBtn.focus(), 100);
    }
}

function positionPanel(trigger, panel) {
    const triggerRect = trigger.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = triggerRect.bottom + window.scrollY + 10;
    let left = triggerRect.left + window.scrollX;

    // Prevent horizontal overflow
    if (left + panelRect.width > viewportWidth - 20) {
        left = viewportWidth - panelRect.width - 20;
    }

    // If panel goes off bottom, show above trigger
    if (top + panelRect.height > viewportHeight + window.scrollY - 20) {
        top = triggerRect.top + window.scrollY - panelRect.height - 10;
    }

    // Ensure minimum left position
    left = Math.max(10, left);

    panel.style.top = `${top}px`;
    panel.style.left = `${left}px`;
}

function renderChartPlaceholder(data) {
    const iconClass = data.chartType === 'donut' ? 'chart-pie' : 
                      data.chartType === 'line' ? 'chart-line' : 'chart-bar';
    
    return `
        <div style="text-align: center; padding: 20px;">
            <i class="fas fa-${iconClass}" style="font-size: 3rem; color: var(--gold); opacity: 0.6;"></i>
            <p style="margin-top: 10px; font-size: 0.9rem; color: var(--text-dim);">
                [${data.chartType.toUpperCase()} Chart]<br>
                <small>Data loaded from JSON</small>
            </p>
        </div>
    `;
}

function closePanel() {
    if (!activeTrigger) return;

    const panel = document.getElementById('dataPanel');
    panel.classList.remove('active');
    panel.setAttribute('aria-hidden', 'true');
    
    // Reset trigger state
    activeTrigger.setAttribute('aria-expanded', 'false');
    activeTrigger = null;
}