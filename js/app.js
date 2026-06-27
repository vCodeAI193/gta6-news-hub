// ===========================================================================
// GTA 6 News Hub — application logic (ADR-001/002)
// Vanilla ES modules, DOM-driven, localStorage persistence.
// ===========================================================================
import { getArticles, CHANNELS, TIMELINE, FAQ, POLLS, CHARACTERS } from './data.js';

// --- Constants (ADR-006) ---------------------------------------------------
const RELEASE_DATE = new Date('2026-11-19T00:00:00');
const ANNOUNCE_DATE = new Date('2023-12-04T00:00:00');
const PAGE_SIZE = 6;

// --- Store: the single persistence boundary (ADR-001) ----------------------
const Store = {
  get(key, fallback) {
    try { const v = localStorage.getItem('gta6_' + key); return v == null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  },
  set(key, val) {
    try { localStorage.setItem('gta6_' + key, JSON.stringify(val)); } catch {}
  },
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// --- App state -------------------------------------------------------------
const state = {
  articles: getArticles(),
  query: Store.get('lastQuery', ''),
  categories: new Set(Store.get('lastCategories', [])),
  sort: Store.get('lastSort', 'newest'),
  verifiedOnly: Store.get('verifiedOnly', false),
  mode: 'latest',
  visible: PAGE_SIZE,
  saved: new Set(Store.get('saved', [])),
  read: new Set(Store.get('read', [])),
  likes: Store.get('likes', {}),       // id -> bonus likes by this user (0/1)
  recent: Store.get('recent', []),
};

// ===========================================================================
// Utilities
// ===========================================================================
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d <= 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 30) return `${d} days ago`;
  const mo = Math.floor(d / 30);
  return mo === 1 ? 'a month ago' : `${mo} months ago`;
}
function readingTime(body) {
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function highlight(text, q) {
  if (!q) return escapeHtml(text);
  const safe = escapeHtml(text);
  try {
    const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
    return safe.replace(re, '<mark>$1</mark>');
  } catch { return safe; }
}
function totalLikes(a) { return a.likes + (state.likes[a.id] ? 1 : 0); }

let toastTimer;
function toast(msg) {
  const stack = $('#toastStack');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  stack.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(120%)'; }, 2600);
  setTimeout(() => el.remove(), 3000);
}

// ===========================================================================
// Feed rendering (features 21-44)
// ===========================================================================
function getFilteredArticles() {
  let list = state.articles.slice();
  if (state.mode === 'official') list = list.filter((a) => a.category === 'Official' || a.verified);
  if (state.verifiedOnly) list = list.filter((a) => a.verified);
  if (state.categories.size) list = list.filter((a) => state.categories.has(a.category));
  if (state.query) {
    const q = state.query.toLowerCase();
    list = list.filter((a) =>
      a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q) || a.body.toLowerCase().includes(q));
  }
  if (state.mode === 'trending' || state.sort === 'popular') list.sort((a, b) => totalLikes(b) - totalLikes(a));
  else if (state.sort === 'oldest') list.sort((a, b) => new Date(a.date) - new Date(b.date));
  else list.sort((a, b) => new Date(b.date) - new Date(a.date));
  return list;
}

function articleCard(a) {
  const saved = state.saved.has(a.id);
  const read = state.read.has(a.id);
  const card = document.createElement('article');
  card.className = 'card article-card' + (read ? ' is-read' : '');
  card.dataset.id = a.id;
  card.innerHTML = `
    <div class="card-media ${a.image}" role="img" aria-label="${escapeHtml(a.title)}">
      <span class="tag">${a.category}</span>
      <span class="badge-verify ${a.verified ? 'verified' : 'rumor'}">${a.verified ? '✓ Verified' : '⚠ Rumor'}</span>
    </div>
    <div class="card-body">
      <h3>${highlight(a.title, state.query)}</h3>
      <p class="card-excerpt">${highlight(a.excerpt, state.query)}</p>
      <div class="card-meta">
        <span>${escapeHtml(channelName(a.source))}</span>·
        <span>${timeAgo(a.date)}</span>·
        <span>${readingTime(a.body)} min</span>·
        <span>${a.lang}/${a.region}</span>
      </div>
      <div class="card-actions">
        <button class="act-like ${state.likes[a.id] ? 'is-active' : ''}" data-act="like" aria-label="Like">♥ <span>${totalLikes(a)}</span></button>
        <button class="act-save ${saved ? 'is-active' : ''}" data-act="save" aria-label="Save">${saved ? '🔖' : '🏷'}</button>
        <button class="act-share" data-act="share" aria-label="Share">↗</button>
      </div>
    </div>`;
  return card;
}

