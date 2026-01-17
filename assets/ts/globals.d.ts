/**
 * Global type declarations for third-party libraries loaded in the page
 */

interface EXIFLibrary {
  getData: (img: HTMLImageElement, callback: () => void) => void;
  getTag: (img: HTMLImageElement, tag: string) => string | undefined;
}

interface IconsLibrary {
  [key: string]: string;
}

declare global {
  interface Window {
    EXIF?: EXIFLibrary;
    icons?: IconsLibrary;
  }
}

export {};
