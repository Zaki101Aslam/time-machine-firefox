// Listen for completed web requests
browser.webRequest.onCompleted.addListener(
  function(details) {
    // Check if it's the main page loading and if it threw a 404
    if (details.type === 'main_frame' && details.statusCode === 404) {
      console.log(`404 detected on ${details.url}. Redirecting to archive...`);
      
      // We will aim for snapshots right before the 2020 cutoff: 20191231
      const archiveUrl = `https://web.archive.org/web/20191231235959/${details.url}`;
      
      // Redirect the current tab
      browser.tabs.update(details.tabId, { url: archiveUrl });
    }
  },
  { urls: ["<all_urls>"], types: ["main_frame"] }
);