function channelName(id) {
  const c = CHANNELS.find((x) => x.id === id);
  return c ? c.name : id;
}

function renderFeed() {
  const grid = $('#feedGrid');
  const list = getFilteredArticles();
  grid.innerHTML = '';
  const slice = list.slice(0, state.visible);
  slice.forEach((a) => grid.appendChild(articleCard(a)));

  $('#feedEmpty').hidden = list.length !== 0;
  $('#loadMore').style.display = state.visible < list.length ? '' : 'none';

  // persist filter state (feature 42)
  Store.set('lastQuery', state.query);
  Store.set('lastCategories', [...state.categories]);
  Store.set('lastSort', state.sort);
  Store.set('verifiedOnly', state.verifiedOnly);
}

// ===========================================================================
// Filters & search UI
// ===========================================================================
function buildCategoryChips() {
  const cats = [...new Set(state.articles.map((a) => a.category))].sort();
  const wrap = $('#categoryChips');
  wrap.innerHTML = '';
  cats.forEach((cat) => {
    const b = document.createElement('button');
    b.className = 'chip' + (state.categories.has(cat) ? ' is-active' : '');
    b.textContent = cat;
    b.setAttribute('aria-pressed', state.categories.has(cat));
    b.addEventListener('click', () => {
      state.categories.has(cat) ? state.categories.delete(cat) : state.categories.add(cat);
      b.classList.toggle('is-active');
      b.setAttribute('aria-pressed', state.categories.has(cat));
      state.visible = PAGE_SIZE;
      renderFeed();
    });
    wrap.appendChild(b);
  });
}

let searchDebounce;
function initSearch() {
  const input = $('#searchInput');
  input.value = state.query;
  input.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      state.query = input.value.trim();
      state.visible = PAGE_SIZE;
      renderFeed();
    }, 220); // debounce (feature 41)
  });

  $('#sortSelect').value = state.sort;
  $('#sortSelect').addEventListener('change', (e) => { state.sort = e.target.value; renderFeed(); });

  $('#verifiedOnly').checked = state.verifiedOnly;
  $('#verifiedOnly').addEventListener('change', (e) => { state.verifiedOnly = e.target.checked; state.visible = PAGE_SIZE; renderFeed(); });

  $('#clearFilters').addEventListener('click', clearFilters);
  $('#emptyReset').addEventListener('click', clearFilters);

  $('#searchToggle').addEventListener('click', () => {
    const p = $('#searchPanel');
    p.hidden = !p.hidden;
    if (!p.hidden) input.focus();
  });
}
function clearFilters() {
  state.query = ''; state.categories.clear(); state.verifiedOnly = false; state.sort = 'newest'; state.visible = PAGE_SIZE;
  $('#searchInput').value = ''; $('#sortSelect').value = 'newest'; $('#verifiedOnly').checked = false;
  buildCategoryChips(); renderFeed(); toast('Filters cleared');
}

function initFeedModes() {
  $$('[data-mode]').forEach((btn) => btn.addEventListener('click', () => {
    $$('[data-mode]').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    state.mode = btn.dataset.mode; state.visible = PAGE_SIZE; renderFeed();
  }));
  $('#loadMore').addEventListener('click', () => { state.visible += PAGE_SIZE; renderFeed(); }); // feature 30
  $('#refreshFeed').addEventListener('click', () => { renderFeed(); toast('Feed up to date ✓'); }); // feature 34
}

// Card action delegation (like/save/share/open)
function initFeedActions() {
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.article-card');
    if (!card) return;
    const id = card.dataset.id;
    const actBtn = e.target.closest('[data-act]');
    if (actBtn) {
      e.stopPropagation();
      const act = actBtn.dataset.act;
      if (act === 'like') toggleLike(id);
      if (act === 'save') toggleSave(id);
      if (act === 'share') shareArticle(id);
      return;
    }
    openArticle(id);
  });
}

function toggleLike(id) {
  state.likes[id] = state.likes[id] ? 0 : 1;
  Store.set('likes', state.likes);
  renderFeed();
}
function toggleSave(id) {
  state.saved.has(id) ? state.saved.delete(id) : state.saved.add(id);
  Store.set('saved', [...state.saved]);
  updateSavedCount();
  renderFeed(); renderSaved();
  toast(state.saved.has(id) ? 'Saved 🔖' : 'Removed from saved');
}
function updateSavedCount() {
  const badge = $('#savedCount');
  badge.textContent = state.saved.size;
  badge.hidden = state.saved.size === 0;
}

