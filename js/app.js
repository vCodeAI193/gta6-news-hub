// ===========================================================================
// GTA 6 News Hub — application logic (ADR-001/002)
// Vanilla ES modules, DOM-driven, localStorage persistence.
// ===========================================================================
import { getArticles, CHANNELS, TIMELINE, FAQ, POLLS, CHARACTERS } from './data.js';
import { translateArticle, isTranslationEnabled, getEndpoint, setEndpoint, testEndpoint, toISO } from './translate.js';

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

// ===========================================================================
// i18n (ADR-009) — UI language switch DE/EN
// ===========================================================================
const I18N = {
  en: {
    skip: 'Skip to content',
    offline: 'You are offline — showing cached news.',
    online: 'Back online ✓',
    'nav.news': 'News', 'nav.channels': 'Channels', 'nav.countdown': 'Countdown',
    'nav.media': 'Media', 'nav.roadmap': 'Roadmap', 'nav.community': 'Community',
    'nav.faq': 'FAQ', 'nav.saved': 'Saved articles',
    'hero.eyebrow': 'Worldwide GTA VI coverage · every channel, one hub',
    'hero.title2': 'from everywhere.',
    'hero.lede': 'Official news, trailers, leaks and community buzz — aggregated worldwide so you never miss a beat. Launches <strong>November 19, 2026</strong>.',
    'cta.read': 'Read the news', 'cta.channels': 'Browse channels',
    'countdown.label': 'Countdown to launch',
    'cd.days': 'days', 'cd.hrs': 'hrs', 'cd.min': 'min', 'cd.sec': 'sec',
    'btn.addCal': '📅 Add to calendar', 'btn.remind': '🔔 Remind me',
    'search.placeholder': 'Search GTA 6 news…',
    'sort.newest': 'Newest first', 'sort.oldest': 'Oldest first', 'sort.popular': 'Most popular',
    'filter.lang': 'Language / region:', 'filter.verifiedOnly': 'Verified only', 'filter.clear': 'Clear all filters',
    'section.latest': 'Latest News',
    'mode.latest': 'Latest', 'mode.trending': 'Trending', 'mode.official': 'Official only',
    'btn.refresh': '⟳ Refresh', 'feed.empty': 'No articles match your filters.', 'feed.reset': 'Reset filters',
    'btn.loadMore': 'Load more',
    'section.channels': 'Channels Hub',
    'channels.sub': 'Every GTA 6 source worldwide, in one place — official, press, community & social.',
    'section.media': 'Media Gallery',
    'media.all': 'All', 'media.trailers': 'Trailers', 'media.screenshots': 'Screenshots', 'media.art': 'Art',
    'subhead.characters': 'Characters & world',
    'section.roadmap': 'Release Roadmap', 'section.community': 'Community',
    'card.newsletter': '📨 Newsletter', 'newsletter.desc': 'Get major GTA 6 updates in your inbox.', 'newsletter.subscribe': 'Subscribe',
    'card.polls': '📊 Community Polls',
    'card.tip': '💡 Submit a Tip', 'tip.desc': 'Spotted GTA 6 news? Share the link.', 'tip.note': "What's it about?", 'tip.send': 'Send tip',
    'card.join': '🌐 Join the conversation',
    'section.faq': 'Frequently Asked Questions', 'section.saved': '🔖 Saved Articles',
    'saved.empty': "You haven't saved any articles yet. Tap the 🔖 on any card.",
    'footer.about': 'A community news platform dedicated to GTA 6. Not affiliated with Rockstar Games or Take-Two Interactive.',
    'footer.sections': 'Sections', 'footer.topchannels': 'Top channels',
    'footer.copy': '© 2026 GTA 6 News Hub · Fan-made. GTA and Grand Theft Auto are trademarks of Take-Two Interactive.',
    'footer.release': 'Release target: November 19, 2026',
    'prefs.title': 'Preferences', 'prefs.view': 'View', 'prefs.lang': 'Language', 'prefs.theme': 'Theme',
    'theme.dark': 'Dark', 'theme.light': 'Light',
    'prefs.accent': 'Accent color', 'prefs.textsize': 'Text size', 'prefs.density': 'Density',
    'density.comfortable': 'Comfortable', 'density.compact': 'Compact',
    'prefs.shortcuts': '⌨️ Keyboard shortcuts', 'prefs.reset': 'Reset all preferences',
    'view.casual': 'Casual', 'view.standard': 'Standard', 'view.insider': 'Insider',
    'view.hint.casual': 'Clean & simple — only verified highlights, no rumors, larger cards.',
    'view.hint.standard': 'Balanced full view — all news with verified & rumor badges.',
    'view.hint.insider': 'Everything, for power users — leaks, rumors, full source & region detail.',
    'consent.text': 'We store preferences and your saved articles locally on your device. No tracking, no servers.',
    'consent.ok': 'Got it',
    'lang.all': 'All',
    // toasts
    't.filtersCleared': 'Filters cleared', 't.saved': 'Saved 🔖', 't.removed': 'Removed from saved',
    't.commentPosted': 'Comment posted', 't.voteCounted': 'Vote counted ✓', 't.alreadyVoted': 'You already voted',
    't.subscribed': 'Subscribed to the newsletter 📨', 't.tipSubmitted': 'Tip submitted — thank you!',
    't.linkCopied': 'Link copied to clipboard', 't.feedUpdated': 'Feed up to date ✓',
    't.calDownloaded': 'Calendar event downloaded 📅', 't.remindersOn': 'Reminders on 🔔',
    't.notifNotSupported': 'Notifications not supported', 't.notifBlocked': 'Notifications blocked',
    't.prefsReset': 'Preferences reset', 't.install': '💾 Install this app from your browser menu',
    't.installed': 'App installed ✓', 't.langSwitched': 'Language: English',
    // modal chrome
    'm.by': 'By', 'm.minread': 'min read', 'm.source': 'Source', 'm.related': 'Related',
    'm.comments': 'Comments', 'm.firstComment': 'Be the first to comment.',
    'm.namePh': 'Your name', 'm.commentPh': 'Add a comment…', 'm.postComment': 'Post comment',
    'm.copy': '🔗 Copy link', 'm.share': '𝕏 Share', 'm.save': '🏷 Save', 'm.saved': '🔖 Saved',
    'm.verified': '✓ Verified', 'm.rumor': '⚠ Rumor', 'm.readAloud': '🔊 Read aloud', 'm.stop': '⏹ Stop',
    'm.translate': '🌐 Translate', 'm.translating': '⏳ Translating…', 'm.showOriginal': '🌐 Original',
    't.translateFailed': 'Translation unavailable — showing original',
    'prefs.translate': 'Translation server', 'prefs.translatePh': 'https://translate.your-server.de',
    'prefs.translateTest': 'Test', 'prefs.translateHint': 'Point this at your self-hosted LibreTranslate instance (runs on your own server). Leave empty to disable. No data leaves your server.',
    'prefs.translateOk': 'Server reachable ✓', 'prefs.translateErr': 'Could not reach server',
    'sc.title': 'Keyboard shortcuts',
    'sc.body': '/ search · j/k next/prev · o open · t theme · v cycle view · l language · Esc close',
  },
  de: {
    skip: 'Zum Inhalt springen',
    offline: 'Du bist offline — zwischengespeicherte News werden angezeigt.',
    online: 'Wieder online ✓',
    'nav.news': 'News', 'nav.channels': 'Kanäle', 'nav.countdown': 'Countdown',
    'nav.media': 'Medien', 'nav.roadmap': 'Fahrplan', 'nav.community': 'Community',
    'nav.faq': 'FAQ', 'nav.saved': 'Gespeicherte Artikel',
    'hero.eyebrow': 'Weltweite GTA-VI-Berichte · alle Kanäle, ein Hub',
    'hero.title2': 'von überall.',
    'hero.lede': 'Offizielle News, Trailer, Leaks und Community-Buzz — weltweit gebündelt, damit du nichts verpasst. Erscheint am <strong>19. November 2026</strong>.',
    'cta.read': 'News lesen', 'cta.channels': 'Kanäle entdecken',
    'countdown.label': 'Countdown bis Release',
    'cd.days': 'Tage', 'cd.hrs': 'Std', 'cd.min': 'Min', 'cd.sec': 'Sek',
    'btn.addCal': '📅 Zum Kalender', 'btn.remind': '🔔 Erinnern',
    'search.placeholder': 'GTA-6-News suchen…',
    'sort.newest': 'Neueste zuerst', 'sort.oldest': 'Älteste zuerst', 'sort.popular': 'Beliebteste',
    'filter.lang': 'Sprache / Region:', 'filter.verifiedOnly': 'Nur verifiziert', 'filter.clear': 'Alle Filter zurücksetzen',
    'section.latest': 'Aktuelle News',
    'mode.latest': 'Aktuell', 'mode.trending': 'Angesagt', 'mode.official': 'Nur offiziell',
    'btn.refresh': '⟳ Aktualisieren', 'feed.empty': 'Keine Artikel passen zu deinen Filtern.', 'feed.reset': 'Filter zurücksetzen',
    'btn.loadMore': 'Mehr laden',
    'section.channels': 'Kanal-Hub',
    'channels.sub': 'Jede GTA-6-Quelle weltweit an einem Ort — offiziell, Presse, Community & Social.',
    'section.media': 'Mediengalerie',
    'media.all': 'Alle', 'media.trailers': 'Trailer', 'media.screenshots': 'Screenshots', 'media.art': 'Artworks',
    'subhead.characters': 'Charaktere & Welt',
    'section.roadmap': 'Release-Fahrplan', 'section.community': 'Community',
    'card.newsletter': '📨 Newsletter', 'newsletter.desc': 'Erhalte wichtige GTA-6-Updates per E-Mail.', 'newsletter.subscribe': 'Abonnieren',
    'card.polls': '📊 Community-Umfragen',
    'card.tip': '💡 Tipp einsenden', 'tip.desc': 'GTA-6-News entdeckt? Teile den Link.', 'tip.note': 'Worum geht es?', 'tip.send': 'Tipp senden',
    'card.join': '🌐 Mitreden',
    'section.faq': 'Häufige Fragen', 'section.saved': '🔖 Gespeicherte Artikel',
    'saved.empty': 'Du hast noch keine Artikel gespeichert. Tippe auf das 🔖 einer Karte.',
    'footer.about': 'Eine Community-News-Plattform rund um GTA 6. Nicht mit Rockstar Games oder Take-Two Interactive verbunden.',
    'footer.sections': 'Bereiche', 'footer.topchannels': 'Top-Kanäle',
    'footer.copy': '© 2026 GTA 6 News Hub · Fan-Projekt. GTA und Grand Theft Auto sind Marken von Take-Two Interactive.',
    'footer.release': 'Release-Ziel: 19. November 2026',
    'prefs.title': 'Einstellungen', 'prefs.view': 'Ansicht', 'prefs.lang': 'Sprache', 'prefs.theme': 'Design',
    'theme.dark': 'Dunkel', 'theme.light': 'Hell',
    'prefs.accent': 'Akzentfarbe', 'prefs.textsize': 'Schriftgröße', 'prefs.density': 'Dichte',
    'density.comfortable': 'Luftig', 'density.compact': 'Kompakt',
    'prefs.shortcuts': '⌨️ Tastenkürzel', 'prefs.reset': 'Alle Einstellungen zurücksetzen',
    'view.casual': 'Einfach', 'view.standard': 'Standard', 'view.insider': 'Experte',
    'view.hint.casual': 'Aufgeräumt & einfach — nur verifizierte Highlights, keine Gerüchte, große Karten.',
    'view.hint.standard': 'Ausgewogene Vollansicht — alle News mit Verifiziert- & Gerücht-Badges.',
    'view.hint.insider': 'Alles für Profis — Leaks, Gerüchte, volle Quellen- & Regionsdetails.',
    'consent.text': 'Wir speichern Einstellungen und gespeicherte Artikel lokal auf deinem Gerät. Kein Tracking, keine Server.',
    'consent.ok': 'Verstanden',
    'lang.all': 'Alle',
    't.filtersCleared': 'Filter zurückgesetzt', 't.saved': 'Gespeichert 🔖', 't.removed': 'Aus Gespeicherten entfernt',
    't.commentPosted': 'Kommentar gepostet', 't.voteCounted': 'Stimme gezählt ✓', 't.alreadyVoted': 'Du hast bereits abgestimmt',
    't.subscribed': 'Newsletter abonniert 📨', 't.tipSubmitted': 'Tipp gesendet — danke!',
    't.linkCopied': 'Link in die Zwischenablage kopiert', 't.feedUpdated': 'Feed ist aktuell ✓',
    't.calDownloaded': 'Kalendereintrag heruntergeladen 📅', 't.remindersOn': 'Erinnerungen an 🔔',
    't.notifNotSupported': 'Benachrichtigungen nicht unterstützt', 't.notifBlocked': 'Benachrichtigungen blockiert',
    't.prefsReset': 'Einstellungen zurückgesetzt', 't.install': '💾 Installiere die App über das Browser-Menü',
    't.installed': 'App installiert ✓', 't.langSwitched': 'Sprache: Deutsch',
    'm.by': 'Von', 'm.minread': 'Min Lesezeit', 'm.source': 'Quelle', 'm.related': 'Ähnliche Artikel',
    'm.comments': 'Kommentare', 'm.firstComment': 'Sei der/die Erste mit einem Kommentar.',
    'm.namePh': 'Dein Name', 'm.commentPh': 'Kommentar hinzufügen…', 'm.postComment': 'Kommentar posten',
    'm.copy': '🔗 Link kopieren', 'm.share': '𝕏 Teilen', 'm.save': '🏷 Speichern', 'm.saved': '🔖 Gespeichert',
    'm.verified': '✓ Verifiziert', 'm.rumor': '⚠ Gerücht', 'm.readAloud': '🔊 Vorlesen', 'm.stop': '⏹ Stopp',
    'm.translate': '🌐 Übersetzen', 'm.translating': '⏳ Übersetze…', 'm.showOriginal': '🌐 Original',
    't.translateFailed': 'Übersetzung nicht verfügbar — Original wird angezeigt',
    'prefs.translate': 'Übersetzungsserver', 'prefs.translatePh': 'https://translate.dein-server.de',
    'prefs.translateTest': 'Testen', 'prefs.translateHint': 'Verweise hier auf deine selbstgehostete LibreTranslate-Instanz (läuft auf deinem eigenen Server). Leer lassen zum Deaktivieren. Keine Daten verlassen deinen Server.',
    'prefs.translateOk': 'Server erreichbar ✓', 'prefs.translateErr': 'Server nicht erreichbar',
    'sc.title': 'Tastenkürzel',
    'sc.body': '/ Suche · j/k weiter/zurück · o öffnen · t Design · v Ansicht · l Sprache · Esc schließen',
  },
};
let LANG = Store.get('uilang', null) || ((navigator.language || 'en').toLowerCase().startsWith('de') ? 'de' : 'en');
function t(key) { return (I18N[LANG] && I18N[LANG][key]) ?? I18N.en[key] ?? key; }
function applyI18n() {
  document.documentElement.dataset.uilang = LANG;
  document.documentElement.lang = LANG;
  $('#langLabel').textContent = LANG.toUpperCase();
  $$('[data-i18n]').forEach((el) => { el.innerHTML = t(el.dataset.i18n); });
  $$('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  $$('#langSeg button').forEach((b) => b.classList.toggle('is-active', b.dataset.langVal === LANG));
  updateViewHint();
}
function setLang(lang) {
  LANG = lang; Store.set('uilang', lang);
  applyI18n();
  // re-render dynamic content that contains translated chrome
  buildLangChips(); renderFeed(); renderSaved();
  tickCountdown();
  toast(t('t.langSwitched'));
}

// --- App state -------------------------------------------------------------
const state = {
  articles: getArticles(),
  query: Store.get('lastQuery', ''),
  categories: new Set(Store.get('lastCategories', [])),
  langFilter: new Set(Store.get('langFilter', [])),
  sort: Store.get('lastSort', 'newest'),
  verifiedOnly: Store.get('verifiedOnly', false),
  viewMode: Store.get('viewMode', 'standard'),
  mode: 'latest',
  visible: PAGE_SIZE,
  saved: new Set(Store.get('saved', [])),
  read: new Set(Store.get('read', [])),
  likes: Store.get('likes', {}),
  recent: Store.get('recent', []),
  translatedView: new Set(), // article ids currently shown translated (session-only)
};
// Per-open translated content cache so re-renders keep the translation instantly.
const translatedContent = new Map();

// ===========================================================================
// Utilities
// ===========================================================================
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (LANG === 'de') {
    if (d <= 0) return 'heute';
    if (d === 1) return 'gestern';
    if (d < 30) return `vor ${d} Tagen`;
    const mo = Math.floor(d / 30);
    return mo === 1 ? 'vor einem Monat' : `vor ${mo} Monaten`;
  }
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
  // Casual view hides rumors entirely (comfort: simplified, trustworthy feed)
  if (state.verifiedOnly || state.viewMode === 'casual') list = list.filter((a) => a.verified);
  if (state.categories.size) list = list.filter((a) => state.categories.has(a.category));
  if (state.langFilter.size) list = list.filter((a) => state.langFilter.has(a.lang) || state.langFilter.has(a.region));
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
  card.tabIndex = 0;
  card.innerHTML = `
    <div class="card-media ${a.image}" role="img" aria-label="${escapeHtml(a.title)}">
      <span class="tag">${a.category}</span>
      <span class="badge-verify ${a.verified ? 'verified' : 'rumor'}">${a.verified ? t('m.verified') : t('m.rumor')}</span>
    </div>
    <div class="card-body">
      <h3>${highlight(a.title, state.query)}</h3>
      <p class="card-excerpt">${highlight(a.excerpt, state.query)}</p>
      <div class="card-meta">
        <span class="meta-source">${escapeHtml(channelName(a.source))}</span>
        <span class="meta-time">${timeAgo(a.date)}</span>
        <span class="meta-read">${readingTime(a.body)} min</span>
        <span class="meta-region">${a.lang}/${a.region}</span>
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

  Store.set('lastQuery', state.query);
  Store.set('lastCategories', [...state.categories]);
  Store.set('langFilter', [...state.langFilter]);
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

// Language / region filter chips (comfort + worldwide vision)
function buildLangChips() {
  const langs = [...new Set(state.articles.flatMap((a) => [a.lang, a.region]))].sort();
  const wrap = $('#langChips');
  wrap.innerHTML = '';
  langs.forEach((code) => {
    const b = document.createElement('button');
    b.className = 'chip' + (state.langFilter.has(code) ? ' is-active' : '');
    b.textContent = code;
    b.setAttribute('aria-pressed', state.langFilter.has(code));
    b.addEventListener('click', () => {
      state.langFilter.has(code) ? state.langFilter.delete(code) : state.langFilter.add(code);
      b.classList.toggle('is-active');
      b.setAttribute('aria-pressed', state.langFilter.has(code));
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
    }, 220);
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
  state.query = ''; state.categories.clear(); state.langFilter.clear(); state.verifiedOnly = false; state.sort = 'newest'; state.visible = PAGE_SIZE;
  $('#searchInput').value = ''; $('#sortSelect').value = 'newest'; $('#verifiedOnly').checked = false;
  buildCategoryChips(); buildLangChips(); renderFeed(); toast(t('t.filtersCleared'));
}

function initFeedModes() {
  $$('[data-mode]').forEach((btn) => btn.addEventListener('click', () => {
    $$('[data-mode]').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    state.mode = btn.dataset.mode; state.visible = PAGE_SIZE; renderFeed();
  }));
  $('#loadMore').addEventListener('click', () => { state.visible += PAGE_SIZE; renderFeed(); });
  $('#refreshFeed').addEventListener('click', () => { renderFeed(); toast(t('t.feedUpdated')); });
}

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
  // keyboard: Enter/Space opens focused card
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement?.classList?.contains('article-card')) {
      e.preventDefault(); openArticle(document.activeElement.dataset.id);
    }
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
  toast(state.saved.has(id) ? t('t.saved') : t('t.removed'));
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
  if (navigator.share) { try { await navigator.share(data); return; } catch {} }
  try { await navigator.clipboard.writeText(url); toast(t('t.linkCopied')); }
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
// Article modal (features 23, 31, 47-56) + Text-to-speech (comfort)
// ===========================================================================
function openArticle(id) {
  const a = state.articles.find((x) => x.id === id);
  if (!a) return;
  stopTTS();

  state.read.add(id); Store.set('read', [...state.read]);
  state.recent = [id, ...state.recent.filter((x) => x !== id)].slice(0, 8);
  Store.set('recent', state.recent);

  const comments = Store.get('comments_' + id, []);
  const reactions = Store.get('reactions_' + id, {});
  const userReact = Store.get('userReact_' + id, null);
  const related = state.articles
    .filter((x) => x.id !== id && (x.category === a.category || x.source === a.source))
    .slice(0, 3);

  // Translation display (ADR-011): show translated copy when toggled on.
  const translated = state.translatedView.has(id) ? translatedContent.get(id) : null;
  const dispTitle = translated ? translated.title : a.title;
  const dispBody = translated ? translated.body : a.body;
  const canTranslate = isTranslationEnabled() && toISO(a.lang) && toISO(LANG) && toISO(a.lang) !== toISO(LANG);

  $('#modalBody').innerHTML = `
    <span class="tag">${a.category}</span>
    <h1 id="modalTitle">${escapeHtml(dispTitle)}</h1>
    <div class="modal-meta">
      <span class="badge-verify ${a.verified ? 'verified' : 'rumor'}">${a.verified ? t('m.verified') : t('m.rumor')}</span>
      <span>${t('m.by')} ${escapeHtml(a.author)}</span>
      <span>${timeAgo(a.date)}</span>
      <span>${readingTime(a.body)} ${t('m.minread')}</span>
      <a href="${a.sourceUrl}" target="_blank" rel="noopener">${t('m.source')}: ${escapeHtml(channelName(a.source))} ↗</a>
      <button class="btn btn-small btn-ghost" id="ttsBtn">${t('m.readAloud')}</button>
      ${canTranslate ? `<button class="btn btn-small btn-ghost" id="translateBtn">${translated ? t('m.showOriginal') : t('m.translate')}</button>` : ''}
    </div>
    <div class="modal-hero ${a.image}"></div>
    ${dispBody.split('\n\n').map((p) => `<p>${escapeHtml(p)}</p>`).join('')}

    <div class="reactions" aria-label="Reactions">
      ${['🔥', '😮', '😂', '😢', '👍'].map((emo) => `
        <button class="reaction ${userReact === emo ? 'is-active' : ''}" data-emo="${emo}">${emo} <span>${reactions[emo] || 0}</span></button>`).join('')}
    </div>

    <div class="share-row">
      <button class="btn btn-small" data-share="copy">${t('m.copy')}</button>
      <a class="btn btn-small" data-share="x" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(a.title)}&url=${encodeURIComponent(location.href)}">${t('m.share')}</a>
      <a class="btn btn-small" data-share="reddit" target="_blank" rel="noopener" href="https://www.reddit.com/submit?title=${encodeURIComponent(a.title)}&url=${encodeURIComponent(location.href)}">Reddit</a>
      <a class="btn btn-small" data-share="wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(a.title + ' ' + location.href)}">WhatsApp</a>
      <button class="btn btn-small ${state.saved.has(id) ? 'btn-primary' : 'btn-ghost'}" data-share="save">${state.saved.has(id) ? t('m.saved') : t('m.save')}</button>
    </div>

    <div class="comments">
      <h3>${t('m.comments')} (<span id="commentCount">${comments.length}</span>)</h3>
      <form class="comment-form" id="commentForm">
        <input type="text" id="commentName" placeholder="${t('m.namePh')}" value="${escapeHtml(Store.get('commenterName', ''))}" aria-label="${t('m.namePh')}" />
        <textarea id="commentText" placeholder="${t('m.commentPh')}" rows="3" aria-label="Comment"></textarea>
        <button class="btn btn-primary btn-small" type="submit">${t('m.postComment')}</button>
      </form>
      <div id="commentList">${comments.map(renderComment).join('') || `<p class="muted">${t('m.firstComment')}</p>`}</div>
    </div>

    ${related.length ? `<div class="related"><h3>${t('m.related')}</h3><div class="related-list">${related.map((r) => `
      <div class="related-item" data-related="${r.id}">
        <div class="ri-thumb ${r.image}"></div><span>${escapeHtml(r.title)}</span>
      </div>`).join('')}</div></div>` : ''}
  `;

  // TTS (comfort: read article aloud)
  $('#ttsBtn').addEventListener('click', () => toggleTTS(a, $('#ttsBtn')));

  // Translate into UI language (ADR-011)
  const trBtn = $('#translateBtn');
  if (trBtn) trBtn.addEventListener('click', () => onTranslateClick(a));

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

  $$('#modalBody [data-share]').forEach((btn) => btn.addEventListener('click', () => {
    const ty = btn.dataset.share;
    if (ty === 'copy') shareArticle(id);
    if (ty === 'save') { toggleSave(id); openArticle(id); }
  }));

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
    toast(t('t.commentPosted'));
  });

  $$('#modalBody [data-related]').forEach((el) => el.addEventListener('click', () => openArticle(el.dataset.related)));

  showModal('#modalBackdrop');
  const modal = $('#articleModal');
  modal.scrollTop = 0;
  modal.onscroll = () => {
    const p = modal.scrollTop / (modal.scrollHeight - modal.clientHeight || 1);
    $('#modalProgress').style.width = Math.min(100, p * 100) + '%';
  };
}

// Toggle translation of the open article into the current UI language.
function onTranslateClick(a) {
  if (state.translatedView.has(a.id)) {        // toggle back to original
    state.translatedView.delete(a.id);
    openArticle(a.id);
    return;
  }
  const btn = $('#translateBtn');
  if (btn) { btn.textContent = t('m.translating'); btn.disabled = true; }
  stopTTS(); // TTS reads original-language text; stop before swapping
  translateArticle(a, toISO(LANG)).then((res) => {
    const unchanged = res.title === a.title && res.body === a.body;
    if (unchanged) {
      toast(t('t.translateFailed'));
      if (btn) { btn.textContent = t('m.translate'); btn.disabled = false; }
      return;
    }
    translatedContent.set(a.id, res);
    state.translatedView.add(a.id);
    openArticle(a.id);
  });
}

function renderComment(c) {
  return `<div class="comment"><span class="c-author">${escapeHtml(c.name)}</span>
    <span class="c-time">· ${timeAgo(c.time)}</span><p>${escapeHtml(c.text)}</p></div>`;
}

// Text-to-speech (comfort / accessibility)
let ttsActiveBtn = null;
function toggleTTS(a, btn) {
  if (!('speechSynthesis' in window)) { toast('TTS not supported'); return; }
  if (speechSynthesis.speaking) { stopTTS(); return; }
  const u = new SpeechSynthesisUtterance(a.title + '. ' + a.body.replace(/\n+/g, ' '));
  u.lang = a.lang === 'DE' ? 'de-DE' : a.lang === 'FR' ? 'fr-FR' : a.lang === 'JP' ? 'ja-JP' : 'en-US';
  u.onend = () => { if (ttsActiveBtn) ttsActiveBtn.textContent = t('m.readAloud'); ttsActiveBtn = null; };
  ttsActiveBtn = btn; btn.textContent = t('m.stop');
  speechSynthesis.speak(u);
}
function stopTTS() {
  if ('speechSynthesis' in window && speechSynthesis.speaking) speechSynthesis.cancel();
  if (ttsActiveBtn) ttsActiveBtn.textContent = t('m.readAloud');
  ttsActiveBtn = null;
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
  if (sel === '#modalBackdrop') stopTTS();
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
  types.forEach((ty) => {
    const b = document.createElement('button');
    b.className = 'chip' + (ty === channelTypeFilter ? ' is-active' : '');
    b.textContent = ty === 'All' ? t('lang.all') : ty;
    b.addEventListener('click', () => { channelTypeFilter = ty; renderChannels(); });
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
      <a class="btn btn-small btn-ghost" href="${c.url}" target="_blank" rel="noopener">Visit ↗</a>`;
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
  TIMELINE.forEach((tl) => {
    const done = new Date(tl.date) < new Date();
    const li = document.createElement('li');
    if (done) li.className = 'is-done';
    li.innerHTML = `<span class="t-date">${new Date(tl.date).toLocaleDateString(LANG === 'de' ? 'de-DE' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
      <h3>${escapeHtml(tl.title)}</h3><p>${escapeHtml(tl.desc)}</p>`;
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
  $('#countdownSince').textContent = LANG === 'de'
    ? `${since} Tage seit dem ersten Reveal (4. Dez. 2023).`
    : `${since} days since the first reveal (Dec 4, 2023).`;
}
function initCountdownActions() {
  $('#addToCalendar').addEventListener('click', () => {
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GTA6 News Hub//EN', 'BEGIN:VEVENT',
      'UID:gta6-release@newshub', 'DTSTART;VALUE=DATE:20261119', 'DTEND;VALUE=DATE:20261120',
      'SUMMARY:GTA 6 Release Day', 'DESCRIPTION:Grand Theft Auto VI launches on PS5 and Xbox Series X|S.',
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'gta6-release.ics'; a.click();
    URL.revokeObjectURL(a.href);
    toast(t('t.calDownloaded'));
  });
  $('#notifyToggle').addEventListener('click', async () => {
    if (!('Notification' in window)) { toast(t('t.notifNotSupported')); return; }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') { Store.set('notify', true); toast(t('t.remindersOn')); new Notification('GTA 6 News Hub', { body: "We'll remind you about big drops!" }); }
    else toast(t('t.notifBlocked'));
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
      if (Store.get('pollVote_' + pid, null) != null) { toast(t('t.alreadyVoted')); return; }
      const votes = Store.get('poll_' + pid, POLLS.find((p) => p.id === pid).options.map(() => 0));
      votes[opt]++; Store.set('poll_' + pid, votes); Store.set('pollVote_' + pid, opt);
      renderPolls(); toast(t('t.voteCounted'));
    };
    el.addEventListener('click', vote);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); vote(); } });
  });
}

