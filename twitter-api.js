const TwitterAPI = {
  extractPostUrls() {
    const tweets = document.querySelectorAll('article');
    const urls = new Set();
    console.log('Found tweets:', tweets.length);

    tweets.forEach(tweet => {
      // Try different methods to find the tweet URL
      const timeLink = tweet.querySelector('time')?.closest('a');
      const statusLink = tweet.querySelector('a[href*="/status/"]');
      const cellInnerDiv = tweet.closest('[data-testid="cellInnerDiv"]')?.querySelector('a[href*="/status/"]');

      let url = null;
      if (timeLink && this.isValidPostUrl(timeLink.href)) {
        url = timeLink.href;
      } else if (statusLink && this.isValidPostUrl(statusLink.href)) {
        url = statusLink.href;
      } else if (cellInnerDiv && this.isValidPostUrl(cellInnerDiv.href)) {
        url = cellInnerDiv.href;
      }

      if (url) {
        urls.add(url);
      }
    });

    const extractedUrls = Array.from(urls);
    console.log('Extracted valid post URLs:', extractedUrls.length);
    return extractedUrls;
  },

  isValidPostUrl(url) {
    try {
      const urlObj = new URL(url);
      return (urlObj.hostname === 'twitter.com' || urlObj.hostname === 'x.com') 
        && urlObj.pathname.match(/\/[^\/]+\/status\/\d+/);
    } catch {
      return false;
    }
  },

  extractPostId(url) {
    const match = url.match(/\/status\/(\d+)/);
    return match ? match[1] : null;
  }
};