async function shareArticle(id) {
  const a = state.articles.find((x) => x.id === id);
  const url = location.origin + location.pathname + '#article-' + id;
  const data = { title: a.title, text: a.excerpt, url };
  if (navigator.share) { try { await navigator.share(data); return; } catch {} } // feature 53
  try { await navigator.clipboard.writeText(url); toast('Link copied to clipboard'); }
  catch { toast('Share: ' + url); }
}

// ===========================================================================
// Saved view (feature 46)
// ===========================================================================
function renderSaved() {
  const grid = $('#savedGrid');
  const empty = $('#savedEmpty');
  grid.innerHTML = '';
  const items = state.articles.filter((a) => state.saved.has(a.id));
  items.forEach((a) => grid.appendChild(articleCard(a)));
  empty.style.display = items.length ? 'none' : '';
}

// ===========================================================================
// Article modal (features 23, 31, 47-56)
// ===========================================================================
function openArticle(id) {
  const a = state.articles.find((x) => x.id === id);
  if (!a) return;

  // mark read + recent (features 55, 56)
  state.read.add(id); Store.set('read', [...state.read]);
  state.recent = [id, ...state.recent.filter((x) => x !== id)].slice(0, 8);
  Store.set('recent', state.recent);

  const comments = Store.get('comments_' + id, []);
  const reactions = Store.get('reactions_' + id, {});
  const userReact = Store.get('userReact_' + id, null);
  const related = state.articles
    .filter((x) => x.id !== id && (x.category === a.category || x.source === a.source))
    .slice(0, 3);

  $('#modalBody').innerHTML = `
    <span class="tag">${a.category}</span>
    <h1 id="modalTitle">${escapeHtml(a.title)}</h1>
    <div class="modal-meta">
      <span class="badge-verify ${a.verified ? 'verified' : 'rumor'}">${a.verified ? '✓ Verified' : '⚠ Rumor'}</span>
      <span>By ${escapeHtml(a.author)}</span>·
      <span>${timeAgo(a.date)}</span>·
      <span>${readingTime(a.body)} min read</span>·
      <a href="${a.sourceUrl}" target="_blank" rel="noopener">Source: ${escapeHtml(channelName(a.source))} ↗</a>
    </div>
    <div class="modal-hero ${a.image}"></div>
    ${a.body.split('\n\n').map((p) => `<p>${escapeHtml(p)}</p>`).join('')}

    <div class="reactions" aria-label="Reactions">
      ${['🔥', '😮', '😂', '😢', '👍'].map((emo) => `
        <button class="reaction ${userReact === emo ? 'is-active' : ''}" data-emo="${emo}">${emo} <span>${reactions[emo] || 0}</span></button>`).join('')}
    </div>

    <div class="share-row">
      <button class="btn btn-small" data-share="copy">🔗 Copy link</button>
      <a class="btn btn-small" data-share="x" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(a.title)}&url=${encodeURIComponent(location.href)}">𝕏 Share</a>
      <a class="btn btn-small" data-share="reddit" target="_blank" rel="noopener" href="https://www.reddit.com/submit?title=${encodeURIComponent(a.title)}&url=${encodeURIComponent(location.href)}">Reddit</a>
      <a class="btn btn-small" data-share="wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(a.title + ' ' + location.href)}">WhatsApp</a>
      <button class="btn btn-small ${state.saved.has(id) ? 'btn-primary' : 'btn-ghost'}" data-share="save">${state.saved.has(id) ? '🔖 Saved' : '🏷 Save'}</button>
    </div>

    <div class="comments">
      <h3>Comments (<span id="commentCount">${comments.length}</span>)</h3>
      <form class="comment-form" id="commentForm">
        <input type="text" id="commentName" placeholder="Your name" value="${escapeHtml(Store.get('commenterName', ''))}" aria-label="Your name" />
        <textarea id="commentText" placeholder="Add a comment…" rows="3" aria-label="Comment"></textarea>
        <button class="btn btn-primary btn-small" type="submit">Post comment</button>
      </form>
      <div id="commentList">${comments.map(renderComment).join('') || '<p class="muted">Be the first to comment.</p>'}</div>
    </div>

    ${related.length ? `<div class="related"><h3>Related</h3><div class="related-list">${related.map((r) => `
      <div class="related-item" data-related="${r.id}">
        <div class="ri-thumb ${r.image}"></div><span>${escapeHtml(r.title)}</span>
      </div>`).join('')}</div></div>` : ''}
  `;

  // wire reactions
  $$('#modalBody .reaction').forEach((btn) => btn.addEventListener('click', () => {
    const emo = btn.dataset.emo;
    const r = Store.get('reactions_' + id, {});
    const prev = Store.get('userReact_' + id, null);
    if (prev === emo) { r[emo] = Math.max(0, (r[emo] || 1) - 1); Store.set('userReact_' + id, null); }
    else {
      if (prev) r[prev] = Math.max(0, (r[prev] || 1) - 1);
      r[emo] = (r[emo] || 0) + 1; Store.set('userReact_' + id, emo);
    }
    Store.set('reactions_' + id, r);
    openArticle(id);
  }));

  // wire share row
  $$('#modalBody [data-share]').forEach((btn) => btn.addEventListener('click', () => {
    const t = btn.dataset.share;
    if (t === 'copy') shareArticle(id);
    if (t === 'save') { toggleSave(id); openArticle(id); }
  }));

  // wire comments (features 48-50)
  $('#commentForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#commentName').value.trim() || 'Anonymous';
    const text = $('#commentText').value.trim();
    if (!text) return;
    Store.set('commenterName', name);
    const list = Store.get('comments_' + id, []);
    list.unshift({ name, text, time: new Date().toISOString() });
    Store.set('comments_' + id, list);
    openArticle(id);
    toast('Comment posted');
  });

  // related navigation
  $$('#modalBody [data-related]').forEach((el) => el.addEventListener('click', () => openArticle(el.dataset.related)));

  showModal('#modalBackdrop');
  $('#modalBody').parentElement.scrollTop = 0;
  // article modal reading progress (feature 54)
  const modal = $('#articleModal');
  modal.onscroll = () => {
    const p = modal.scrollTop / (modal.scrollHeight - modal.clientHeight || 1);
    $('#modalProgress').style.width = Math.min(100, p * 100) + '%';
  };
}

