"use strict";
const browser = {
    name: null,
    version: null,
    os: null,
    osVersion: null,
    touch: false,
    mobile: false,
    canUse(feature) {
        const div = document.createElement('div');
        const style = div.style;
        if (feature in style) {
            return true;
        }
        const prefixes = ['Moz', 'Webkit', 'O', 'ms'];
        const capitalizedFeature = feature.charAt(0).toUpperCase() + feature.slice(1);
        return prefixes.some(prefix => `${prefix}${capitalizedFeature}` in style);
    }
};
function initBrowserDetection() {
    const ua = navigator.userAgent;
    const browserPatterns = [
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
    const osPatterns = [
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
    browser.touch = ('ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0);
    const mobilePatterns = [
        /iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone|IEMobile/
    ];
    browser.mobile = mobilePatterns.some(pattern => ua.match(pattern));
}
initBrowserDetection();