function initNewsletter() {
  const form = $('#newsletterForm'), msg = $('#newsletterMsg');
  if (Store.get('subscribed', false)) { msg.textContent = "✓"; msg.className = 'form-msg ok'; }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#newsletterEmail').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.textContent = LANG === 'de' ? 'Bitte gültige E-Mail eingeben.' : 'Please enter a valid email.'; msg.className = 'form-msg err'; return; }
    Store.set('subscribed', true); Store.set('subscriberEmail', email);
    msg.textContent = LANG === 'de' ? 'Danke! Du bist abonniert ✓' : 'Thanks! You are subscribed ✓'; msg.className = 'form-msg ok';
    form.reset(); toast(t('t.subscribed'));
  });
}
function initTipForm() {
  const form = $('#tipForm'), msg = $('#tipMsg');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = $('#tipUrl').value.trim();
    if (!/^https?:\/\/.+/.test(url)) { msg.textContent = LANG === 'de' ? 'Gültige URL eingeben.' : 'Enter a valid URL.'; msg.className = 'form-msg err'; return; }
    const tips = Store.get('tips', []);
    tips.unshift({ url, note: $('#tipNote').value.trim(), time: new Date().toISOString() });
    Store.set('tips', tips);
    msg.textContent = LANG === 'de' ? 'Danke für den Tipp! 💡' : 'Thanks for the tip! 💡'; msg.className = 'form-msg ok';
    form.reset(); toast(t('t.tipSubmitted'));
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
// Preferences + view modes (features 11-20 + comfort views)
// ===========================================================================
function applyPrefs() {
  const html = document.documentElement;
  html.dataset.theme = Store.get('theme', prefersDark() ? 'dark' : 'light');
  html.dataset.accent = Store.get('accent', 'pink');
  html.dataset.font = Store.get('font', 'normal');
  html.dataset.density = Store.get('density', 'comfortable');
  html.dataset.view = state.viewMode;
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
  $$('#viewSeg button').forEach((b) => b.classList.toggle('is-active', b.dataset.viewVal === state.viewMode));
}
function updateViewHint() {
  const hint = $('#viewHint');
  if (hint) hint.textContent = t('view.hint.' + state.viewMode);
}
function setView(mode) {
  state.viewMode = mode; Store.set('viewMode', mode);
  document.documentElement.dataset.view = mode;
  state.visible = PAGE_SIZE;
  syncPrefUI(); updateViewHint(); renderFeed(); renderSaved();
}
function initPrefs() {
  $('#prefsToggle').addEventListener('click', () => showModal('#prefsBackdrop'));
  $('#themeToggle').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));

  $$('#viewSeg button').forEach((b) => b.addEventListener('click', () => setView(b.dataset.viewVal)));
  $$('#langSeg button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.langVal)));
  $('#langToggle').addEventListener('click', () => setLang(LANG === 'en' ? 'de' : 'en'));

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
  // Translation server config (ADR-011)
  const epInput = $('#translateEndpoint');
  if (epInput) {
    epInput.value = getEndpoint();
    epInput.addEventListener('change', () => {
      setEndpoint(epInput.value.trim());
      $('#translateMsg').textContent = '';
    });
    $('#translateTest').addEventListener('click', () => {
      const url = epInput.value.trim();
      const msg = $('#translateMsg');
      setEndpoint(url);
      msg.textContent = '…'; msg.className = 'form-msg';
      testEndpoint(url).then((ok) => {
        msg.textContent = ok ? t('prefs.translateOk') : t('prefs.translateErr');
        msg.className = 'form-msg ' + (ok ? 'ok' : 'err');
      });
    });
  }
  $('#shortcutsBtn').addEventListener('click', () => toast(t('sc.title') + ' — ' + t('sc.body')));
  $('#resetPrefs').addEventListener('click', () => {
    ['theme', 'accent', 'font', 'density', 'viewMode'].forEach((k) => localStorage.removeItem('gta6_' + k));
    state.viewMode = 'standard';
    applyPrefs(); renderFeed(); toast(t('t.prefsReset'));
  });
}
function setTheme(ty) {
  document.documentElement.dataset.theme = ty; Store.set('theme', ty);
  $('#themeToggle').textContent = ty === 'dark' ? '🌙' : '☀️';
  syncPrefUI();
}