function renderComment(c) {
  return `<div class="comment"><span class="c-author">${escapeHtml(c.name)}</span>
    <span class="c-time">· ${timeAgo(c.time)}</span><p>${escapeHtml(c.text)}</p></div>`;
}

// ===========================================================================
// Modal helpers + focus trap (feature 95)
// ===========================================================================
let lastFocused = null;
function showModal(sel) {
  lastFocused = document.activeElement;
  const bd = $(sel); bd.hidden = false;
  document.body.style.overflow = 'hidden';
  const focusable = $(sel + ' button, ' + sel + ' a, ' + sel + ' input, ' + sel + ' textarea');
  if (focusable) focusable.focus();
}
function hideModal(sel) {
  $(sel).hidden = true;
  document.body.style.overflow = '';
  if (lastFocused) lastFocused.focus();
}
function initModals() {
  $('#modalClose').addEventListener('click', () => hideModal('#modalBackdrop'));
  $('#prefsClose').addEventListener('click', () => hideModal('#prefsBackdrop'));
  $$('.modal-backdrop').forEach((bd) => bd.addEventListener('click', (e) => { if (e.target === bd) hideModal('#' + bd.id); }));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { $$('.modal-backdrop').forEach((bd) => { if (!bd.hidden) hideModal('#' + bd.id); }); closeLightbox(); }
  });
}

// ===========================================================================
// Channels hub (ADR-007)
// ===========================================================================
let channelTypeFilter = 'All';
function renderChannels() {
  const types = ['All', ...new Set(CHANNELS.map((c) => c.type))];
  const fwrap = $('#channelFilter');
  fwrap.innerHTML = '';
  types.forEach((t) => {
    const b = document.createElement('button');
    b.className = 'chip' + (t === channelTypeFilter ? ' is-active' : '');
    b.textContent = t;
    b.addEventListener('click', () => { channelTypeFilter = t; renderChannels(); });
    fwrap.appendChild(b);
  });

  const grid = $('#channelGrid');
  grid.innerHTML = '';
  CHANNELS.filter((c) => channelTypeFilter === 'All' || c.type === channelTypeFilter).forEach((c) => {
    const el = document.createElement('div');
    el.className = 'card channel-card';
    el.innerHTML = `
      <h3>${escapeHtml(c.name)}</h3>
      <div class="channel-meta">
        <span class="pill">${c.type}</span><span class="pill">${c.region}</span><span class="pill">${c.lang}</span>
      </div>
      <p>${escapeHtml(c.desc)}</p>
      <a class="btn btn-small btn-ghost" href="${c.url}" target="_blank" rel="noopener">Visit channel ↗</a>`;
    grid.appendChild(el);
  });
}

