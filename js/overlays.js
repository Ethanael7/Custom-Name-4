let overlayData = {};

export async function initOverlays() {
    try {
        const res = await fetch('data/overlays.json');
        overlayData = await res.json();
    } catch(e) { console.warn('Overlay JSON failed to load, using fallback', e); }

    document.querySelectorAll('.data-trigger').forEach(btn => {
        btn.addEventListener('click', () => togglePanel(btn));
        btn.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePanel(btn); } });
    });

    document.querySelector('.data-panel__close').addEventListener('click', closePanel);
    document.addEventListener('keydown', e => { if(e.key === 'Escape') closePanel(); });
    document.addEventListener('click', e => { if(!e.target.closest('.data-panel') && !e.target.closest('.data-trigger')) closePanel(); });
}

function togglePanel(trigger) {
    const panel = document.getElementById('dataPanel');
    const id = trigger.dataset.overlay;
    const data = overlayData[id];
    if(!data) return;

    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    if(isOpen) { closePanel(); return; }

    closePanel(); // Close others
    trigger.setAttribute('aria-expanded', 'true');
    panel.setAttribute('aria-hidden', 'false');
    panel.dataset.activeTrigger = id;

    document.getElementById('panelTitle').textContent = data.title;
    document.getElementById('panelCaption').textContent = data.caption;
    document.getElementById('panelSource').textContent = `Source: ${data.source}`;
    document.getElementById('panelChart').innerHTML = renderChartPlaceholder(data);
    
    panel.classList.add('active');
    panel.querySelector('.data-panel__close').focus();
}

function closePanel() {
    const panel = document.getElementById('dataPanel');
    if(!panel.classList.contains('active')) return;
    
    panel.classList.remove('active');
    panel.setAttribute('aria-hidden', 'true');
    
    const triggerId = panel.dataset.activeTrigger;
    if(triggerId) document.querySelector(`[data-overlay="${triggerId}"]`).setAttribute('aria-expanded', 'false');
}

function renderChartPlaceholder(data) {
    return `<i class="fas fa-${data.chartType === 'donut' ? 'chart-pie' : 'chart-bar'}" style="margin-right:8px;"></i> [${data.chartType.toUpperCase()}: ${JSON.stringify(data.data)}]`;
}