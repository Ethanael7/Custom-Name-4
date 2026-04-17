const modal = document.getElementById('contextModal');
const modalTitle = document.getElementById('contextTitle');
const modalCaption = document.getElementById('contextCaption');
const modalNote = document.getElementById('contextNote');
const modalSource = document.getElementById('contextSource');
const chartCanvas = document.getElementById('contextChart');
const closeButton = document.querySelector('.context-modal__close');
const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.getElementById('site-nav');
const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.site-nav a')];
const backToTopButton = document.getElementById('backToTop');
const footerBackToTopButton = document.getElementById('footerBackToTop');

let overlayData = {};
let activeChart = null;

init();

async function init() {
  await loadOverlayData();
  bindContextButtons();
  bindModal();
  bindMobileMenu();
  setupRevealOnScroll();
  setupActiveNav();
  bindBackToTop();
}

async function loadOverlayData() {
  try {
    const response = await fetch('data/overlays.json');
    if (!response.ok) throw new Error(`Unable to load overlays: ${response.status}`);
    overlayData = await response.json();
  } catch (error) {
    console.error(error);
    overlayData = {};
  }
}

function bindContextButtons() {
  document.querySelectorAll('.context-button').forEach((button) => {
    button.addEventListener('click', () => openOverlay(button.dataset.overlay));
  });
}

function bindModal() {
  closeButton?.addEventListener('click', closeOverlay);
  modal?.addEventListener('click', (event) => {
    const rect = modal.getBoundingClientRect();
    const withinDialog = (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    );

    if (!withinDialog) closeOverlay();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal?.open) closeOverlay();
  });
}

function bindMobileMenu() {
  menuToggle?.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    siteNav.classList.toggle('is-open', !expanded);
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      menuToggle?.setAttribute('aria-expanded', 'false');
      siteNav.classList.remove('is-open');
    });
  });
}

function openOverlay(id) {
  const overlay = overlayData[id];
  if (!overlay || !modal || !chartCanvas || typeof Chart === 'undefined') return;

  modalTitle.textContent = overlay.title;
  modalCaption.textContent = overlay.caption;
  modalNote.textContent = overlay.note || '';
  modalSource.textContent = `Source: ${overlay.source}`;

  if (typeof modal.showModal === 'function') {
    modal.showModal();
  } else {
    modal.setAttribute('open', 'open');
  }

  requestAnimationFrame(() => {
    renderChart(overlay);
  });
}

function closeOverlay() {
  destroyChart();
  if (!modal) return;
  if (typeof modal.close === 'function') {
    modal.close();
  } else {
    modal.removeAttribute('open');
  }
}

function destroyChart() {
  if (activeChart) {
    activeChart.destroy();
    activeChart = null;
  }
}

function renderChart(overlay) {
  destroyChart();

  const config = buildChartConfig(overlay);
  if (!config) return;

  activeChart = new Chart(chartCanvas, config);
}

function buildChartConfig(overlay) {
  const labels = overlay.chart?.labels || [];
  const datasets = (overlay.chart?.datasets || []).map((dataset, index) => {
    const palette = getPalette(overlay.chartType, index, dataset.data.length);
    return {
      borderRadius: overlay.chartType === 'bar' ? 10 : 0,
      borderWidth: overlay.chartType === 'radar' ? 2 : 1.5,
      borderColor: palette.borderColor,
      backgroundColor: palette.backgroundColor,
      pointBackgroundColor: palette.pointColor,
      pointBorderColor: palette.pointColor,
      pointRadius: overlay.chartType === 'line' ? 4 : 3,
      pointHoverRadius: overlay.chartType === 'line' ? 5 : 4,
      tension: overlay.chartType === 'line' ? 0.35 : 0,
      fill: overlay.chartType === 'line',
      ...dataset,
    };
  });

  const isCircular = ['doughnut', 'pie', 'polarArea'].includes(overlay.chartType);
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 650, easing: 'easeOutQuart' },
    plugins: {
      legend: {
        display: true,
        position: isCircular ? 'bottom' : 'top',
        labels: {
          color: '#d7dce5',
          boxWidth: 14,
          boxHeight: 14,
          usePointStyle: isCircular,
          pointStyle: 'circle',
          padding: 18,
          font: { family: 'Inter', size: 12, weight: '600' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(10, 12, 16, 0.95)',
        borderColor: 'rgba(214, 181, 91, 0.45)',
        borderWidth: 1,
        titleColor: '#f4f6fb',
        bodyColor: '#d7dce5',
        padding: 12,
        displayColors: true,
        callbacks: {
          label(context) {
            const value = context.parsed?.y ?? context.parsed ?? context.raw;
            return `${context.dataset.label}: ${value}`;
          }
        }
      }
    }
  };

  if (!isCircular) {
    commonOptions.scales = buildScales(overlay);
  }

  return {
    type: overlay.chartType,
    data: { labels, datasets },
    options: commonOptions
  };
}

