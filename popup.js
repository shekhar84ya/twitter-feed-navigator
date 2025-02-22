document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('enableToggle');
  const statusEl = document.getElementById('cacheStatus');
  
  // Initialize toggle state
  chrome.storage.local.get('enabled', (data) => {
    toggle.checked = data.enabled;
    updateCacheStatus();
  });
  
  // Handle toggle changes
  toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    chrome.storage.local.set({ enabled });
    
    // Refresh Twitter tabs when enabling
    if (enabled) {
      chrome.tabs.query({ url: ['*://twitter.com/*', '*://x.com/*'] }, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.reload(tab.id);
        });
      });
    }
  });
  
  function updateCacheStatus() {
    chrome.runtime.sendMessage({ type: 'GET_CACHE_STATUS' }, (response) => {
      if (response) {
        statusEl.textContent = `Cached posts: ${response.total}`;
      }
    });
  }
  
  // Update cache status periodically
  setInterval(updateCacheStatus, 5000);
});
