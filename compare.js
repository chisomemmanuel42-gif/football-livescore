
const players = [
  // From your Player profiles section
  { name: "Victor Osimhen",   position: "Striker",    club: "Napoli",        goals: 19, assists: 0,  press: 9.1, heatmap: "" },
  { name: "C. G. Hansen",     position: "Winger",     club: "Barcelona",     goals: 0,  assists: 12, press: 0,   heatmap: "" },
  { name: "Cristiano Ronaldo",position: "Forward",    club: "Al-Nassr",      goals: 0,  assists: 9,  press: 0,   heatmap: "" },
  { name: "Lionel Messi",     position: "Forward",    club: "Inter Miami",   goals: 0,  assists: 22, press: 0,   heatmap: "" },
  { name: "Sadio Mané",       position: "Winger",     club: "Al-Nassr",      goals: 0,  assists: 12, press: 0,   heatmap: "" },
  { name: "Declan Rice",      position: "Midfielder", club: "Arsenal",       goals: 0,  assists: 0,  press: 0,   heatmap: "" },
  { name: "Erling Haaland",   position: "Striker",    club: "Man City",      goals: 0,  assists: 0,  press: 0,   heatmap: "" },
  { name: "Kylian Mbappé",    position: "Forward",    club: "PSG",           goals: 0,  assists: 0,  press: 0,   heatmap: "" },
  { name: "Kevin De Bruyne",  position: "Midfielder", club: "Man City",      goals: 0,  assists: 0,  press: 0,   heatmap: "" },
  { name: "Jude Bellingham",  position: "Midfielder", club: "Real Madrid",   goals: 0,  assists: 0,  press: 0,   heatmap: "" },
  { name: "Mohamed Salah",    position: "Forward",    club: "Liverpool",     goals: 0,  assists: 0,  press: 0,   heatmap: "" },
  { name: "Bukayo Saka",      position: "Winger",     club: "Arsenal",       goals: 0,  assists: 0,  press: 0,   heatmap: "" },
].map(p => ({
  ...p,
  slug: slugify(p.name),
  heatmap: p.heatmap || `/assets/heatmaps/${slugify(p.name)}.png`
}));

/** Utility: slugify names for ids/urls */
function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** DOM elements */
const slotsWrap   = document.getElementById('playerSlots');
const addBtn      = document.getElementById('addBtn');
const clearBtn    = document.getElementById('clearBtn');
const shareBtn    = document.getElementById('shareBtn');
const resultsWrap = document.getElementById('resultsWrap');
const heatmapRow  = document.getElementById('heatmapRow');

let charts = {
  goals: null,
  assists: null,
  press: null
};

const MAX_PLAYERS = 12;

/** Populate a new selection slot */
function addPlayerSlot(selectedSlug = "") {
  const current = getSelectedSlugs();
  if (current.length >= MAX_PLAYERS) return;

  const slot = document.createElement('div');
  slot.className = 'slot';

  const select = document.createElement('select');
  select.innerHTML = [
    `<option value="">Select player…</option>`,
    ...players.map(p => `<option value="${p.slug}" ${p.slug === selectedSlug ? 'selected' : ''}>${p.name}</option>`)
  ].join("");

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'remove';
  remove.textContent = 'Remove';

  select.addEventListener('change', () => {
    updateAll();
  });
  remove.addEventListener('click', () => {
    slot.remove();
    updateAll();
  });

  slot.appendChild(select);
  slot.appendChild(remove);
  slotsWrap.appendChild(slot);
}

/** Read selected player slugs */
function getSelectedSlugs() {
  return Array.from(slotsWrap.querySelectorAll('select'))
    .map(s => s.value).filter(Boolean);
}

/** Convert slugs to player objects */
function getSelectedPlayers() {
  const map = new Map(players.map(p => [p.slug, p]));
  return getSelectedSlugs().map(slug => map.get(slug)).filter(Boolean);
}

/** Build/update charts + heatmaps + URL */
function updateAll() {
  const selected = getSelectedPlayers();

  // Show results only if 2+ players
  if (selected.length < 2) {
    resultsWrap.classList.add('hidden');
    renderHeatmaps([]);
    destroyCharts();
    updateURL([]);
    return;
  }

  resultsWrap.classList.remove('hidden');

  // Labels and datasets
  const labels = selected.map(p => p.name);
  const goalsData   = selected.map(p => safeNum(p.goals));
  const assistsData = selected.map(p => safeNum(p.assists));
  const pressData   = selected.map(p => safeNum(p.press));

  renderOrUpdateChart('goals',   'goalsChart',   labels, goalsData,   '#5bc0be');
  renderOrUpdateChart('assists', 'assistsChart', labels, assistsData, '#f0a6ca');
  renderOrUpdateChart('press',   'pressChart',   labels, pressData,   '#ffd166');

  renderHeatmaps(selected);

  updateURL(selected.map(p => p.slug));
}

