// Helper: smooth scroll for internal links
document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href.length <= 1) return;
    const el = document.querySelector(href);
    if (!el) return;
    e.preventDefault();
    const y = el.getBoundingClientRect().top + window.pageYOffset - 72;
    window.scrollTo({ top: y, behavior: 'smooth' });

    // close navbar on mobile after click
    const navCollapse = document.querySelector('#mainNav');
    if (navCollapse?.classList.contains('show')) {
        const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
        bsCollapse?.hide();
    }
});

// Set footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Build search index
const index = [];
function buildIndex() {
    index.length = 0;
    document.querySelectorAll('.searchable').forEach((el) => {
        const title = (el.dataset.title || el.querySelector('.card-title')?.textContent || el.textContent || '').trim();
        const category = (el.dataset.category || '').trim();
        const tags = (el.dataset.tags || '').trim();
        const href = (el.dataset.href || '').trim();
        index.push({
            title,
            category,
            tags,
            href,
            element: el,
            text: (title + ' ' + category + ' ' + tags + ' ' + el.textContent).toLowerCase()
        });
    });
}
buildIndex();

// Search UI elements
const form = document.getElementById('navSearchForm');
const input = document.getElementById('searchInput');
const dropdown = document.getElementById('searchDropdown');

// Render results
function renderResults(results) {
    dropdown.innerHTML = '';
    if (!results.length) {
        dropdown.innerHTML = `
      <div class="p-3 text-secondary small">No matches. Try different keywords (e.g., "pressing", "Osimhen", "NPFL").</div>
    `;
        dropdown.classList.add('show');
        return;
    }
    const frag = document.createDocumentFragment();
    results.slice(0, 8).forEach((r) => {
        const a = document.createElement('a');
        a.href = r.href || '#';
        a.className = 'search-item dropdown-item';
        a.innerHTML = `
      <i class="bi bi-search text-success"></i>
      <div class="flex-grow-1">
        <div class="small fw-semibold">${r.title}</div>
        <div class="xsmall text-secondary">${r.tags || ''}</div>
      </div>
      <span class="badge rounded-pill ms-auto">${r.category || 'Content'}</span>
    `;
        a.addEventListener('click', (e) => {
            e.preventDefault();
            dropdown.classList.remove('show');
            // Scroll to target if we have an anchor
            if (r.href && r.href.startsWith('#')) {
                const el = document.querySelector(r.href);
                if (el) {
                    const y = el.getBoundingClientRect().top + window.pageYOffset - 72;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                    return;
                }
            }
            // Fallback: highlight element
            r.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            r.element.classList.add('ring');
            setTimeout(() => r.element.classList.remove('ring'), 1500);
        });
        frag.appendChild(a);
    });
    dropdown.appendChild(frag);
    dropdown.classList.add('show');
}

// Debounce
let t;
function debounce(fn, delay = 180) {
    clearTimeout(t);
    t = setTimeout(fn, delay);
}

// Input handler
input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
        dropdown.classList.remove('show');
        dropdown.innerHTML = '';
        return;
    }
    debounce(() => {
        const results = index.filter(i => i.text.includes(q));
        renderResults(results);
    });
});

// Submit handler
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim().toLowerCase();
    if (!q) {
        dropdown.classList.remove('show');
        return;
    }
    const results = index.filter(i => i.text.includes(q));
    renderResults(results);
});

// Hide dropdown on outside click or escape
document.addEventListener('click', (e) => {
    if (!form.contains(e.target)) dropdown.classList.remove('show');
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') dropdown.classList.remove('show');
    if (e.key === 'Enter' && dropdown.classList.contains('show')) {
        const first = dropdown.querySelector('.search-item');
        if (first) first.click();
    }
});

// Live scores pulse (mock)
const statuses = [
    { cls: 'bg-success-soft', label: "LIVE" },
    { cls: 'bg-warning-soft', label: "HT" },
    { cls: 'bg-danger-soft', label: "VAR" }
];
setInterval(() => {
    document.querySelectorAll('#liveScoresTable .badge').forEach((b, i) => {
        const s = statuses[(Date.now() / 2000 + i) % statuses.length | 0];
        b.className = `badge ${s.cls}`;
        // keep minute if present
        const minute = /\d+'/.test(b.textContent) ? b.textContent.match(/\d+'/)[0] : '';
        b.textContent = minute || s.label;
    });
}, 3500);

// Little highlight helper
const style = document.createElement('style');
style.textContent = `
  .ring{ box-shadow:0 0 0 4px rgba(25,195,125,.35)!important; transition: box-shadow .3s; }
`;
document.head.appendChild(style);