const TwitterAPI = {
  extractPostUrls() {
    const urls = new Set();

    // Only look for posts in the timeline or main content area
    const timeline = document.querySelector('[data-testid="primaryColumn"]');
    if (!timeline) return [];

    const tweets = timeline.querySelectorAll('article');

    tweets.forEach(tweet => {
      try {
        // Look for the timestamp link which contains the tweet URL
        const timeLink = tweet.querySelector('time')?.closest('a');
        if (timeLink && this.isValidPostUrl(timeLink.href)) {
          urls.add(timeLink.href);
        }
      } catch (e) {
        console.error('Error extracting tweet URL:', e);
      }
    });

    return Array.from(urls);
  },

  isValidPostUrl(url) {
    try {
      const urlObj = new URL(url);
      return (urlObj.hostname === 'twitter.com' || urlObj.hostname === 'x.com') 
        && urlObj.pathname.match(/\/[^\/]+\/status\/\d+/)
        && !urlObj.pathname.includes('/analytics');
    } catch {
      return false;
    }
  },

  extractPostId(url) {
    const match = url.match(/\/status\/(\d+)/);
    return match ? match[1] : null;
  }
};