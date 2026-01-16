// Brand palette
const brand = {
    accent: '#19c37d',
    teal: '#0aa57a',
    ink: '#0a2233',
    warn: '#ffc107',
    danger: '#dc3545',
    grid: 'rgba(143,179,201,.25)',
    text: '#e8f2f6'
};

// ---------- Pass Network Data ----------
const passNetworkData = {
    players: [
        { id: 'GK', name: 'Goalkeeper', x: 8, y: 50, touches: 28, influence: 'low' },
        { id: 'RB', name: 'Right Back', x: 22, y: 72, touches: 58, influence: 'med' },
        { id: 'RCB', name: 'RCB', x: 20, y: 54, touches: 72, influence: 'med' },
        { id: 'LCB', name: 'LCB', x: 20, y: 46, touches: 74, influence: 'med' },
        { id: 'LB', name: 'Left Back', x: 22, y: 28, touches: 64, influence: 'med' },
        { id: 'DM', name: 'Pivot 6', x: 36, y: 50, touches: 86, influence: 'high' },
        { id: 'RCM', name: 'RCM 8', x: 50, y: 60, touches: 68, influence: 'med' },
        { id: 'LCM', name: 'LCM 8', x: 50, y: 40, touches: 66, influence: 'med' },
        { id: 'RW', name: 'Right Wing', x: 70, y: 78, touches: 52, influence: 'low' },
        { id: 'LW', name: 'Left Wing', x: 70, y: 22, touches: 50, influence: 'low' },
        { id: 'ST', name: 'Striker 9', x: 78, y: 50, touches: 39, influence: 'low' },
        { id: 'AM', name: '10', x: 62, y: 50, touches: 61, influence: 'med' }
    ],
    links: [
        { from: 'GK', to: 'RCB', count: 9 }, { from: 'GK', to: 'LCB', count: 11 },
        { from: 'RCB', to: 'RB', count: 18 }, { from: 'LCB', to: 'LB', count: 17 },
        { from: 'RCB', to: 'DM', count: 22 }, { from: 'LCB', to: 'DM', count: 24 },
        { from: 'DM', to: 'RCM', count: 27 }, { from: 'DM', to: 'LCM', count: 25 },
        { from: 'RCM', to: 'RW', count: 14 }, { from: 'LCM', to: 'LW', count: 12 },
        { from: 'RCM', to: 'AM', count: 16 }, { from: 'LCM', to: 'AM', count: 15 },
        { from: 'AM', to: 'ST', count: 13 }, { from: 'RB', to: 'RW', count: 9 },
        { from: 'LB', to: 'LW', count: 8 }
    ]
};

// Helpers for pass network
function influenceColor(level) {
    if (level === 'high') return brand.accent;
    if (level === 'med') return brand.teal;
    return 'rgba(188,215,230,.85)';
}
function nodeRadius(touches) {
    const min = 32, max = 90;
    const t = Math.max(min, Math.min(max, touches));
    return 6 + (t - min) / (max - min) * 10;
}

