let enabled = true;

// Check extension state
chrome.storage.local.get('enabled', (data) => {
  enabled = data.enabled ?? true;
});

// Listen for state changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) {
    enabled = changes.enabled.newValue;
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'FETCH_MORE_POSTS' && isHomePage()) {
    cachePostsFromHome();
  }
});

// Cache posts from home page
function cachePostsFromHome() {
  const posts = TwitterAPI.extractPostUrls();
  if (posts.length > 0) {
    chrome.runtime.sendMessage({
      type: 'CACHE_POSTS',
      posts: posts
    });
  }
}

// Initialize navigation
function initializeNavigation() {
  if (!enabled) return;

  if (isHomePage()) {
    cachePostsFromHome();
    // Periodically check for new posts
    setInterval(cachePostsFromHome, 3000);
  } else if (isPostPage()) {
    tryInjectButtons();
  }
}

// Create navigation buttons
function createNavButton(text, handler) {
  const button = document.createElement('button');
  button.className = 'tfn-nav-button';
  button.textContent = text;
  button.addEventListener('click', handler);
  return button;
}

// Try to inject buttons with retry mechanism
function tryInjectButtons() {
  const existingButtons = document.querySelector('.tfn-nav-buttons');
  if (existingButtons) return;

  const container = document.createElement('div');
  container.className = 'tfn-nav-buttons';
  container.appendChild(createNavButton('Previous', handlePrevious));
  container.appendChild(createNavButton('Next', handleNext));

  const mainColumn = document.querySelector('[data-testid="primaryColumn"]');
  const article = mainColumn?.querySelector('article');

  if (article) {
    try {
      article.parentNode.insertBefore(container, article);
    } catch (e) {
      console.error('Failed to inject buttons:', e);
    }
  }
}

// Navigation handlers
function handleNext() {
  chrome.runtime.sendMessage({ type: 'GET_NEXT_POST' }, (response) => {
    if (response?.url) {
      window.location.href = response.url;
    }
  });
}

function handlePrevious() {
  chrome.runtime.sendMessage({ type: 'GET_PREV_POST' }, (response) => {
    if (response?.url) {
      window.location.href = response.url;
    }
  });
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (!enabled) return;

  if (e.key === 'ArrowRight') {
    handleNext();
  } else if (e.key === 'ArrowLeft') {
    handlePrevious();
  }
});

// Helper functions
function isHomePage() {
  return window.location.pathname === '/home';
}

function isPostPage() {
  return window.location.pathname.includes('/status/');
}

// Initialize after Twitter's content has loaded
let initAttempts = 0;
const maxAttempts = 10;

function waitForTwitterContent() {
  if (!enabled || initAttempts >= maxAttempts) return;

  const mainContent = document.querySelector('[data-testid="primaryColumn"]');
  if (mainContent) {
    initializeNavigation();
    // Observe for dynamic content changes
    new MutationObserver(() => {
      if (isPostPage()) {
        tryInjectButtons();
      }
    }).observe(mainContent, { childList: true, subtree: true });
  } else {
    initAttempts++;
    setTimeout(waitForTwitterContent, 1000);
  }
}

// Start initialization after page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForTwitterContent);
} else {
  waitForTwitterContent();
}