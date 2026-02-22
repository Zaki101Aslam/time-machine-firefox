document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('toggleFilter');
  const modeToggle = document.getElementById('modeToggle');
  const modeText = document.getElementById('modeText');
  const dateInput = document.getElementById('dateInput');
  const saveBtn = document.getElementById('saveBtn');

  // Updates the toggle text and color dynamically
  function updateModeUI() {
    if (modeToggle.checked) {
      modeText.textContent = "Filter Past";
      modeText.style.color = "#f0f"; // Magenta for past
      dateInput.style.color = "#f0f";
      dateInput.style.borderColor = "#f0f";
    } else {
      modeText.textContent = "Filter Future";
      modeText.style.color = "#0f0"; // Green for future
      dateInput.style.color = "#0f0";
      dateInput.style.borderColor = "#0f0";
    }
  }

  modeToggle.addEventListener('change', updateModeUI);

  // Load settings
  try {
    const res = await browser.storage.local.get({ isActive: true, filterMode: "future", cutoffDate: "2020-01-01" });
    toggle.checked = res.isActive;
    modeToggle.checked = (res.filterMode === "past"); // true = past, false = future
    dateInput.value = res.cutoffDate;
    updateModeUI();
  } catch (err) {
    saveBtn.textContent = "SYS ERROR";
    saveBtn.style.color = "red";
  }

  // Save settings
  saveBtn.addEventListener('click', async () => {
    try {
      await browser.storage.local.set({
        isActive: toggle.checked,
        filterMode: modeToggle.checked ? "past" : "future",
        cutoffDate: dateInput.value
      });
      
      saveBtn.textContent = "SYSTEM SAVED";
      saveBtn.style.background = modeToggle.checked ? "#f0f" : "#0f0";
      saveBtn.style.color = "#000";
      
      setTimeout(() => { 
         saveBtn.textContent = "ENGAGE"; 
         saveBtn.style.background = "#000";
         saveBtn.style.color = modeToggle.checked ? "#f0f" : "#0f0";
      }, 1500);

      const tabs = await browser.tabs.query({active: true, currentWindow: true});
      if (tabs.length > 0 && !tabs[0].url.startsWith('about:')) {
        browser.tabs.reload(tabs[0].id);
      }
    } catch (err) {
      saveBtn.textContent = "DB WRITE ERR";
    }
  });
});