// Cache management
let postCache = [];
let currentPostIndex = -1;
const MAX_CACHE_SIZE = 10;
const LOW_CACHE_THRESHOLD = 3;

// Initialize extension state
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ enabled: true });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'CACHE_POSTS':
      handleCachePosts(request.posts, sender.tab.id, sendResponse);
      break;
    case 'GET_NEXT_POST':
      handleGetNextPost(sendResponse);
      break;
    case 'GET_PREV_POST':
      handleGetPrevPost(sendResponse);
      break;
    case 'GET_CACHE_STATUS':
      handleGetCacheStatus(sendResponse);
      break;
  }
  return true; // Keep message channel open for async response
});

function handleCachePosts(newPosts, tabId, sendResponse) {
  // Filter out duplicate posts
  const uniqueNewPosts = newPosts.filter(url => !postCache.includes(url));

  if (uniqueNewPosts.length > 0) {
    // Add new posts while maintaining maximum cache size
    postCache = [...postCache, ...uniqueNewPosts].slice(-MAX_CACHE_SIZE);

    // If this is the first batch of posts, set the index and navigate
    if (currentPostIndex === -1 && postCache.length > 0) {
      currentPostIndex = 0;
      // Navigate to first post automatically
      chrome.tabs.update(tabId, { url: postCache[0] });
    }
  }

  sendResponse({ success: true, cacheSize: postCache.length });
}

function handleGetNextPost(sendResponse) {
  if (currentPostIndex < postCache.length - 1) {
    currentPostIndex++;
    sendResponse({ url: postCache[currentPostIndex] });

    // Check if we need to fetch more posts
    const remainingPosts = postCache.length - currentPostIndex - 1;
    if (remainingPosts < LOW_CACHE_THRESHOLD) {
      requestMorePosts();
    }
  } else {
    sendResponse({ url: null });
  }
}

function handleGetPrevPost(sendResponse) {
  if (currentPostIndex > 0) {
    currentPostIndex--;
    sendResponse({ url: postCache[currentPostIndex] });
  } else {
    sendResponse({ url: null });
  }
}

function handleGetCacheStatus(sendResponse) {
  sendResponse({
    total: postCache.length,
    current: currentPostIndex,
    remaining: postCache.length - currentPostIndex - 1
  });
}

function requestMorePosts() {
  chrome.tabs.query({ url: ['*://twitter.com/*', '*://x.com/*'] }, (tabs) => {
    tabs.forEach(tab => {
      if (tab.url.includes('/home')) {
        chrome.tabs.sendMessage(tab.id, { type: 'FETCH_MORE_POSTS' });
      }
    });
  });
}

// Reset cache when navigating to home
chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.url.match(/https:\/\/(twitter|x)\.com\/home/)) {
    postCache = [];
    currentPostIndex = -1;
  }
}, {
  url: [
    { hostEquals: 'twitter.com' },
    { hostEquals: 'x.com' }
  ]
});