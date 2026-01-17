interface ExifConfig {
    [key: string]: {
        tag: string;
        icon: string;
    };
}
interface ExifData {
    [imageName: string]: string;
}
interface EXIFLibrary {
    getData: (img: HTMLImageElement, callback: () => void) => void;
    getTag: (img: HTMLImageElement, tag: string) => string | undefined;
}
interface IconsLibrary {
    [key: string]: string;
}
declare class DialogLightbox {
    private selector;
    private dialog;
    private currentImageIndex;
    private images;
    private exifDatas;
    private exifConfig;
    private isTransitioning;
    constructor(selector: string);
    private init;
    private createDialog;
    private attachThumbnailListeners;
    private attachKeyboardListeners;
    private openAt;
    private showImage;
    private loadExifFromImage;
    private getExifDataMarkup;
    private getIconSvg;
    private nextImage;
    private previousImage;
    private fadeToImage;
    private prefetchAdjacentImages;
    private adjustDialogSize;
    private close;
}
