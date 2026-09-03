document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('toggleFilter');
  const powerText = document.getElementById('powerText');
  const modeToggle = document.getElementById('modeToggle');
  const modeText = document.getElementById('modeText');
  const dateInput = document.getElementById('dateInput');
  const saveBtn = document.getElementById('saveBtn');
  const archiveBtn = document.getElementById('archiveBtn');

  const THEMES = {
    future: {
      neon: '#00ff66',
      glow: 'rgba(0, 255, 102, 0.3)',
      label: 'Filter Future'
    },
    past: {
      neon: '#ff00ff',
      glow: 'rgba(255, 0, 255, 0.3)',
      label: 'Filter Past'
    }
  };

  const webExtApi = (typeof browser !== 'undefined') ? browser : (typeof chrome !== 'undefined' ? chrome : null);

  const StorageManager = {
    async get(defaults) {
      if (webExtApi && webExtApi.storage && webExtApi.storage.local) {
        return new Promise((resolve) => {
          try {
            const res = webExtApi.storage.local.get(defaults);
            if (res && typeof res.then === 'function') {
              res.then((data) => resolve(data || defaults)).catch(() => resolve(defaults));
            } else {
              webExtApi.storage.local.get(defaults, (data) => {
                if (webExtApi.runtime && webExtApi.runtime.lastError) {
                  resolve(defaults);
                } else {
                  resolve(data || defaults);
                }
              });
            }
          } catch (e) {
            resolve(defaults);
          }
        });
      }
      try {
        const res = {};
        for (const [key, defaultVal] of Object.entries(defaults)) {
          const stored = localStorage.getItem('timemachine_' + key);
          if (stored !== null) {
            try {
              res[key] = JSON.parse(stored);
            } catch {
              res[key] = stored;
            }
          } else {
            res[key] = defaultVal;
          }
        }
        return res;
      } catch {
        return defaults;
      }
    },

    async set(data) {
      if (webExtApi && webExtApi.storage && webExtApi.storage.local) {
        return new Promise((resolve, reject) => {
          try {
            const res = webExtApi.storage.local.set(data);
            if (res && typeof res.then === 'function') {
              res.then(resolve).catch(reject);
            } else {
              webExtApi.storage.local.set(data, () => {
                if (webExtApi.runtime && webExtApi.runtime.lastError) {
                  reject(webExtApi.runtime.lastError);
                } else {
                  resolve();
                }
              });
            }
          } catch (e) {
            try {
              for (const [key, val] of Object.entries(data)) {
                localStorage.setItem('timemachine_' + key, JSON.stringify(val));
              }
              resolve();
            } catch (storageErr) {
              reject(storageErr);
            }
          }
        });
      }
      for (const [key, val] of Object.entries(data)) {
        localStorage.setItem('timemachine_' + key, JSON.stringify(val));
      }
    }
  };

  function updatePowerUI() {
    if (powerText) {
      powerText.textContent = toggle.checked ? 'ON' : 'OFF';
      powerText.style.color = toggle.checked ? 'var(--neon)' : '#666';
    }
  }

  function updateModeUI() {
    const isPast = modeToggle.checked;
    const currentTheme = isPast ? THEMES.past : THEMES.future;

    document.documentElement.style.setProperty('--neon', currentTheme.neon);
    document.documentElement.style.setProperty('--neon-glow', currentTheme.glow);
    modeText.textContent = currentTheme.label;
    updatePowerUI();
  }

  toggle.addEventListener('change', updatePowerUI);
  modeToggle.addEventListener('change', updateModeUI);

  // Load stored settings with defaults
  try {
    const res = await StorageManager.get({
      isActive: true,
      filterMode: "future",
      cutoffDate: "2020-01-01"
    });
    toggle.checked = Boolean(res.isActive);
    modeToggle.checked = (res.filterMode === "past");
    dateInput.value = res.cutoffDate || "2020-01-01";
    updateModeUI();
  } catch (err) {
    console.error('Error loading settings:', err);
    saveBtn.textContent = "SYS LOAD ERR";
    saveBtn.style.color = "red";
  }

  // Save settings and reload active search tab if applicable
  saveBtn.addEventListener('click', async () => {
    try {
      let targetDate = (dateInput.value || '').trim();
      if (!targetDate || isNaN(new Date(targetDate).getTime())) {
        targetDate = "2020-01-01";
        dateInput.value = targetDate;
      }

      const newSettings = {
        isActive: toggle.checked,
        filterMode: modeToggle.checked ? "past" : "future",
        cutoffDate: targetDate
      };

      await StorageManager.set(newSettings);

      saveBtn.textContent = "SYSTEM SAVED";
      saveBtn.style.background = modeToggle.checked ? THEMES.past.neon : THEMES.future.neon;
      saveBtn.style.color = "#000";

      setTimeout(() => {
        saveBtn.textContent = "ENGAGE";
        saveBtn.style.background = "";
        saveBtn.style.color = "";
      }, 1200);

      // Reload search tab safely
      if (webExtApi && webExtApi.tabs && typeof webExtApi.tabs.query === 'function') {
        try {
          const handleTabs = (tabs) => {
            if (tabs && tabs.length > 0 && tabs[0].id) {
              const url = tabs[0].url || '';
              if (url && (url.includes('google.') || url.includes('youtube.') || url.includes('duckduckgo.') || url.includes('bing.'))) {
                webExtApi.tabs.reload(tabs[0].id);
              }
            }
          };
          const queryPromise = webExtApi.tabs.query({ active: true, currentWindow: true });
          if (queryPromise && typeof queryPromise.then === 'function') {
            queryPromise.then(handleTabs).catch(() => {});
          } else {
            webExtApi.tabs.query({ active: true, currentWindow: true }, handleTabs);
          }
        } catch (tabErr) {
          console.debug('Tab reload optional step:', tabErr);
        }
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      saveBtn.textContent = "DB WRITE ERR";
    }
  });

  // Travel current tab to Wayback Machine Archive
  archiveBtn.addEventListener('click', async () => {
    try {
      let targetDate = (dateInput.value || '2020-01-01').replace(/-/g, '');
      const archiveTimestamp = `${targetDate}235959`;

      archiveBtn.textContent = "TRAVELING...";

      let currentUrl = '';
      if (webExtApi && webExtApi.tabs && typeof webExtApi.tabs.query === 'function') {
        try {
          const tabs = await webExtApi.tabs.query({ active: true, currentWindow: true });
          if (tabs && tabs.length > 0 && tabs[0].url) {
            currentUrl = tabs[0].url;
          }
        } catch (e) {
          console.debug('Tab query error for archive:', e);
        }
      }

      let destination = `https://web.archive.org/web/${archiveTimestamp}/`;
      if (currentUrl && !currentUrl.startsWith('about:') && !currentUrl.startsWith('moz-extension:') && !currentUrl.startsWith('chrome:')) {
        destination += currentUrl;
      }

      if (webExtApi && webExtApi.tabs && typeof webExtApi.tabs.create === 'function') {
        webExtApi.tabs.create({ url: destination });
      } else {
        window.open(destination, '_blank');
      }

      setTimeout(() => {
        archiveBtn.textContent = "🚀 Travel Page to Archive";
      }, 1500);
    } catch (err) {
      console.error('Archive travel error:', err);
      archiveBtn.textContent = "ARCHIVE ERR";
    }
  });
});