// ===========================================================================
// Media gallery + lightbox (features 64-70)
// ===========================================================================
const MEDIA = [
  { type: 'trailer', label: 'Official Trailer 2', image: 'gradient-2' },
  { type: 'trailer', label: 'Official Trailer 1', image: 'gradient-1' },
  { type: 'screenshot', label: 'Vice City skyline', image: 'gradient-8' },
  { type: 'screenshot', label: 'Beachfront', image: 'gradient-3' },
  { type: 'art', label: 'Lucia — key art', image: 'gradient-5' },
  { type: 'art', label: 'Leonida — concept', image: 'gradient-7' },
  { type: 'screenshot', label: 'Downtown night', image: 'gradient-11' },
  { type: 'art', label: 'Map tease', image: 'gradient-9' },
];
let mediaFilter = 'all';
function renderMedia() {
  const grid = $('#mediaGrid');
  grid.innerHTML = '';
  MEDIA.filter((m) => mediaFilter === 'all' || m.type === mediaFilter).forEach((m, i) => {
    const el = document.createElement('div');
    el.className = 'media-item ' + m.image;
    el.innerHTML = `${m.type === 'trailer' ? '<span class="play">▶</span>' : ''}<span class="media-label">${escapeHtml(m.label)}</span>`;
    el.addEventListener('click', () => openLightbox(i));
    grid.appendChild(el);
  });
  $$('[data-media]').forEach((b) => b.classList.toggle('is-active', b.dataset.media === mediaFilter));
}
function initMedia() {
  $$('[data-media]').forEach((b) => b.addEventListener('click', () => { mediaFilter = b.dataset.media; renderMedia(); }));
}

// Lightbox (features 65-67)
let lightboxIndex = -1;
function openLightbox(i) {
  const visible = MEDIA.filter((m) => mediaFilter === 'all' || m.type === mediaFilter);
  lightboxIndex = i;
  let lb = $('#lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.className = 'modal-backdrop';
    lb.innerHTML = `<div style="max-width:900px;width:100%;text-align:center">
      <div id="lbImg" style="aspect-ratio:16/9;border-radius:16px"></div>
      <p id="lbLabel" style="color:#fff;margin-top:1rem;font-weight:600"></p>
      <div style="margin-top:.5rem;display:flex;gap:.5rem;justify-content:center">
        <button class="btn btn-small" id="lbPrev">← Prev</button>
        <a class="btn btn-small" id="lbDownload" download="gta6-wallpaper.svg">⬇ Download</a>
        <button class="btn btn-small" id="lbNext">Next →</button>
        <button class="btn btn-small btn-ghost" id="lbClose">Close ✕</button>
      </div></div>`;
    document.body.appendChild(lb);
    lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
    $('#lbPrev').addEventListener('click', () => moveLightbox(-1));
    $('#lbNext').addEventListener('click', () => moveLightbox(1));
    $('#lbClose').addEventListener('click', closeLightbox);
    document.addEventListener('keydown', lightboxKeys);
  }
  const item = visible[i] || MEDIA[i];
  $('#lbImg').className = item.image;
  $('#lbLabel').textContent = item.label;
  // generate a downloadable SVG wallpaper (feature 67)
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%23ff2e88'/><stop offset='1' stop-color='%2322d3ee'/></linearGradient></defs><rect width='1920' height='1080' fill='url(%23g)'/><text x='960' y='560' font-size='180' font-family='Arial' font-weight='bold' fill='white' text-anchor='middle'>GTA VI</text></svg>`;
  $('#lbDownload').href = 'data:image/svg+xml,' + svg;
  lb.hidden = false;
  document.body.style.overflow = 'hidden';
}
function moveLightbox(dir) {
  const visible = MEDIA.filter((m) => mediaFilter === 'all' || m.type === mediaFilter);
  lightboxIndex = (lightboxIndex + dir + visible.length) % visible.length;
  openLightbox(lightboxIndex);
}
function lightboxKeys(e) {
  if (!$('#lightbox') || $('#lightbox').hidden) return;
  if (e.key === 'ArrowLeft') moveLightbox(-1);
  if (e.key === 'ArrowRight') moveLightbox(1);
}
function closeLightbox() {
  const lb = $('#lightbox');
  if (lb && !lb.hidden) { lb.hidden = true; document.body.style.overflow = ''; }
}

