const state = {
    currentAct: null,
    currentSection: { act1: 0, act2: 0 },
    travelerPos: { top: '15%', left: '50%' },
    sections: { act1: ['postcard', 'omitted', 'labor', 'foster'], act2: ['king', 'chessboard', 'filth', 'silence', 'lookout', 'bodie', 'double', 'home'] },
    iconPos: { act1: { top: '55%', left: '25%' }, act2: { top: '18%', left: '78%' } }
};

export function initNavigation() {
    document.querySelectorAll('[data-target]').forEach(btn => btn.addEventListener('click', e => navigateTo(e.target.dataset.target)));
    document.querySelectorAll('[data-action="home"]').forEach(btn => btn.addEventListener('click', showHome));
    document.querySelectorAll('.act-nav-btn').forEach(btn => btn.addEventListener('click', handleActNav));
    document.querySelectorAll('.progress-dot').forEach(dot => dot.addEventListener('click', handleProgressClick));
    
    window.addEventListener('hashchange', handleHash);
    if (window.location.hash) handleHash();
}

function navigateTo(page) {
    const traveler = document.getElementById('traveler');
    const overlay = document.getElementById('journeyOverlay');
    const bar = document.getElementById('progressBar');
    
    overlay.classList.add('active');
    document.getElementById('journeyText').textContent = `Journeying to ${page === 'act1' ? 'Act 1: Life on the Bucket' : 'Act 2: The Village Castle'}...`;
    bar.style.width = '0%';
    
    let p = 0;
    const int = setInterval(() => { p += 2.5; bar.style.width = `${Math.min(p, 100)}%`; if(p>=100) clearInterval(int); }, 25);
    
    traveler.classList.add('active');
    traveler.style.transition = 'none';
    traveler.style.top = state.travelerPos.top;
    traveler.style.left = state.travelerPos.left;
    
    setTimeout(() => {
        traveler.style.transition = 'top 1.4s ease-in-out, left 1.4s ease-in-out';
        traveler.style.top = state.iconPos[page].top;
        traveler.style.left = state.iconPos[page].left;
    }, 200);
    
    setTimeout(() => {
        overlay.classList.remove('active');
        document.querySelector('.hero').style.display = 'none';
        document.querySelectorAll('.story-page').forEach(p => p.hidden = true);
        document.getElementById(`${page}-page`).hidden = false;
        
        state.currentAct = page;
        state.currentSection[page] = 0;
        showSection(page, state.sections[page][0]);
        updateActButtons(page);
        
        state.travelerPos = { ...state.iconPos[page] };
        traveler.style.transition = 'none';
        
        document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
        document.querySelector(`.nav-links a[data-page="${page}"]`).classList.add('active');
        window.scrollTo(0,0);
    }, 1800);
}

function showHome() {
    document.getElementById('traveler').classList.remove('active');
    document.querySelector('.hero').style.display = 'flex';
    document.querySelectorAll('.story-page').forEach(p => p.hidden = true);
    state.currentAct = null;
    state.travelerPos = { top: '15%', left: '50%' };
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    document.querySelector('.nav-links a[data-page="home"]').classList.add('active');
    window.scrollTo(0,0);
}

function showSection(act, id) {
    document.querySelectorAll(`#${act}-page .subsection`).forEach(s => s.hidden = true);
    document.getElementById(`${act}-${id}`).hidden = false;
    
    const container = document.getElementById(`${act}-progress`);
    container.innerHTML = '';
    state.sections[act].forEach((sec, i) => {
        const dot = document.createElement('div');
        dot.className = `progress-dot ${sec === id ? 'active' : ''}`;
        dot.dataset.section = sec;
        dot.title = document.querySelector(`#${act}-${sec} .subsection-title`).textContent;
        container.appendChild(dot);
    });
    
    state.currentSection[act] = state.sections[act].indexOf(id);
    updateActButtons(act);
    document.getElementById(`${act}-${id}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handleActNav(e) {
    const act = e.target.closest('.story-page').dataset.act;
    const dir = e.target.id.includes('next') ? 1 : -1;
    const idx = state.currentSection[`act${act}`] + dir;
    if(idx >= 0 && idx < state.sections[`act${act}`].length) showSection(`act${act}`, state.sections[`act${act}`][idx]);
}

function handleProgressClick(e) {
    const act = e.target.closest('.story-page').dataset.act;
    showSection(`act${act}`, e.target.dataset.section);
}

function updateActButtons(act) {
    const idx = state.currentSection[act];
    const total = state.sections[act].length;
    document.getElementById(`${act}-prev`).disabled = idx === 0;
    const next = document.getElementById(`${act}-next`);
    next.disabled = idx === total - 1;
    next.innerHTML = idx === total - 2 ? 'Complete Act <i class="fas fa-flag-checkered"></i>' : 'Next <i class="fas fa-chevron-right"></i>';
}

function handleHash() {
    const hash = window.location.hash.slice(1);
    if(hash && hash !== 'home') navigateTo(hash.startsWith('act') ? hash : 'sources');
}