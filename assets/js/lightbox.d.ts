interface ExifConfig {
    [key: string]: {
        tag: string;
        icon: string;
    };
}
interface ExifData {
    [imageName: string]: string;
}
declare class DialogLightbox {
    private selector;
    private dialog;
    private currentImageIndex;
    private images;
    private exifDatas;
    private exifConfig;
    private isTransitioning;
    private currentScale;
    private initialDistance;
    private lastScale;
    private translateX;
    private translateY;
    private lastTranslateX;
    private lastTranslateY;
    private isPinching;
    private lastTouchX;
    private lastTouchY;
    private maxZoom;
    constructor(selector: string);
    private init;
    private createDialog;
    private attachTouchHandlers;
    private getTouchDistance;
    private applyTransform;
    private updateImageSizesForZoom;
    private resetZoom;
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
