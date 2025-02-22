const TwitterAPI = {
  extractPostUrls() {
    const urls = new Set();

    // Find all article elements in the timeline
    const articles = document.querySelectorAll('article');

    articles.forEach(article => {
      try {
        // Find the timestamp link which contains the post URL
        const timeElement = article.querySelector('time');
        if (!timeElement) return;

        const linkElement = timeElement.closest('a');
        if (!linkElement) return;

        const url = linkElement.href;
        if (this.isValidPostUrl(url)) {
          urls.add(url);
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
      const isTwitterDomain = urlObj.hostname === 'twitter.com' || urlObj.hostname === 'x.com';
      const isStatusUrl = urlObj.pathname.match(/\/[^\/]+\/status\/\d+/);
      const isNotAnalytics = !urlObj.pathname.includes('/analytics');

      return isTwitterDomain && isStatusUrl && isNotAnalytics;
    } catch {
      return false;
    }
  }
};