// ===========================================================================
// Keyboard shortcuts (comfort)
// ===========================================================================
function initShortcuts() {
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    // don't hijack while a modal is open (except handled elsewhere)
    const cards = $$('#feedGrid .article-card');
    switch (e.key) {
      case '/':
        e.preventDefault(); $('#searchPanel').hidden = false; $('#searchInput').focus(); break;
      case 't': setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); break;
      case 'l': setLang(LANG === 'en' ? 'de' : 'en'); break;
      case 'v': {
        const order = ['casual', 'standard', 'insider'];
        setView(order[(order.indexOf(state.viewMode) + 1) % 3]);
        toast(t('view.' + state.viewMode)); break;
      }
      case '?': toast(t('sc.title') + ' — ' + t('sc.body')); break;
      case 'j': case 'k': {
        if (!cards.length) break;
        const cur = document.activeElement?.classList?.contains('article-card') ? cards.indexOf(document.activeElement) : -1;
        let next = e.key === 'j' ? cur + 1 : cur - 1;
        next = Math.max(0, Math.min(cards.length - 1, next));
        cards[next].focus(); cards[next].scrollIntoView({ block: 'center', behavior: 'smooth' });
        break;
      }
      case 'o': {
        if (document.activeElement?.classList?.contains('article-card')) openArticle(document.activeElement.dataset.id);
        break;
      }
    }
  });
}

