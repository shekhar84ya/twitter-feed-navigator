let enabled = true;

// Check extension state
chrome.storage.local.get('enabled', (data) => {
  enabled = data.enabled;
  if (enabled) {
    console.log('Extension enabled, initializing...');
    setTimeout(initializeNavigation, 1000); // Delay initialization to ensure page is loaded
  }
});

// Listen for state changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) {
    enabled = changes.enabled.newValue;
    console.log('Extension state changed:', enabled);
    if (enabled) {
      setTimeout(initializeNavigation, 1000);
    }
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'FETCH_MORE_POSTS' && isHomePage()) {
    console.log('Fetching more posts...');
    cachePostsFromHome();
  }
});

// Cache posts from home page continuously
function cachePostsFromHome() {
  console.log('Attempting to cache posts from home');
  const posts = TwitterAPI.extractPostUrls();
  if (posts.length > 0) {
    console.log('Found posts to cache:', posts.length);
    chrome.runtime.sendMessage({
      type: 'CACHE_POSTS',
      posts: posts
    });
  }
}

// Initialize navigation on home page
function initializeNavigation() {
  console.log('Initializing navigation on page:', window.location.pathname);
  if (isHomePage()) {
    // Initial cache and periodic updates
    cachePostsFromHome();
    // Check for new posts every 3 seconds
    setInterval(cachePostsFromHome, 3000);
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

    // Try multiple potential injection points with more specific selectors
    const injectPoints = [
      document.querySelector('article[data-testid="tweet"]'),
      document.querySelector('[data-testid="tweet"]'),
      document.querySelector('[data-testid="tweetText"]')?.closest('article'),
      document.querySelector('[data-testid="cellInnerDiv"]')?.querySelector('article'),
      document.querySelector('div[data-testid="primaryColumn"]')?.querySelector('article'),
      // Try to find the main tweet container
      Array.from(document.querySelectorAll('article')).find(art => 
        art.querySelector('time') && art.querySelector('[data-testid="tweetText"]')
      )
    ].filter(Boolean);

    console.log('Found potential injection points:', injectPoints.length);

    for (const point of injectPoints) {
      if (point) {
        try {
          point.parentNode.insertBefore(buttonContainer, point);
          console.log('Successfully injected navigation buttons');
          return true;
        } catch (e) {
          console.error('Failed to inject at point:', e);
        }
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
      console.log(`Injection attempt ${attempts} failed, retrying...`);
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
    if (response && response.url) {
      window.location.href = response.url;
    }
  });
}

function handlePrevious() {
  chrome.runtime.sendMessage({ type: 'GET_PREV_POST' }, (response) => {
    if (response && response.url) {
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (enabled) {
    console.log('Extension enabled on DOMContentLoaded, initializing...');
    setTimeout(initializeNavigation, 1000);
  }
});

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
    console.log('Started observing DOM changes');
  } else {
    setTimeout(startObserving, 1000);
  }
};

startObserving();

// Automatically initialize on any navigation
const initialCheck = setInterval(() => {
  if (document.readyState === 'complete' && enabled) {
    console.log('Page fully loaded, ensuring initialization...');
    initializeNavigation();
    clearInterval(initialCheck);
  }
}, 1000);