// Pitch background plugin
const passPitchPlugin = {
    id: 'passPitch',
    beforeDatasetsDraw(chart) {
        const { ctx, chartArea: { left, top, width, height, bottom } } = chart;
        ctx.save();
        ctx.fillStyle = 'rgba(6,32,41,.45)';
        ctx.fillRect(left, top, width, height);
        ctx.strokeStyle = brand.grid;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(left + width / 3, top); ctx.lineTo(left + width / 3, bottom);
        ctx.moveTo(left + 2 * width / 3, top); ctx.lineTo(left + 2 * width / 3, bottom);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(left + width / 2, top + height / 2, Math.min(width, height) * 0.12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
};
// Link‑drawing plugin
const passLinksPlugin = {
    id: 'passLinks',
    afterDatasetsDraw(chart) {
        const { ctx } = chart;
        const dataset = chart.data.datasets[0];
        const meta = chart.getDatasetMeta(0);
        const byId = {};
        dataset.data.forEach((d, i) => {
            const id = dataset.ids[i];
            const pt = meta.data[i];
            byId[id] = { x: pt.x, y: pt.y };
        });
        ctx.save();
        ctx.lineCap = 'round';
        passNetworkData.links.forEach(link => {
            const a = byId[link.from], b = byId[link.to];
            if (!a || !b) return;
            ctx.strokeStyle = 'rgba(25,195,125,.45)';
            ctx.lineWidth = 1 + Math.min(6, link.count / 6);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        });
        ctx.restore();
    }
};

// Init pass network chart
function initPassNetworkChart() {
    const el = document.getElementById('passNetworkChart');
    if (!el) return;
    const dataPoints = passNetworkData.players.map(p => ({
        x: p.x, y: p.y, r: nodeRadius(p.touches),
        name: p.name, touches: p.touches, influence: p.influence
    }));
    const ids = passNetworkData.players.map(p => p.id);
    new Chart(el, {
        type: 'scatter',
        data: {
            datasets: [{
                data: dataPoints,
                ids,
                pointRadius: ctx => ctx.raw.r,
                pointHoverRadius: ctx => ctx.raw.r + 2,
                pointBackgroundColor: ctx => influenceColor(ctx.raw.influence),
                pointBorderColor: 'rgba(255,255,255,.25)',
                pointBorderWidth: 1.5
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#09202b',
                    titleColor: brand.text,
                    bodyColor: brand.text,
                    callbacks: {
                        title: items => items[0].raw.name,
                        label: ctx => [`Touches: ${ctx.raw.touches}`, `Influence: ${ctx.raw.influence}`]
                    }
                }
            },
            scales: {
                x: { min: 0, max: 100, ticks: { display: false }, grid: { color: brand.grid } },
                y: { min: 0, max: 100, reverse: true, ticks: { display: false }, grid: { color: brand.grid } }
            }
        },
        plugins: [passPitchPlugin, passLinksPlugin]
    });
}

// ---------- Shot Map Data ----------
const shotEvents = [
    { x: 8, y: 34, xg: 0.35, result: 'Goal', minute: 12 },
    { x: 13, y: 44, xg: 0.18, result: 'Saved', minute: 23 },
    { x: 17, y: 27, xg: 0.11, result: 'Blocked', minute: 37 },
    { x: 10, y: 18, xg: 0.42, result: 'Off Target', minute: 41 },
    { x: 6, y: 50, xg: 0.55, result: 'Goal', minute: 64 },
    { x: 20, y: 30, xg: 0.07, result: 'Saved', minute: 72 },
    { x: 15, y: 38, xg: 0.22, result: 'Blocked', minute: 77 },
    { x: 11, y: 60, xg: 0.09, result: 'Off Target', minute: 83 }
];

// Group shots for colouring
function splitShots(events) {
    const buckets = {
        Goal: { color: brand.accent, data: [] },
        Saved: { color: brand.warn, data: [] },
        Blocked: { color: brand.warn, data: [] },
        'Off Target': { color: brand.danger, data: [] }
    };
    events.forEach(s => {
        const key = (s.result === 'Saved' || s.result === 'Blocked') ? s.result : s.result;
        buckets[key].data.push(s);
    });
    return buckets;
}

// Draw half‑pitch background
const halfPitchPlugin = {
    id: 'halfPitch',
    beforeDatasetsDraw(chart) {
        const { ctx, chartArea: { left, top, width, height } } = chart;
        ctx.save();
        ctx.fillStyle = 'rgba(6,32,41,.45)';
        ctx.fillRect(left, top, width, height);
        ctx.strokeStyle = brand.grid;
        ctx.lineWidth = 1;

        const boxDepth = width * (16.5 / 52.5);
        const sixYard = width * (5.5 / 52.5);
        const goalW = height * (7.32 / 68);

        // Penalty box
        ctx.strokeRect(left, top + height * ((68 - 40.3) / 68), boxDepth, height * (40.3 / 68));
        // Six‑yard box
        ctx.strokeRect(left, top + height * ((68 - 18.32) / 68), sixYard, height * (18.32 / 68));

        // Penalty spot
        const penX = left + width * (11 / 52.5);
        const penY = top + height / 2;
        ctx.beginPath();
        ctx.arc(penX, penY, 2, 0, Math.PI * 2);
        ctx.stroke();

        // Goal line
        ctx.beginPath();
        ctx.moveTo(left, top + (height - goalW) / 2);
        ctx.lineTo(left, top + (height + goalW) / 2);
        ctx.stroke();

        // D arc
        ctx.beginPath();
        const arcR = height * (9.15 / 68);
        ctx.arc(penX, penY, arcR, -Math.PI / 4, Math.PI / 4);
        ctx.stroke();

        ctx.restore();
    }
};

// Init shot map chart
function initShotMapChart() {
    const el = document.getElementById('shotMapChart');
    if (!el) return;
    const buckets = splitShots(shotEvents);
    const datasets = Object.entries(buckets).map(([label, b]) => ({
        label,
        data: b.data,
        parsing: false,
        showLine: false,
        pointBackgroundColor: b.color,
        borderColor: 'rgba(255,255,255,.3)',
        pointBorderWidth: 1,
        pointRadius: ctx => 4 + Math.round((ctx.raw.xg || 0) * 20),
        pointHoverRadius: ctx => 6 + Math.round((ctx.raw.xg || 0) * 20)
    }));

    new Chart(el, {
        type: 'scatter',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#09202b',
                    titleColor: brand.text,
                    bodyColor: brand.text,
                    callbacks: {
                        title: items => {
                            const s = items[0].raw;
                            return `${s.result} — ${s.xg.toFixed(2)} xG`;
                        },
                        label: ctx => [`Minute: ${ctx.raw.minute}`, `Loc: ${ctx.raw.x}, ${ctx.raw.y}`]
                    }
                }
            },
            scales: {
                x: { min: 0, max: 52.5, ticks: { display: false }, grid: { color: brand.grid } },
                y: { min: 0, max: 68, ticks: { display: false }, grid: { color: brand.grid } }
            }
        },
        plugins: [halfPitchPlugin]
    });
}

// ---------- Initialise both charts ----------
document.addEventListener('DOMContentLoaded', () => {
    initPassNetworkChart();
    initShotMapChart();
});
