let enabled = true;

// Check extension state
chrome.storage.local.get('enabled', (data) => {
  enabled = data.enabled;
});

// Listen for state changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) {
    enabled = changes.enabled.newValue;
    if (enabled && isHomePage()) {
      initializeNavigation();
    }
  }
});

// Cache posts from home page continuously
function cachePostsFromHome() {
  const posts = TwitterAPI.extractPostUrls();
  if (posts.length > 0) {
    chrome.runtime.sendMessage({
      type: 'CACHE_POSTS',
      posts: posts
    });
  }
}

// Initialize navigation on home page
function initializeNavigation() {
  if (isHomePage()) {
    // Initial cache and periodic updates
    cachePostsFromHome();
    setInterval(cachePostsFromHome, 5000); // Check for new posts every 5 seconds
  } else if (isPostPage()) {
    injectNavigationButtons();
  }
}

// Inject navigation buttons with retry mechanism and improved logging
function injectNavigationButtons() {
  console.log('Attempting to inject navigation buttons');
  const inject = () => {
    // Remove existing buttons if any
    const existingButtons = document.querySelector('.tfn-nav-buttons');
    if (existingButtons) {
      existingButtons.remove();
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'tfn-nav-buttons';

    const prevButton = createNavButton('Previous', handlePrevious);
    const nextButton = createNavButton('Next', handleNext);

    buttonContainer.appendChild(prevButton);
    buttonContainer.appendChild(nextButton);

    // Try multiple potential injection points
    const injectPoints = [
      document.querySelector('article[data-testid="tweet"]'),
      document.querySelector('[data-testid="tweet"]'),
      document.querySelector('[data-testid="tweetText"]')?.closest('article'),
      document.querySelector('[data-testid="cellInnerDiv"]')?.querySelector('article')
    ];

    console.log('Found injection points:', injectPoints.filter(Boolean).length);

    for (const point of injectPoints) {
      if (point) {
        point.parentNode.insertBefore(buttonContainer, point.nextSibling);
        console.log('Successfully injected navigation buttons');
        return true;
      }
    }
    console.log('Failed to find suitable injection point');
    return false;
  };

  // Retry injection a few times if it fails
  let attempts = 0;
  const tryInject = () => {
    if (!inject() && attempts < 5) {
      attempts++;
      setTimeout(tryInject, 1000);
    }
  };
  tryInject();
}

function createNavButton(text, handler) {
  const button = document.createElement('button');
  button.className = 'tfn-nav-button';
  button.textContent = text;
  button.addEventListener('click', handler);
  return button;
}

// Navigation handlers
function handleNext() {
  chrome.runtime.sendMessage({ type: 'GET_NEXT_POST' }, (response) => {
    if (response.url) {
      window.location.href = response.url;
    }
  });
}

function handlePrevious() {
  chrome.runtime.sendMessage({ type: 'GET_PREV_POST' }, (response) => {
    if (response.url) {
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

// Initialize on page load
if (enabled) {
  initializeNavigation();
}

// Re-inject buttons when Twitter updates its DOM
const observer = new MutationObserver((mutations) => {
  if (enabled && isPostPage()) {
    injectNavigationButtons();
  }
});

// Start observing once the main content area is available
const startObserving = () => {
  const mainContent = document.querySelector('main');
  if (mainContent) {
    observer.observe(mainContent, { childList: true, subtree: true });
  } else {
    setTimeout(startObserving, 1000);
  }
};

startObserving();