// Characters (feature 69)
function renderCharacters() {
  const grid = $('#characterGrid');
  grid.innerHTML = '';
  CHARACTERS.forEach((c) => {
    const el = document.createElement('div');
    el.className = 'card character-card';
    el.innerHTML = `<div class="card-media ${c.image}"></div>
      <div class="cc-body"><span class="role">${c.role}</span><h4>${escapeHtml(c.name)}</h4><p>${escapeHtml(c.desc)}</p></div>`;
    grid.appendChild(el);
  });
}

// ===========================================================================
// Timeline (feature 59)
// ===========================================================================
function renderTimeline() {
  const list = $('#timelineList');
  list.innerHTML = '';
  TIMELINE.forEach((t) => {
    const done = new Date(t.date) < new Date();
    const li = document.createElement('li');
    if (done) li.className = 'is-done';
    li.innerHTML = `<span class="t-date">${new Date(t.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
      <h3>${escapeHtml(t.title)}</h3><p>${escapeHtml(t.desc)}</p>`;
    list.appendChild(li);
  });
}

// ===========================================================================
// Countdown (features 57-60, 63)
// ===========================================================================
function tickCountdown() {
  const now = Date.now();
  let diff = Math.max(0, RELEASE_DATE.getTime() - now);
  const d = Math.floor(diff / 86400000); diff -= d * 86400000;
  const h = Math.floor(diff / 3600000); diff -= h * 3600000;
  const m = Math.floor(diff / 60000); diff -= m * 60000;
  const s = Math.floor(diff / 1000);
  $('#cdDays').textContent = d;
  $('#cdHours').textContent = String(h).padStart(2, '0');
  $('#cdMins').textContent = String(m).padStart(2, '0');
  $('#cdSecs').textContent = String(s).padStart(2, '0');
  const since = Math.floor((now - ANNOUNCE_DATE.getTime()) / 86400000);
  $('#countdownSince').textContent = `${since} days since the first reveal (Dec 4, 2023).`;
}
function initCountdownActions() {
  // Add to calendar — .ics download (feature 60)
  $('#addToCalendar').addEventListener('click', () => {
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GTA6 News Hub//EN', 'BEGIN:VEVENT',
      'UID:gta6-release@newshub', 'DTSTART;VALUE=DATE:20261119', 'DTEND;VALUE=DATE:20261120',
      'SUMMARY:GTA 6 Release Day', 'DESCRIPTION:Grand Theft Auto VI launches on PS5 and Xbox Series X|S.',
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'gta6-release.ics'; a.click();
    URL.revokeObjectURL(a.href);
    toast('Calendar event downloaded 📅');
  });
  // Browser notification opt-in (feature 86)
  $('#notifyToggle').addEventListener('click', async () => {
    if (!('Notification' in window)) { toast('Notifications not supported'); return; }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') { Store.set('notify', true); toast('Reminders on 🔔'); new Notification('GTA 6 News Hub', { body: "We'll remind you about big drops!" }); }
    else toast('Notifications blocked');
  });
}

// ===========================================================================
// Community: polls, newsletter, tips, FAQ
// ===========================================================================
function renderPolls() {
  const wrap = $('#pollsContainer');
  wrap.innerHTML = '';
  POLLS.forEach((poll) => {
    const votes = Store.get('poll_' + poll.id, poll.options.map(() => 0));
    const myVote = Store.get('pollVote_' + poll.id, null);
    const total = votes.reduce((a, b) => a + b, 0) || 1;
    const div = document.createElement('div');
    div.className = 'poll';
    div.innerHTML = `<p class="poll-q">${escapeHtml(poll.q)}</p>` + poll.options.map((opt, i) => {
      const pct = Math.round((votes[i] / total) * 100);
      return `<div class="poll-option ${myVote === i ? 'voted' : ''}" data-poll="${poll.id}" data-opt="${i}" role="button" tabindex="0">
        <div class="po-bar"><div class="po-fill" style="width:${myVote != null ? pct : 0}%"></div>
        <span class="po-label"><span>${escapeHtml(opt)}</span><span>${myVote != null ? pct + '%' : ''}</span></span></div></div>`;
    }).join('');
    wrap.appendChild(div);
  });
  $$('[data-poll]').forEach((el) => {
    const vote = () => {
      const pid = el.dataset.poll, opt = +el.dataset.opt;
      if (Store.get('pollVote_' + pid, null) != null) { toast('You already voted'); return; }
      const votes = Store.get('poll_' + pid, POLLS.find((p) => p.id === pid).options.map(() => 0));
      votes[opt]++; Store.set('poll_' + pid, votes); Store.set('pollVote_' + pid, opt);
      renderPolls(); toast('Vote counted ✓');
    };
    el.addEventListener('click', vote);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); vote(); } });
  });
}

