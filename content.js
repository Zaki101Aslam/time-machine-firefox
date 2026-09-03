(async function init() {
  const webExtApi = (typeof browser !== 'undefined') ? browser : (typeof chrome !== 'undefined' ? chrome : null);

  let settings = { isActive: true, filterMode: "future", cutoffDate: "2020-01-01" };

  async function loadSettings() {
    if (webExtApi && webExtApi.storage && webExtApi.storage.local) {
      return new Promise((resolve) => {
        try {
          const res = webExtApi.storage.local.get(settings);
          if (res && typeof res.then === 'function') {
            res.then((data) => resolve({ ...settings, ...(data || {}) })).catch(() => resolve(settings));
          } else {
            webExtApi.storage.local.get(settings, (data) => {
              resolve({ ...settings, ...(data || {}) });
            });
          }
        } catch {
          resolve(settings);
        }
      });
    }
    return settings;
  }

  settings = await loadSettings();

  const host = window.location.hostname.toLowerCase();
  const isGoogle = /(?:^|\.)google\.(?:com|co\.[a-z]{2}|[a-z]{2,3})$/.test(host);
  const isYouTube = host.includes('youtube.com');
  const isDuckDuckGo = host.includes('duckduckgo.com');
  const isBing = host.includes('bing.com');

  if (!isGoogle && !isYouTube && !isDuckDuckGo && !isBing) return;

  function parseCutoffDate(dateStr) {
    if (!dateStr) return new Date("2020-01-01T00:00:00").getTime();
    const ts = new Date(dateStr + "T00:00:00").getTime();
    return isNaN(ts) ? new Date("2020-01-01T00:00:00").getTime() : ts;
  }

  let cutoffTimestamp = parseCutoffDate(settings.cutoffDate);

  // Inject CSS
  function injectStyles() {
    if (document.getElementById('time-machine-style')) return;
    const style = document.createElement('style');
    style.id = 'time-machine-style';
    style.textContent = `.time-hidden { display: none !important; opacity: 0 !important; height: 0 !important; overflow: hidden !important; pointer-events: none !important; }`;
    const target = document.head || document.documentElement;
    if (target) target.appendChild(style);
  }

  injectStyles();

  // Google Search Native Historical Range Integration
  function syncGoogleSearchDateParam() {
    if (!isGoogle || !window.location.pathname.startsWith('/search')) return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has('q')) return;

    if (!settings.isActive) {
      if (params.has('tbs') && params.get('tbs').includes('cdr:1')) {
        params.delete('tbs');
        const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + window.location.hash;
        window.location.replace(newUrl);
      }
      return;
    }

    const parts = (settings.cutoffDate || '2020-01-01').split('-');
    if (parts.length !== 3) return;
    const y = parts[0];
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const dateStr = `${m}/${d}/${y}`;

    const isFuture = (settings.filterMode === 'future');
    const targetTbs = `cdr:1,cd_${isFuture ? 'max' : 'min'}:${dateStr}`;
    const currentTbs = params.get('tbs') || '';

    if (!currentTbs.includes(targetTbs)) {
      params.set('tbs', targetTbs);
      const newUrl = window.location.pathname + '?' + params.toString() + window.location.hash;
      window.location.replace(newUrl);
    }
  }

  const MONTH_MAP = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
    apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
    aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
    nov: 10, november: 10, dec: 11, december: 11
  };

  const MONTH_REGEX = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember))';

  function extractTimestamp(text) {
    if (!text) return null;
    const cleanText = text.replace(/\xa0/g, ' ').trim();
    const NOW = Date.now();

    // 1. Natural Language Indicators
    if (/(?:just now|moments ago|たった今)/i.test(cleanText)) {
      return NOW;
    }
    if (/(?:\btoday\b|今日)/i.test(cleanText)) {
      return NOW;
    }
    if (/(?:\byesterday\b|昨日)/i.test(cleanText)) {
      return NOW - (24 * 60 * 60 * 1000);
    }

    // 2. Relative Dates (English + Japanese + Abbreviations)
    const relMatch = cleanText.match(/(\d+)\s*(secs?|seconds?|mins?|minutes?|hrs?|hours?|days?|wks?|weeks?|mos?|months?|yrs?|years?|秒|分|時間|日|週間|ヶ月|か月|カ月|箇月|年)\s*(?:ago|前)/i);
    if (relMatch) {
      const amount = parseInt(relMatch[1], 10);
      const unit = relMatch[2].toLowerCase();
      let multiplier = 0;

      if (/^(secs?|seconds?|秒)$/.test(unit)) multiplier = 1000;
      else if (/^(mins?|minutes?|分)$/.test(unit)) multiplier = 60 * 1000;
      else if (/^(hrs?|hours?|時間)$/.test(unit)) multiplier = 60 * 60 * 1000;
      else if (/^(days?|日)$/.test(unit)) multiplier = 24 * 60 * 60 * 1000;
      else if (/^(wks?|weeks?|週間)$/.test(unit)) multiplier = 7 * 24 * 60 * 60 * 1000;
      else if (/^(mos?|months?|ヶ月|か月|カ月|箇月)$/.test(unit)) multiplier = 30 * 24 * 60 * 60 * 1000;
      else if (/^(yrs?|years?|年)$/.test(unit)) multiplier = 365 * 24 * 60 * 60 * 1000;

      if (multiplier > 0) {
        return NOW - (amount * multiplier);
      }
    }

    // 3. Live / Streamed / Premiere fallback (if no relative time matched)
    if (/(?:Streamed|Premiered|LIVE|ライブ|プレミア公開)/i.test(cleanText)) {
      return NOW;
    }

    // 4. Explicit Dates with Month Names (e.g. "Jan 15, 2023", "15 Jan 2023")
    const engDateWithYear = cleanText.match(new RegExp('(?:(' + MONTH_REGEX + ')\\s+(\\d{1,2}),?\\s+(\\d{4})|(\\d{1,2})\\s+(' + MONTH_REGEX + '),?\\s+(\\d{4}))', 'i'));
    if (engDateWithYear) {
      const monthStr = (engDateWithYear[1] || engDateWithYear[5]).toLowerCase();
      const day = parseInt(engDateWithYear[2] || engDateWithYear[4], 10);
      const year = parseInt(engDateWithYear[3] || engDateWithYear[6], 10);
      const month = MONTH_MAP[monthStr];
      if (month !== undefined && !isNaN(day) && !isNaN(year)) {
        return new Date(year, month, day).getTime();
      }
    }

    // 5. Month + Year (e.g. "Nov 2022", "November 2022")
    const monthYearMatch = cleanText.match(new RegExp('\\b(' + MONTH_REGEX + ')\\s+(\\d{4})\\b', 'i'));
    if (monthYearMatch) {
      const monthStr = monthYearMatch[1].toLowerCase();
      const year = parseInt(monthYearMatch[2], 10);
      const month = MONTH_MAP[monthStr];
      if (month !== undefined && !isNaN(year)) {
        return new Date(year, month, 1).getTime();
      }
    }

    // 6. Month + Day without Year (Current Year on Google, e.g. "Mar 14", "14 Mar")
    const engDateNoYear = cleanText.match(new RegExp('(?:\\b(' + MONTH_REGEX + ')\\s+(\\d{1,2})\\b|\\b(\\d{1,2})\\s+(' + MONTH_REGEX + ')\\b)', 'i'));
    if (engDateNoYear) {
      const monthStr = (engDateNoYear[1] || engDateNoYear[4]).toLowerCase();
      const day = parseInt(engDateNoYear[2] || engDateNoYear[3], 10);
      const month = MONTH_MAP[monthStr];
      if (month !== undefined && !isNaN(day)) {
        const currentYear = new Date().getFullYear();
        return new Date(currentYear, month, day).getTime();
      }
    }

    // 7. Japanese Explicit Dates (e.g. "2023年5月12日" or "5月12日")
    const jpMatch = cleanText.match(/(?:(\d{4})年\s*)?(\d{1,2})月\s*(\d{1,2})日/);
    if (jpMatch) {
      const year = jpMatch[1] ? parseInt(jpMatch[1], 10) : new Date().getFullYear();
      const month = parseInt(jpMatch[2], 10) - 1;
      const day = parseInt(jpMatch[3], 10);
      return new Date(year, month, day).getTime();
    }

    // 8. Numeric Dates (YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD)
    const numMatchYMD = cleanText.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (numMatchYMD) {
      const year = parseInt(numMatchYMD[1], 10);
      const month = parseInt(numMatchYMD[2], 10) - 1;
      const day = parseInt(numMatchYMD[3], 10);
      return new Date(year, month, day).getTime();
    }

    // 9. Numeric Dates (DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, MM/DD/YYYY)
    const numMatchDMY = cleanText.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (numMatchDMY) {
      const p1 = parseInt(numMatchDMY[1], 10);
      const p2 = parseInt(numMatchDMY[2], 10);
      const year = parseInt(numMatchDMY[3], 10);
      const month = (p1 > 12 ? p2 : p1) - 1;
      const day = p1 > 12 ? p1 : p2;
      return new Date(year, month, day).getTime();
    }

    // 10. Standalone 4-digit Year (e.g. "2024", "2023", "2018")
    const yearMatch = cleanText.match(/\b(19\d{2}|20[0-2]\d|203\d)\b/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10);
      return new Date(year, 0, 1).getTime();
    }

    return null;
  }

  function shouldHide(text) {
    if (!text || !settings.isActive) return false;
    const ts = extractTimestamp(text);
    if (ts === null || isNaN(ts)) return false;

    return settings.filterMode === 'future'
      ? ts >= cutoffTimestamp
      : ts < cutoffTimestamp;
  }

  function clearFilter() {
    document.querySelectorAll('.time-hidden').forEach(el => el.classList.remove('time-hidden'));
    document.querySelectorAll('.time-checked').forEach(el => el.classList.remove('time-checked'));
  }

  function filterSearch() {
    if (!settings.isActive) {
      clearFilter();
      return;
    }

    if (isGoogle) {
      syncGoogleSearchDateParam();

      // Target all Google search cards
      const googleCards = document.querySelectorAll(
        'div.MjjYud:not(.time-checked), div.g:not(.time-checked), div[data-sokoban-container]:not(.time-checked), g-card:not(.time-checked), div.hlcw0c:not(.time-checked), div.So3Bbe:not(.time-checked), div.RzdJxc:not(.time-checked)'
      );

      googleCards.forEach(card => {
        card.classList.add('time-checked');
        const textToCheck = card.textContent.replace(/\xa0/g, ' ');
        if (shouldHide(textToCheck)) {
          card.classList.add('time-hidden');
        }
      });

      // Hide AI Overviews when in future mode
      if (settings.filterMode === 'future') {
        document.querySelectorAll('div[data-attrid="AIOverview"], div[jsname="N760b"], div#mfe-overview, [data-attrid*="wa:/g/"], div.x54gtf').forEach(ai => {
          ai.classList.add('time-hidden');
        });
      }
    } else if (isYouTube) {
      const cards = document.querySelectorAll('ytd-video-renderer:not(.time-checked), ytd-rich-item-renderer:not(.time-checked), ytd-compact-video-renderer:not(.time-checked), ytd-grid-video-renderer:not(.time-checked)');
      cards.forEach(card => {
        card.classList.add('time-checked');
        const metadata = card.querySelector('#metadata-line, .ytd-video-meta-block, span.inline-metadata-item, #metadata');
        const textToCheck = (metadata ? metadata.textContent : card.textContent).replace(/\xa0/g, ' ');
        if (shouldHide(textToCheck)) {
          card.classList.add('time-hidden');
        }
      });

      // Hide YouTube Shorts shelves when in future mode
      if (settings.filterMode === 'future') {
        document.querySelectorAll('ytd-reel-shelf-renderer, ytd-rich-shelf-renderer[is-shorts], ytd-reel-item-renderer, ytd-rich-section-renderer:has(ytd-reel-shelf-renderer), [overlay-style="SHORTS"]').forEach(short => {
          short.classList.add('time-hidden');
        });
      }
    } else if (isDuckDuckGo) {
      const ddgCards = document.querySelectorAll('article[data-testid="result"]:not(.time-checked), div.result:not(.time-checked), div.results_links_deep:not(.time-checked)');
      ddgCards.forEach(card => {
        card.classList.add('time-checked');
        const textToCheck = card.textContent.replace(/\xa0/g, ' ');
        if (shouldHide(textToCheck)) {
          card.classList.add('time-hidden');
        }
      });
    } else if (isBing) {
      const bingCards = document.querySelectorAll('li.b_algo:not(.time-checked), div.b_algo:not(.time-checked)');
      bingCards.forEach(card => {
        card.classList.add('time-checked');
        const textToCheck = card.textContent.replace(/\xa0/g, ' ');
        if (shouldHide(textToCheck)) {
          card.classList.add('time-hidden');
        }
      });
    }
  }

  // Real-time synchronization when settings change
  if (webExtApi && webExtApi.storage && webExtApi.storage.onChanged) {
    webExtApi.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' || !area) {
        if (changes.isActive) settings.isActive = changes.isActive.newValue;
        if (changes.filterMode) settings.filterMode = changes.filterMode.newValue;
        if (changes.cutoffDate) {
          settings.cutoffDate = changes.cutoffDate.newValue;
          cutoffTimestamp = parseCutoffDate(settings.cutoffDate);
        }
        clearFilter();
        if (settings.isActive) {
          filterSearch();
        } else if (isGoogle) {
          syncGoogleSearchDateParam();
        }
      }
    });
  }

  // Initial execution & debounced observer
  filterSearch();

  let filterTimeout = null;
  const observer = new MutationObserver(() => {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(filterSearch, 150);
  });

  observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
})();