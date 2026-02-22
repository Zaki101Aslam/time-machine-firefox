(async function init() {
  const settings = await browser.storage.local.get({ isActive: true, filterMode: "future", cutoffDate: "2020-01-01" });
  if (!settings.isActive) return;

  const CUTOFF_TIMESTAMP = new Date(settings.cutoffDate).getTime();
  const MODE = settings.filterMode; 
  const host = window.location.hostname;

  // Security fallback: Only execute if we are actually on Google or YouTube
  if (!host.includes('google.com') && !host.includes('youtube.com')) return;

  // Inject CSS to securely hide elements
  const style = document.createElement('style');
  style.textContent = `.time-hidden { display: none !important; opacity: 0 !important; height: 0 !important; overflow: hidden !important; pointer-events: none !important; }`;
  document.head.appendChild(style);

  function filterSearch() {
    if (host.includes('google.com')) {
      document.querySelectorAll('div.g:not(.time-checked), div.MjjYud:not(.time-checked), div[data-sokoban-container]:not(.time-checked)').forEach(result => {
        result.classList.add('time-checked');
        if (shouldHide(result.textContent.replace(/\xa0/g, ' '))) result.classList.add('time-hidden');
      });
      
      // Hide AI Overview if looking at the past
      if (MODE === 'future') {
          document.querySelectorAll('div[data-attrid="AIOverview"], div[jsname="N760b"]').forEach(ai => ai.classList.add('time-hidden'));
      }
    } 
    else if (host.includes('youtube.com')) {
      document.querySelectorAll('ytd-video-renderer:not(.time-checked), ytd-rich-item-renderer:not(.time-checked), ytd-compact-video-renderer:not(.time-checked)').forEach(card => {
        card.classList.add('time-checked');
        const metadata = card.querySelector('#metadata-line, .ytd-video-meta-block');
        const text = (metadata ? metadata.textContent : card.textContent).replace(/\xa0/g, ' ');
        if (shouldHide(text)) card.classList.add('time-hidden');
      });
      
      // Hide YouTube Shorts if looking at the past
      if (MODE === 'future') {
          document.querySelectorAll('ytd-reel-item-renderer, [overlay-style="SHORTS"]').forEach(short => short.classList.add('time-hidden'));
      }
    }
  }

  function shouldHide(text) {
    if (!text) return false;
    const NOW = Date.now();
    const isTarget = (timestamp) => MODE === 'future' ? timestamp >= CUTOFF_TIMESTAMP : timestamp < CUTOFF_TIMESTAMP;

    // 1. Live/Premiere
    if (/(?:Streamed|Premiered|LIVE|ライブ|プレミア公開)/i.test(text)) {
      if (isTarget(NOW)) return true;
    }

    // 2. Relative Dates (Math)
    const relMatch = text.match(/(\d+)\s*(second|minute|hour|day|week|month|year|秒|分|時間|日|週間|ヶ月|か月|カ月|箇月|年)s?(?:\s+ago|前)/i);
    if (relMatch) {
      const amount = parseInt(relMatch[1], 10);
      const unit = relMatch[2].toLowerCase();
      let multiplier = 0;

      if (['second', '秒'].includes(unit)) multiplier = 1000;
      else if (['minute', '分'].includes(unit)) multiplier = 60 * 1000;
      else if (['hour', '時間'].includes(unit)) multiplier = 60 * 60 * 1000;
      else if (['day', '日'].includes(unit)) multiplier = 24 * 60 * 60 * 1000;
      else if (['week', '週間'].includes(unit)) multiplier = 7 * 24 * 60 * 60 * 1000;
      else if (['month', 'ヶ月', 'か月', 'カ月', '箇月'].includes(unit)) multiplier = 30 * 24 * 60 * 60 * 1000;
      else if (['year', '年'].includes(unit)) multiplier = 365 * 24 * 60 * 60 * 1000;

      if (isTarget(NOW - (amount * multiplier))) return true;
    }

    // 3. Explicit English Dates
    const engMatch = text.match(/(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i);
    if (engMatch) {
      const ts = new Date(engMatch[0]).getTime();
      if (!isNaN(ts) && isTarget(ts)) return true;
    }

    // 4. Explicit Numeric/Japanese Dates
    const numMatch = text.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})|(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (numMatch) {
      const ts = new Date(`${numMatch[1]||numMatch[4]}-${numMatch[2]||numMatch[5]}-${numMatch[3]||numMatch[6]}`).getTime();
      if (!isNaN(ts) && isTarget(ts)) return true;
    }

    return false;
  }

  // Initial run and observer setup
  filterSearch();
  const observer = new MutationObserver(() => {
    clearTimeout(window.filterTimeout);
    window.filterTimeout = setTimeout(filterSearch, 250);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();