function initNewsletter() {
  const form = $('#newsletterForm'), msg = $('#newsletterMsg');
  if (Store.get('subscribed', false)) { msg.textContent = "You're subscribed ✓"; msg.className = 'form-msg ok'; }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#newsletterEmail').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.textContent = 'Please enter a valid email.'; msg.className = 'form-msg err'; return; }
    Store.set('subscribed', true); Store.set('subscriberEmail', email);
    msg.textContent = 'Thanks! You are subscribed ✓'; msg.className = 'form-msg ok';
    form.reset(); toast('Subscribed to the newsletter 📨');
  });
}
function initTipForm() {
  const form = $('#tipForm'), msg = $('#tipMsg');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = $('#tipUrl').value.trim();
    if (!/^https?:\/\/.+/.test(url)) { msg.textContent = 'Enter a valid URL.'; msg.className = 'form-msg err'; return; }
    const tips = Store.get('tips', []);
    tips.unshift({ url, note: $('#tipNote').value.trim(), time: new Date().toISOString() });
    Store.set('tips', tips);
    msg.textContent = 'Thanks for the tip! 💡'; msg.className = 'form-msg ok';
    form.reset(); toast('Tip submitted — thank you!');
  });
}
function renderFAQ() {
  const wrap = $('#faqList');
  wrap.innerHTML = '';
  FAQ.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'faq-item';
    div.innerHTML = `<button class="faq-q" aria-expanded="false" aria-controls="faq-a-${i}">
      <span>${escapeHtml(item.q)}</span><span class="chev">▾</span></button>
      <div class="faq-a" id="faq-a-${i}"><p>${escapeHtml(item.a)}</p></div>`;
    const btn = $('.faq-q', div);
    btn.addEventListener('click', () => {
      const open = div.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
    });
    wrap.appendChild(div);
  });
}

// ===========================================================================
// Preferences (features 11-20)
// ===========================================================================
function applyPrefs() {
  const html = document.documentElement;
  html.dataset.theme = Store.get('theme', prefersDark() ? 'dark' : 'light');
  html.dataset.accent = Store.get('accent', 'pink');
  html.dataset.font = Store.get('font', 'normal');
  html.dataset.density = Store.get('density', 'comfortable');
  syncPrefUI();
  $('#themeToggle').textContent = html.dataset.theme === 'dark' ? '🌙' : '☀️';
}
function prefersDark() {
  return !window.matchMedia || window.matchMedia('(prefers-color-scheme: dark)').matches;
}
function syncPrefUI() {
  const html = document.documentElement;
  $$('#themeSeg button').forEach((b) => b.classList.toggle('is-active', b.dataset.themeVal === html.dataset.theme));
  $$('#accentPicker button').forEach((b) => b.classList.toggle('is-active', b.dataset.accentVal === html.dataset.accent));
  $$('#fontSeg button').forEach((b) => b.classList.toggle('is-active', b.dataset.fontVal === html.dataset.font));
  $$('#densitySeg button').forEach((b) => b.classList.toggle('is-active', b.dataset.densityVal === html.dataset.density));
}
function initPrefs() {
  $('#prefsToggle').addEventListener('click', () => showModal('#prefsBackdrop'));
  $('#themeToggle').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));

  $$('#themeSeg button').forEach((b) => b.addEventListener('click', () => setTheme(b.dataset.themeVal)));
  $$('#accentPicker button').forEach((b) => b.addEventListener('click', () => {
    document.documentElement.dataset.accent = b.dataset.accentVal; Store.set('accent', b.dataset.accentVal); syncPrefUI();
  }));
  $$('#fontSeg button').forEach((b) => b.addEventListener('click', () => {
    document.documentElement.dataset.font = b.dataset.fontVal; Store.set('font', b.dataset.fontVal); syncPrefUI();
  }));
  $$('#densitySeg button').forEach((b) => b.addEventListener('click', () => {
    document.documentElement.dataset.density = b.dataset.densityVal; Store.set('density', b.dataset.densityVal); syncPrefUI();
  }));
  $('#resetPrefs').addEventListener('click', () => {
    ['theme', 'accent', 'font', 'density'].forEach((k) => localStorage.removeItem('gta6_' + k));
    applyPrefs(); toast('Preferences reset');
  });
}
function setTheme(t) {
  document.documentElement.dataset.theme = t; Store.set('theme', t);
  $('#themeToggle').textContent = t === 'dark' ? '🌙' : '☀️';
  syncPrefUI();
}

