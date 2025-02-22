// Cache management
let postCache = [];
let currentPostIndex = -1;
const LOW_CACHE_THRESHOLD = 5; // Trigger new post fetching when less than 5 posts remain ahead
const MAX_CACHE_SIZE = 50; // Keep a reasonable number of posts in cache

// Initialize extension state
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ enabled: true });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'CACHE_POSTS':
      console.log('Received new posts to cache:', request.posts.length);
      // Merge new posts with existing cache, avoiding duplicates
      const newPosts = request.posts.filter(url => !postCache.includes(url));
      if (newPosts.length > 0) {
        // Add new posts while maintaining maximum cache size
        postCache = [...postCache, ...newPosts].slice(-MAX_CACHE_SIZE);
        console.log('Updated cache size:', postCache.length);
        // If this is the first batch of posts, set the index
        if (currentPostIndex === -1) {
          currentPostIndex = 0;
        }
      }
      sendResponse({ success: true, cacheSize: postCache.length });
      break;

    case 'GET_NEXT_POST':
      if (currentPostIndex < postCache.length - 1) {
        currentPostIndex++;
        const remainingPosts = postCache.length - currentPostIndex - 1;
        console.log('Remaining posts in cache:', remainingPosts);

        // If we're running low on cached posts ahead, notify content script
        if (remainingPosts < LOW_CACHE_THRESHOLD) {
          console.log('Cache running low, requesting more posts');
          // Notify any active Twitter tabs to fetch more posts
          chrome.tabs.query({ url: ['*://twitter.com/*', '*://x.com/*'] }, (tabs) => {
            tabs.forEach(tab => {
              if (tab.url.includes('/home')) {
                chrome.tabs.sendMessage(tab.id, { type: 'FETCH_MORE_POSTS' });
              }
            });
          });
        }

        sendResponse({ url: postCache[currentPostIndex] });
      } else {
        sendResponse({ url: null });
      }
      break;

    case 'GET_PREV_POST':
      if (currentPostIndex > 0) {
        currentPostIndex--;
        sendResponse({ url: postCache[currentPostIndex] });
      } else {
        sendResponse({ url: null });
      }
      break;

    case 'GET_CACHE_STATUS':
      sendResponse({
        total: postCache.length,
        current: currentPostIndex,
        remaining: postCache.length - currentPostIndex - 1
      });
      break;
  }
  return true;
});

// Reset cache when navigating to home
chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.url.match(/https:\/\/(twitter|x)\.com\/home/)) {
    postCache = [];
    currentPostIndex = -1;
    console.log('Cache reset on home page navigation');
  }
}, {
  url: [
    { hostEquals: 'twitter.com' },
    { hostEquals: 'x.com' }
  ]
});