// Global state
let enabled = true;
let observer = null;

// Initialize extension state
chrome.storage.local.get('enabled', (data) => {
  enabled = data.enabled ?? true;
  if (enabled) {
    initializeExtension();
  }
});

// Listen for state changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) {
    enabled = changes.enabled.newValue;
    if (enabled) {
      initializeExtension();
    } else {
      cleanup();
    }
  }
});

function initializeExtension() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupExtension);
  } else {
    setupExtension();
  }
}

function setupExtension() {
  if (!enabled) return;

  // Setup mutation observer for dynamic content
  setupObserver();

  // Initial setup based on current page
  handlePageSetup();
}

function setupObserver() {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver(() => {
    handlePageSetup();
  });

  // Start observing once main content is available
  const mainContent = document.querySelector('[data-testid="primaryColumn"]');
  if (mainContent) {
    observer.observe(mainContent, { childList: true, subtree: true });
  }
}

function handlePageSetup() {
  if (isHomePage()) {
    extractAndCachePosts();
  } else if (isPostPage()) {
    injectNavigationButtons();
  }
}

function extractAndCachePosts() {
  const posts = TwitterAPI.extractPostUrls();
  if (posts.length > 0) {
    chrome.runtime.sendMessage({
      type: 'CACHE_POSTS',
      posts: posts
    });
  }
}

function injectNavigationButtons() {
  // Remove existing buttons if any
  const existing = document.querySelector('.tfn-nav-buttons');
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.className = 'tfn-nav-buttons';

  const prevButton = document.createElement('button');
  prevButton.className = 'tfn-nav-button';
  prevButton.textContent = 'Previous';
  prevButton.onclick = navigateToPrevious;

  const nextButton = document.createElement('button');
  nextButton.className = 'tfn-nav-button';
  nextButton.textContent = 'Next';
  nextButton.onclick = navigateToNext;

  container.appendChild(prevButton);
  container.appendChild(nextButton);

  // Try to inject buttons at the top of the main content
  const mainColumn = document.querySelector('[data-testid="primaryColumn"]');
  const article = mainColumn?.querySelector('article');
  if (article) {
    article.parentNode.insertBefore(container, article);
  }
}

function navigateToNext() {
  chrome.runtime.sendMessage({ type: 'GET_NEXT_POST' }, (response) => {
    if (response?.url) {
      window.location.href = response.url;
    }
  });
}

function navigateToPrevious() {
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
    navigateToNext();
  } else if (e.key === 'ArrowLeft') {
    navigateToPrevious();
  }
});

function cleanup() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  const buttons = document.querySelector('.tfn-nav-buttons');
  if (buttons) {
    buttons.remove();
  }
}

function isHomePage() {
  return window.location.pathname === '/home';
}

function isPostPage() {
  return window.location.pathname.includes('/status/');
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'FETCH_MORE_POSTS' && isHomePage()) {
    extractAndCachePosts();
  }
});


// Start initialization
initializeExtension();