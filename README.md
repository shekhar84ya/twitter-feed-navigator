# Twitter Feed Navigator Chrome Extension

A Chrome extension that enables single-post navigation through Twitter's feed using next/previous controls.

## Installation Instructions

1. Download or clone this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the directory containing these extension files
5. The extension icon should appear in your Chrome toolbar
6. Visit Twitter (https://twitter.com or https://x.com) and the extension will automatically activate

## Features

- Single-post navigation through Twitter's feed
- "Next" and "Previous" buttons for easy navigation
- Keyboard shortcuts (left/right arrow keys)
- Post caching for smooth browsing experience
- Twitter-native UI design integration
- Enable/disable toggle in extension popup

## Development and Testing

### Testing the Extension
1. After loading the extension, visit Twitter
2. The extension should:
   - Auto-open the first post when visiting the home feed
   - Show navigation buttons on post pages
   - Allow navigation using arrow keys
   - Display cached post count in the popup

### Debugging Tips
- Use Chrome DevTools (F12) to view console logs
- Check the "Errors" button in chrome://extensions/ for any loading issues
- Review the "Background page" option in chrome://extensions/ for background script logs

## Files Structure

- `manifest.json`: Extension configuration and permissions
- `background.js`: Post caching and navigation logic
- `content.js`: Twitter page integration and UI injection
- `twitter-api.js`: Twitter-specific DOM operations
- `popup.html/js`: Extension popup interface
- `styles.css`: Twitter-matched UI styling
- `icons/*`: Extension icons

## Contributing

1. Fork the repository
2. Make your changes
3. Test thoroughly on Twitter
4. Submit a pull request

## License

MIT License - feel free to use and modify for your needs.