interface BrowserInfo {
    name: string | null;
    version: number | null;
    os: string | null;
    osVersion: number | null;
    touch: boolean;
    mobile: boolean;
    canUse: (feature: string) => boolean;
}
declare const browser: BrowserInfo;
declare function initBrowserDetection(): void;
