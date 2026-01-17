/**
 * Custom SVG Icon System
 * Generates inline SVG icons dynamically
 */

const icons = {
    'camera-retro': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="11" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M 7 8 L 7 2 Q 7 1.5 7.5 1.5 L 16.5 1.5 Q 17 1.5 17 2 L 17 8" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="13.5" r="3.5" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="17.5" y="9.5" width="2" height="1.2" fill="currentColor" rx="0.2"/><circle cx="18.5" cy="7" r="0.4" fill="currentColor"/></svg>',
    'video': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="5" r="3.2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="12" cy="18" r="2" fill="none" stroke="currentColor" stroke-width="1"/><line x1="12" y1="3" x2="12" y2="1.5" stroke="currentColor" stroke-width="0.6"/><path d="M 14.2 5.5 Q 15.5 6.5 15.5 8" fill="none" stroke="currentColor" stroke-width="0.7"/><path d="M 9.8 5.5 Q 8.5 6.5 8.5 8" fill="none" stroke="currentColor" stroke-width="0.7"/></svg>',
    'dot-circle': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="3" fill="currentColor"/><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    'signal': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M3 18h2v-2H3v2zm4-6H5v4h2v-4zm4-6H9v10h2V6zm4-2h-2v12h2V4zm4 2h-2v8h2V6z"/></svg>',
    'clock': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="7" x2="12" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="12" x2="15" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    'info-circle': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path fill="currentColor" d="M11 7h2v2h-2V7zm0 4h2v6h-2v-6z"/></svg>',
    'facebook': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    'twitter': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M23.953 4.57a10 10 0 01-2.856 2.905c.052 1.05.052 2.1 0 3.15-1.854 5.74-6.846 9.697-13.095 9.697-2.6 0-5.04-.66-7.165-1.82.34.04.68.06 1.02.06 2.19 0 4.2-.71 5.86-1.9-2.04-.04-3.86-1.38-4.46-3.25.3.04.6.08.92.08.43 0 .85-.05 1.25-.15-2.13-.44-3.75-2.3-3.75-4.53 0-.02 0-.04 0-.07.63.37 1.35.58 2.12.6-1.26-.84-2.09-2.28-2.09-3.89 0-.86.23-1.66.63-2.35 2.29 2.82 5.71 4.67 9.54 4.87-.08-.34-.12-.7-.12-1.06 0-2.56 2.08-4.64 4.64-4.64 1.33 0 2.54.56 3.39 1.45 1.06-.21 2.06-.6 2.96-1.14-.35 1.09-.1 2.08.57 2.68.78-.08 1.53-.3 2.23-.58-.52.78-1.18 1.49-1.94 2.04z"/></svg>',
    'instagram': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="2.165" y="2.165" width="19.67" height="19.67" rx="4.244" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="18.406" cy="5.594" r="0.906" fill="currentColor"/></svg>',
    'github': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>',
    'linkedin': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="4.983" cy="5.009" r="2.188" fill="currentColor"/><path fill="currentColor" d="M9.237 8.855c0 1.13.029 2.26 0 3.39-.04 1.13-.323 2.268-.755 3.401-.178.512-.486 1.044-1.054 1.256-.56.212-1.366.05-1.633-.505-.267-.556 0-1.444.088-2.034.176-.967.361-1.933.537-2.899.15-.821.3-1.645.45-2.469H6.55l1.686.001v-.001zm11.11-.15c1.105.033 2.21.066 3.315.1 0 2.75-.833 5.499-2.5 8.248v-5.698c0-.968 0-1.937.001-2.906V8.705z"/></svg>',
    'flickr': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="6" cy="12" r="3" fill="currentColor"/><circle cx="18" cy="12" r="3" fill="currentColor"/></svg>',
    'dribbble': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><path fill="none" stroke="currentColor" stroke-width="1.5" d="M8.56 2.75c3.61 6.43 6.87 12.68 10.24 19.06"/><path fill="none" stroke="currentColor" stroke-width="1.5" d="M5.75 10.5c5.4 3.61 12.68 6.87 19.06 10.24"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>'
};

// Make icons globally accessible
window.icons = icons;

// Inject icons on page load for elements with data-icon attribute
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('[data-icon]').forEach(function(el) {
        const iconName = el.getAttribute('data-icon');
        let svgString = window.icons[iconName];
        if (svgString) {
            // Add icon-inline class for non-brand icons (navigation, EXIF data)
            if (!el.classList.contains('brands')) {
                svgString = svgString.replace('<svg', '<svg class="icon-inline"');
            }
            el.insertAdjacentHTML('afterbegin', svgString);
        }
    });
});

/**
 * Get an SVG icon by name
 */
function getIcon(name) {
    return icons[name] || '';
}

/**
 * Create an icon element
 */
function createIconElement(name) {
    const svg = getIcon(name);
    if (!svg) return '';
    const span = document.createElement('span');
    span.className = 'icon-inline';
    span.innerHTML = svg;
    return span;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getIcon, createIconElement };
}