/** Safely coerce to number */
function safeNum(v) { return typeof v === 'number' && isFinite(v) ? v : 0; }

/** Create or update a single-bar chart */
function renderOrUpdateChart(key, canvasId, labels, data, color) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  const conf = {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: key.charAt(0).toUpperCase() + key.slice(1),
        data,
        backgroundColor: color,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      animation: { duration: 350 },
      scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.06)' } },
                x: { grid: { display: false } } },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}`
          }
        }
      }
    }
  };

  if (charts[key]) {
    charts[key].data.labels = labels;
    charts[key].data.datasets[0].data = data;
    charts[key].update();
  } else {
    charts[key] = new Chart(ctx, conf);
  }
}

/** Destroy charts when needed */
function destroyCharts() {
  Object.keys(charts).forEach(k => {
    if (charts[k]) { charts[k].destroy(); charts[k] = null; }
  });
}

/** Render heatmaps row */
function renderHeatmaps(selectedPlayers) {
  heatmapRow.innerHTML = '';
  selectedPlayers.forEach(p => {
    const card = document.createElement('div');
    card.className = 'heatmap';
    const img = document.createElement('img');
    img.src = p.heatmap;
    img.alt = `${p.name} heatmap`;
    // Hide if image missing
    img.onerror = () => { img.style.display = 'none'; };
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.textContent = p.name;
    card.appendChild(img);
    card.appendChild(tag);
    heatmapRow.appendChild(card);
  });
}

/** Shareable URL (?players=slug1,slug2,...) */
function updateURL(slugs) {
  const url = new URL(window.location.href);
  if (slugs.length) {
    url.searchParams.set('players', slugs.join(','));
  } else {
    url.searchParams.delete('players');
  }
  history.replaceState(null, '', url.toString());
}

/** Read URL on load */
function initFromURL() {
  const url = new URL(window.location.href);
  const list = (url.searchParams.get('players') || '')
    .split(',').map(s => s.trim()).filter(Boolean);

  if (list.length) {
    // pre-create slots
    const n = Math.max(2, Math.min(list.length, MAX_PLAYERS));
    for (let i = 0; i < n; i++) addPlayerSlot();
    // set values
    const selects = slotsWrap.querySelectorAll('select');
    list.forEach((slug, i) => {
      if (selects[i]) selects[i].value = slug;
    });
    updateAll();
  } else {
    // default two slots
    addPlayerSlot();
    addPlayerSlot();
  }
}
function connectCompareToSearch(selector = '#siteSearch') {
  const input = document.querySelector(selector);
  if (!input) return;

  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const q = (input.value || '').trim();
    const parts = parseCompareQuery(q);
    if (parts.length >= 2) {
      const slugs = parts
        .map(name => findClosestSlug(name))
        .filter(Boolean);

      if (slugs.length >= 2) {
        const url = new URL(window.location.href);
        url.searchParams.set('players', slugs.join(','));
        window.location.href = url.toString();
      }
    }
  });
}

/** Parse "A vs B" or "compare: A, B, C" patterns */
function parseCompareQuery(q) {
  if (!q) return [];
  const lower = q.toLowerCase();
  if (lower.startsWith('compare:')) {
    return q.split(':')[1].split(',').map(s => s.trim()).filter(Boolean);
  }
  if (q.includes(' vs ')) {
    return q.split(' vs ').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

/** Fuzzy-ish finder: exact match first, then startsWith */
function findClosestSlug(name) {
  const n = name.toLowerCase();
  const exact = players.find(p => p.name.toLowerCase() === n);
  if (exact) return exact.slug;
  const starts = players.find(p => p.name.toLowerCase().startsWith(n));
  return starts ? starts.slug : null;
}

/** Buttons */
addBtn.addEventListener('click', () => addPlayerSlot());
clearBtn.addEventListener('click', () => {
  slotsWrap.innerHTML = '';
  destroyCharts();
  renderHeatmaps([]);
  updateURL([]);
  addPlayerSlot();
  addPlayerSlot();
  resultsWrap.classList.add('hidden');
});
shareBtn.addEventListener('click', async () => {
  const slugs = getSelectedSlugs();
  updateURL(slugs);
  try {
    await navigator.clipboard.writeText(window.location.href);
    shareBtn.textContent = 'Link copied!';
    setTimeout(() => shareBtn.textContent = 'Copy share link', 1500);
  } catch {
    // fallback
    prompt('Copy this link:', window.location.href);
  }
});

/** Kickoff */
document.addEventListener('DOMContentLoaded', () => {
  initFromURL();
});

