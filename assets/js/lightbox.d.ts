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
