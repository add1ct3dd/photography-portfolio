/**
 * Browser detection using feature detection instead of UA sniffing
 * Provides modern, reliable browser capability detection
 */

interface BrowserInfo {
  name: string | null;
  version: number | null;
  os: string | null;
  osVersion: number | null;
  touch: boolean;
  mobile: boolean;
  canUse: (feature: string) => boolean;
}

const browser: BrowserInfo = {
  name: null,
  version: null,
  os: null,
  osVersion: null,
  touch: false,
  mobile: false,

  /**
   * Check if browser supports a specific CSS feature
   */
  canUse(feature: string): boolean {
    const div = document.createElement('div');
    const style = div.style;

    // Direct property check
    if (feature in style) {
      return true;
    }

    // Vendor prefixes
    const prefixes = ['Moz', 'Webkit', 'O', 'ms'];
    const capitalizedFeature = feature.charAt(0).toUpperCase() + feature.slice(1);

    return prefixes.some(prefix => `${prefix}${capitalizedFeature}` in style);
  }
};

/**
 * Initialize browser detection
 */
function initBrowserDetection(): void {
  const ua = navigator.userAgent;

  // Detect browser from UA (fallback for older detection needs)
  const browserPatterns: Array<[string, RegExp]> = [
    ['firefox', /Firefox\/([0-9.]+)/],
    ['opera', /OPR\/([0-9.]+)/],
    ['edge', /Edg(?:e)?\/([0-9.]+)/],
    ['safari', /Version\/([0-9.]+).+Safari/],
    ['chrome', /Chrome\/([0-9.]+)/],
    ['ie', /MSIE ([0-9]+)|Trident\/.+rv:([0-9]+)/]
  ];

  for (const [name, pattern] of browserPatterns) {
    const match = ua.match(pattern);
    if (match) {
      browser.name = name;
      browser.version = parseFloat(match[1] || match[2] || '0');
      break;
    }
  }

  if (!browser.name) {
    browser.name = 'other';
  }

  // Detect OS
  const osPatterns: Array<[string, RegExp]> = [
    ['ios', /iPhone|iPad|iPod/],
    ['android', /Android/],
    ['mac', /Macintosh|Mac OS X/],
    ['windows', /Windows NT/],
    ['linux', /Linux/],
  ];

  for (const [name, pattern] of osPatterns) {
    if (ua.match(pattern)) {
      browser.os = name;
      break;
    }
  }

  if (!browser.os) {
    browser.os = 'other';
  }

  // Detect touch capability
  browser.touch = (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as unknown as { msMaxTouchPoints: number }).msMaxTouchPoints > 0
  );

  // Detect mobile
  const mobilePatterns = [
    /iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone|IEMobile/
  ];

  browser.mobile = mobilePatterns.some(pattern => ua.match(pattern));
}

// Initialize on load
initBrowserDetection();