function buildScales(overlay) {
  const tickColor = '#b7c0ce';
  const gridColor = 'rgba(255,255,255,0.08)';
  const yMax = overlay.chart?.yMax;

  if (overlay.chartType === 'radar') {
    return {
      r: {
        suggestedMin: 0,
        suggestedMax: yMax || 100,
        angleLines: { color: gridColor },
        grid: { color: gridColor },
        pointLabels: {
          color: '#d7dce5',
          font: { family: 'Inter', size: 11, weight: '600' }
        },
        ticks: {
          color: tickColor,
          backdropColor: 'transparent',
          stepSize: 20
        }
      }
    };
  }

  return {
    x: {
      ticks: {
        color: tickColor,
        font: { family: 'Inter', size: 12, weight: '600' }
      },
      grid: { display: false },
      border: { color: gridColor }
    },
    y: {
      beginAtZero: true,
      suggestedMax: yMax,
      ticks: {
        color: tickColor,
        font: { family: 'Inter', size: 11 },
        precision: 0
      },
      grid: { color: gridColor },
      border: { color: gridColor }
    }
  };
}

function getPalette(type, datasetIndex, pointCount) {
  const gold = 'rgba(214, 181, 91, 0.88)';
  const goldSoft = 'rgba(214, 181, 91, 0.24)';
  const blue = 'rgba(120, 167, 255, 0.88)';
  const blueSoft = 'rgba(120, 167, 255, 0.22)';
  const rose = 'rgba(235, 119, 119, 0.86)';
  const roseSoft = 'rgba(235, 119, 119, 0.22)';
  const teal = 'rgba(111, 214, 196, 0.86)';
  const tealSoft = 'rgba(111, 214, 196, 0.22)';
  const slate = 'rgba(133, 145, 165, 0.78)';
  const slateSoft = 'rgba(133, 145, 165, 0.22)';

  if (['doughnut', 'pie', 'polarArea'].includes(type)) {
    const palette = [gold, blue, rose, teal, slate];
    return {
      borderColor: 'rgba(11, 13, 16, 0.95)',
      backgroundColor: Array.from({ length: pointCount }, (_, i) => palette[i % palette.length]),
      pointColor: gold
    };
  }

  if (type === 'line') {
    return datasetIndex === 0
      ? { borderColor: gold, backgroundColor: goldSoft, pointColor: gold }
      : { borderColor: blue, backgroundColor: blueSoft, pointColor: blue };
  }

  if (type === 'radar') {
    return datasetIndex === 0
      ? { borderColor: gold, backgroundColor: goldSoft, pointColor: gold }
      : { borderColor: blue, backgroundColor: blueSoft, pointColor: blue };
  }

  return datasetIndex === 0
    ? { borderColor: gold, backgroundColor: gold, pointColor: gold }
    : { borderColor: blue, backgroundColor: blue, pointColor: blue };
}

function setupRevealOnScroll() {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });

  items.forEach((item) => observer.observe(item));
}

function setupActiveNav() {
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    navLinks.forEach((link) => {
      const match = link.getAttribute('href') === `#${visible.target.id}`;
      link.classList.toggle('is-active', match);
    });
  }, {
    rootMargin: '-35% 0px -45% 0px',
    threshold: [0.15, 0.35, 0.55]
  });

  sections.forEach((section) => observer.observe(section));
}


function bindBackToTop() {
  const buttons = [backToTopButton, footerBackToTopButton].filter(Boolean);
  if (!buttons.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
      history.replaceState(null, '', '#top');
    });
  });

  const toggleFloatingButton = () => {
    if (!backToTopButton) return;
    backToTopButton.classList.toggle('is-visible', window.scrollY > 500);
  };

  toggleFloatingButton();
  window.addEventListener('scroll', toggleFloatingButton, { passive: true });
}