// ===========================================================================
// Header behaviour, scroll spy, back-to-top, drawer
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

    let current = '';
    sections.forEach((s) => { if (s.getBoundingClientRect().top <= 120) current = s.id; });
    navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + current));
    if (current) Store.set('lastSection', current);
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
// Consent, visit tracking, restore last section
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
      el.textContent = LANG === 'de'
        ? `✨ ${newCount} neue${newCount > 1 ? '' : 'r'} Artikel seit deinem letzten Besuch.`
        : `✨ ${newCount} new article${newCount > 1 ? 's' : ''} since your last visit.`;
    }
  }
  Store.set('lastVisit', Date.now());
}
// Restore last visited section (comfort) — only when arriving without a hash
function restoreLastSection() {
  if (location.hash) return;
  const last = Store.get('lastSection', null);
  if (last && last !== 'home') {
    const el = document.getElementById(last);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'auto' }), 60);
  }
}

// ===========================================================================
// Online/offline indicator (comfort)
// ===========================================================================
function initConnectivity() {
  const banner = $('#offlineBanner');
  const update = (online) => {
    banner.hidden = online;
    if (online) banner.classList.remove('show'); else banner.classList.add('show');
  };
  window.addEventListener('online', () => { update(true); toast(t('online')); });
  window.addEventListener('offline', () => { update(false); });
  update(navigator.onLine !== false);
}

// ===========================================================================
// PWA service worker + install button (features 79-84 + comfort)
// ===========================================================================
let deferredInstall = null;
function initPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  const btn = $('#installBtn');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredInstall = e; btn.hidden = false;
    if (!Store.get('installHinted', false)) { toast(t('t.install')); Store.set('installHinted', true); }
  });
  btn.addEventListener('click', async () => {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    await deferredInstall.userChoice;
    deferredInstall = null; btn.hidden = true;
  });
  window.addEventListener('appinstalled', () => { btn.hidden = true; toast(t('t.installed')); });
}

// ===========================================================================
// Boot
// ===========================================================================
function init() {
  applyI18n();
  applyPrefs();
  buildCategoryChips();
  buildLangChips();
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
  initShortcuts();
  initScroll();
  initDrawer();
  initCountdownActions();
  initConsent();
  initVisitTracking();
  initConnectivity();
  initPWA();

  tickCountdown();
  setInterval(tickCountdown, 1000);

  if (location.hash.startsWith('#article-')) {
    const id = location.hash.replace('#article-', '');
    setTimeout(() => openArticle(id), 300);
  } else {
    restoreLastSection();
  }
}

document.addEventListener('DOMContentLoaded', init);
