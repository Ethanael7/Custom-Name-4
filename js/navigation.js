const state = {
    currentAct: null,
    currentSection: { act1: 0, act2: 0, act3: 0, act4: 0 },
    travelerPos: { top: '15%', left: '50%' },
    sections: { 
        act1: ['postcard', 'omitted', 'labor', 'foster'], 
        act2: ['king', 'chessboard', 'filth', 'silence', 'lookout', 'bodie', 'double', 'home'],
        act3: ['foster-bodie', 'king-arrival', 'ice-speech', 'killing', 'gratitude'],
        act4: ['aftermath', 'cleaning', 'refusal', 'bone', 'seesaw']
    },
    iconPos: { 
        act1: { top: '55%', left: '25%' }, 
        act2: { top: '18%', left: '78%' },
        act3: { top: '65%', left: '65%' },
        act4: { top: '75%', left: '35%' }
    }
};

export function initNavigation() {
    document.querySelectorAll('[data-target]').forEach(btn => btn.addEventListener('click', e => { e.preventDefault(); navigateTo(btn.dataset.target); }));
    document.querySelectorAll('[data-action="home"]').forEach(btn => btn.addEventListener('click', e => { e.preventDefault(); showHome(); }));
    document.querySelectorAll('.act-nav-btn').forEach(btn => btn.addEventListener('click', handleActNav));
    document.querySelectorAll('.progress-dot').forEach(dot => dot.addEventListener('click', handleProgressClick));
    
    window.addEventListener('hashchange', handleHash);
    if (window.location.hash) handleHash();
}

function navigateTo(page) {
    const traveler = document.getElementById('traveler');
    const overlay = document.getElementById('journeyOverlay');
    const bar = document.getElementById('progressBar');
    
    if (!state.sections[page]) {
        document.querySelector('.hero').style.display = 'none';
        document.querySelectorAll('.story-page').forEach(p => p.hidden = true);
        const target = document.getElementById(`${page}-page`);
        if (target) target.hidden = false;
        document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
        const navLink = document.querySelector(`.nav-links a[data-page="${page}"]`);
        if (navLink) navLink.classList.add('active');
        window.scrollTo(0, 0);
        return;
    }
    
    overlay.classList.add('active');
    bar.style.width = '0%';
    
    const pageLabels = {
        act1: 'Act 1: Life on the Bucket',
        act2: 'Act 2: The Village Castle',
        act3: 'Act 3: The Cost of Power',
        act4: 'Act 4: Balance'
    };
    document.getElementById('journeyText').textContent = `Journeying to ${pageLabels[page]}...`;
    
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
    const target = document.getElementById(`${act}-${id}`);
    if (target) target.hidden = false;
    
    const container = document.getElementById(`${act}-progress`);
    container.innerHTML = '';
    state.sections[act].forEach((sec) => {
        const dot = document.createElement('div');
        dot.className = `progress-dot ${sec === id ? 'active' : ''}`;
        dot.dataset.section = sec;
        const titleEl = document.querySelector(`#${act}-${sec} .subsection-title`);
        dot.title = titleEl ? titleEl.textContent.trim() : sec;
        container.appendChild(dot);
    });
    
    state.currentSection[act] = state.sections[act].indexOf(id);
    updateActButtons(act);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handleActNav(e) {
    const page = e.target.closest('.story-page').id.replace('-page', '');
    const dir = e.target.id.includes('next') ? 1 : -1;
    const idx = state.currentSection[page] + dir;
    if(idx >= 0 && idx < state.sections[page].length) showSection(page, state.sections[page][idx]);
}

function handleProgressClick(e) {
    const page = e.target.closest('.story-page').id.replace('-page', '');
    showSection(page, e.target.dataset.section);
}

function updateActButtons(act) {
    const idx = state.currentSection[act];
    const total = state.sections[act].length;
    const prevBtn = document.getElementById(`${act}-prev`);
    const nextBtn = document.getElementById(`${act}-next`);
    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) {
        nextBtn.disabled = idx === total - 1;
        nextBtn.innerHTML = idx === total - 2 ? 'Complete Act <i class="fas fa-flag-checkered"></i>' : 'Next <i class="fas fa-chevron-right"></i>';
    }
}

function handleHash() {
    const hash = window.location.hash.slice(1);
    if(hash && hash !== 'home') navigateTo(hash.startsWith('act') ? hash : hash);
}