// ===========================================================================
// Header behaviour, scroll spy, back-to-top, drawer (features 2,5,8,89)
// ===========================================================================
function initScroll() {
  const header = $('#siteHeader');
  const progress = $('#readingProgress');
  const backTop = $('#backToTop');
  const ring = $('#ringProgress');
  const ringLen = 100.5;
  const sections = $$('main section[id]');
  const navLinks = $$('.main-nav a[data-nav]');

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('condensed', y > 20);
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const p = docH > 0 ? y / docH : 0;
    progress.style.width = (p * 100) + '%';
    backTop.hidden = y < 400;
    ring.style.strokeDashoffset = ringLen - p * ringLen;

    // scroll spy (feature 8)
    let current = '';
    sections.forEach((s) => { if (s.getBoundingClientRect().top <= 120) current = s.id; });
    navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + current));
    if (current) Store.set('lastSection', current); // feature 19
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initDrawer() {
  const drawer = $('#drawer'), backdrop = $('#drawerBackdrop'), toggle = $('#menuToggle');
  const open = () => { drawer.classList.add('open'); backdrop.hidden = false; drawer.setAttribute('aria-hidden', 'false'); toggle.setAttribute('aria-expanded', 'true'); };
  const close = () => { drawer.classList.remove('open'); backdrop.hidden = true; drawer.setAttribute('aria-hidden', 'true'); toggle.setAttribute('aria-expanded', 'false'); };
  toggle.addEventListener('click', () => drawer.classList.contains('open') ? close() : open());
  backdrop.addEventListener('click', close);
  $$('.drawer-nav a').forEach((a) => a.addEventListener('click', close));

  $('#savedToggle').addEventListener('click', () => { location.hash = '#saved'; });
}

// ===========================================================================
// Consent, visit tracking, new-since badge (features 87, 88)
// ===========================================================================
function initConsent() {
  if (!Store.get('consent', false)) {
    const banner = $('#consentBanner'); banner.hidden = false;
    $('#consentAccept').addEventListener('click', () => { Store.set('consent', true); banner.hidden = true; });
  }
}
function initVisitTracking() {
  const last = Store.get('lastVisit', null);
  if (last) {
    const newCount = state.articles.filter((a) => new Date(a.date).getTime() > last).length;
    if (newCount > 0) {
      const el = $('#newSince');
      el.hidden = false;
      el.textContent = `✨ ${newCount} new article${newCount > 1 ? 's' : ''} since your last visit.`;
    }
  }
  Store.set('lastVisit', Date.now());
}

// ===========================================================================
// PWA service worker (features 79-84)
// ===========================================================================
function initPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e;
    if (!Store.get('installDismissed', false)) {
      toast('💾 Install this app from your browser menu');
    }
  });
}

// ===========================================================================
// Boot
// ===========================================================================
function init() {
  applyPrefs();
  buildCategoryChips();
  initSearch();
  initFeedModes();
  initFeedActions();
  renderFeed();
  renderSaved();
  updateSavedCount();
  renderChannels();
  renderMedia();
  initMedia();
  renderCharacters();
  renderTimeline();
  renderPolls();
  initNewsletter();
  initTipForm();
  renderFAQ();
  initModals();
  initPrefs();
  initScroll();
  initDrawer();
  initCountdownActions();
  initConsent();
  initVisitTracking();
  initPWA();

  tickCountdown();
  setInterval(tickCountdown, 1000);

  // open article from hash (feature 52 deep link)
  if (location.hash.startsWith('#article-')) {
    const id = location.hash.replace('#article-', '');
    setTimeout(() => openArticle(id), 300);
  }
}

document.addEventListener('DOMContentLoaded', init);
