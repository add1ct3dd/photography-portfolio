"use strict";
class DialogLightbox {
    constructor(selector) {
        this.selector = selector;
        this.dialog = null;
        this.currentImageIndex = 0;
        this.images = [];
        this.exifDatas = {};
        this.exifConfig = {};
        this.isTransitioning = false;
        this.currentScale = 1;
        this.initialDistance = 0;
        this.lastScale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.lastTranslateX = 0;
        this.lastTranslateY = 0;
        this.isPinching = false;
        this.lastTouchX = 0;
        this.lastTouchY = 0;
        this.init();
    }
    init() {
        this.images = Array.from(document.querySelectorAll(this.selector));
        if (this.images.length === 0) {
            return;
        }
        const mainElement = document.getElementById("main");
        if (mainElement && mainElement.dataset.exif) {
            try {
                this.exifConfig = JSON.parse(mainElement.dataset.exif);
            }
            catch {
                void 0;
            }
        }
        this.createDialog();
        this.attachThumbnailListeners();
        this.attachKeyboardListeners();
    }
    createDialog() {
        this.dialog = document.createElement("dialog");
        this.dialog.className = "lightbox-dialog";
        this.dialog.innerHTML = `
      <div class="lightbox-content">
        <div class="lightbox-image-container">
          <img class="lightbox-image" src="" alt="Full size image" />
        </div>
        <div class="lightbox-info">
          <div class="lightbox-exif"></div>
        </div>
        <button class="lightbox-close" aria-label="Close lightbox" type="button">
          <span aria-hidden="true">&times;</span>
        </button>
        <button class="lightbox-prev" aria-label="Previous image" type="button">
          <span aria-hidden="true">&#8249;</span>
        </button>
        <button class="lightbox-next" aria-label="Next image" type="button">
          <span aria-hidden="true">&#8250;</span>
        </button>
      </div>
    `;
        document.body.appendChild(this.dialog);
        const closeBtn = this.dialog.querySelector(".lightbox-close");
        const prevBtn = this.dialog.querySelector(".lightbox-prev");
        const nextBtn = this.dialog.querySelector(".lightbox-next");
        closeBtn.addEventListener("click", () => this.close());
        prevBtn.addEventListener("click", () => this.previousImage());
        nextBtn.addEventListener("click", () => this.nextImage());
        this.dialog.addEventListener("click", (event) => {
            if (event.target === this.dialog) {
                this.close();
            }
        });
        this.attachTouchHandlers();
    }
    attachTouchHandlers() {
        const imageContainer = this.dialog?.querySelector(".lightbox-image-container");
        const image = this.dialog?.querySelector(".lightbox-image");
        if (!imageContainer || !image)
            return;
        const handleTouchStart = (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                e.stopPropagation();
                this.isPinching = true;
                this.initialDistance = this.getTouchDistance(e.touches);
                this.lastScale = this.currentScale;
            }
            else if (e.touches.length === 1 && this.currentScale > 1) {
                e.preventDefault();
                this.lastTouchX = e.touches[0].clientX;
                this.lastTouchY = e.touches[0].clientY;
                this.lastTranslateX = this.translateX;
                this.lastTranslateY = this.translateY;
            }
        };
        const handleTouchMove = (e) => {
            if (e.touches.length === 2 && this.isPinching) {
                e.preventDefault();
                e.stopPropagation();
                const currentDistance = this.getTouchDistance(e.touches);
                const scale = (currentDistance / this.initialDistance) * this.lastScale;
                this.currentScale = Math.min(Math.max(scale, 1), 8);
                this.applyTransform(image);
            }
            else if (e.touches.length === 1 && this.currentScale > 1) {
                e.preventDefault();
                const deltaX = e.touches[0].clientX - this.lastTouchX;
                const deltaY = e.touches[0].clientY - this.lastTouchY;
                this.translateX = this.lastTranslateX + deltaX;
                this.translateY = this.lastTranslateY + deltaY;
                this.applyTransform(image);
            }
        };
        const handleTouchEnd = (_e) => {
            if (_e.touches.length < 2) {
                this.isPinching = false;
            }
            if (this.currentScale <= 1) {
                this.resetZoom(image);
            }
        };
        imageContainer.addEventListener("touchstart", handleTouchStart, { passive: false });
        imageContainer.addEventListener("touchmove", handleTouchMove, { passive: false });
        imageContainer.addEventListener("touchend", handleTouchEnd, { passive: false });
        image.addEventListener("touchstart", handleTouchStart, { passive: false });
        image.addEventListener("touchmove", handleTouchMove, { passive: false });
        image.addEventListener("touchend", handleTouchEnd, { passive: false });
        if ('GestureEvent' in window) {
            imageContainer.addEventListener("gesturestart", (e) => {
                e.preventDefault();
                this.lastScale = this.currentScale;
            }, { passive: false });
            imageContainer.addEventListener("gesturechange", (e) => {
                e.preventDefault();
                const gestureEvent = e;
                const newScale = this.lastScale * gestureEvent.scale;
                this.currentScale = Math.min(Math.max(newScale, 1), 8);
                this.applyTransform(image);
            }, { passive: false });
            imageContainer.addEventListener("gestureend", () => {
                if (this.currentScale <= 1) {
                    this.resetZoom(image);
                }
            }, { passive: false });
        }
        let lastTap = 0;
        const handleDoubleTap = (e) => {
            if (e.touches.length === 0 && e.changedTouches.length === 1) {
                const now = Date.now();
                if (now - lastTap < 300) {
                    e.preventDefault();
                    if (this.currentScale > 1) {
                        this.resetZoom(image);
                    }
                    else {
                        const rect = imageContainer.getBoundingClientRect();
                        const tapX = e.changedTouches[0].clientX - rect.left;
                        const tapY = e.changedTouches[0].clientY - rect.top;
                        const centerX = rect.width / 2;
                        const centerY = rect.height / 2;
                        this.currentScale = 3;
                        this.translateX = (centerX - tapX) * 2;
                        this.translateY = (centerY - tapY) * 2;
                        this.applyTransform(image);
                    }
                }
                lastTap = now;
            }
        };
        imageContainer.addEventListener("touchend", handleDoubleTap, { passive: false });
        image.addEventListener("touchend", handleDoubleTap, { passive: false });
    }
    getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    applyTransform(image) {
        image.style.transform = `translate3d(${this.translateX}px, ${this.translateY}px, 0) scale(${this.currentScale})`;
        this.updateImageSizesForZoom(image);
    }
    updateImageSizesForZoom(image) {
        const baseSize = window.innerWidth <= 768 ? 95 : 90;
        const effectiveSize = Math.min(baseSize * this.currentScale, 100 * 8);
        image.sizes = `${effectiveSize}vw`;
    }
    resetZoom(image) {
        this.currentScale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.lastScale = 1;
        this.lastTranslateX = 0;
        this.lastTranslateY = 0;
        image.style.transform = "translate3d(0, 0, 0) scale(1)";
        image.sizes = "(max-width: 768px) 95vw, 90vw";
    }
    attachThumbnailListeners() {
        this.images.forEach((link, index) => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                this.openAt(index);
            });
        });
    }
    attachKeyboardListeners() {
        document.addEventListener("keydown", (event) => {
            if (!this.dialog || !this.dialog.open)
                return;
            switch (event.key) {
                case "Escape":
                    this.close();
                    break;
                case "ArrowLeft":
                    this.previousImage();
                    break;
                case "ArrowRight":
                    this.nextImage();
                    break;
            }
        });
    }
    openAt(index) {
        if (index < 0 || index >= this.images.length)
            return;
        this.currentImageIndex = index;
        this.showImage();
        if (this.dialog) {
            this.dialog.showModal();
            document.body.classList.add("modal-active");
        }
    }
    showImage() {
        const link = this.images[this.currentImageIndex];
        const thumbImg = link.querySelector("img");
        const imgName = thumbImg?.dataset.name || "";
        const baseName = imgName.replace(/\.[^.]+$/, '');
        const imageElement = this.dialog?.querySelector(".lightbox-image");
        const exifContainer = this.dialog?.querySelector(".lightbox-exif");
        if (imageElement && exifContainer) {
            this.resetZoom(imageElement);
            const shouldShowLoadingMessage = window.innerWidth > 737;
            if (shouldShowLoadingMessage) {
                exifContainer.innerHTML = '<p>Loading metadata...</p>';
            }
            else {
                exifContainer.innerHTML = '';
            }
            imageElement.style.opacity = "0";
            imageElement.srcset = `
        /images/fulls/avif/${baseName}-600w.avif 600w,
        /images/fulls/webp/${baseName}-600w.webp 600w,
        /images/fulls/${baseName}-600w.jpg 600w,
        /images/fulls/avif/${baseName}-1200w.avif 1200w,
        /images/fulls/webp/${baseName}-1200w.webp 1200w,
        /images/fulls/${baseName}-1200w.jpg 1200w,
        /images/fulls/avif/${baseName}-2400w.avif 2400w,
        /images/fulls/webp/${baseName}-2400w.webp 2400w,
        /images/fulls/${baseName}-2400w.jpg 2400w,
        /images/fulls/avif/${baseName}-3440w.avif 3440w,
        /images/fulls/webp/${baseName}-3440w.webp 3440w,
        /images/fulls/${baseName}-3440w.jpg 3440w
      `;
            imageElement.sizes = "(max-width: 768px) 95vw, 90vw";
            imageElement.src = `/images/fulls/${baseName}-3440w.jpg`;
            imageElement.alt = thumbImg?.alt || "Full size image";
            imageElement.decoding = "async";
            imageElement.onload = () => {
                this.adjustDialogSize(imageElement);
                requestAnimationFrame(() => {
                    imageElement.style.opacity = "1";
                });
            };
            imageElement.onerror = () => {
                requestAnimationFrame(() => {
                    imageElement.style.opacity = "1";
                });
            };
            setTimeout(() => {
                const currentLink = this.images[this.currentImageIndex];
                const currentThumbImg = currentLink.querySelector("img");
                const currentImgName = currentThumbImg?.dataset.name || "";
                if (currentImgName === imgName) {
                    this.loadExifFromImage(imageElement, imgName, exifContainer);
                }
            }, 100);
        }
        const prevBtn = this.dialog?.querySelector(".lightbox-prev");
        const nextBtn = this.dialog?.querySelector(".lightbox-next");
        if (prevBtn)
            prevBtn.disabled = this.currentImageIndex === 0;
        if (nextBtn)
            nextBtn.disabled = this.currentImageIndex === this.images.length - 1;
    }
    loadExifFromImage(img, imgName, container) {
        if (!window.EXIF) {
            container.innerHTML = "<p>View on Flickr</p>";
            return;
        }
        try {
            if (img && img.src) {
                const tempImg = new Image();
                tempImg.onload = () => {
                    window.EXIF?.getData(tempImg, () => {
                        const markup = this.getExifDataMarkup(tempImg, imgName);
                        this.exifDatas[imgName] = markup;
                        container.innerHTML = markup;
                    });
                };
                tempImg.onerror = () => {
                    container.innerHTML = "<p>View on Flickr</p>";
                };
                tempImg.src = img.src;
            }
            else {
                container.innerHTML = "<p>View on Flickr</p>";
            }
        }
        catch {
            container.innerHTML = "<p>View on Flickr</p>";
        }
    }
    getExifDataMarkup(img, _imgName) {
        const EXIF = window.EXIF;
        const icons = window.icons || {};
        let template = "";
        for (const current in this.exifConfig) {
            const currentData = this.exifConfig[current];
            const exifValue = EXIF?.getTag(img, currentData.tag);
            if (typeof exifValue !== "undefined") {
                const iconSvg = this.getIconSvg(icons, currentData.icon);
                const tagName = currentData.tag.split(/(?=[A-Z])/).join(" ");
                template += `<span title="${tagName}: ${exifValue}">${iconSvg} ${exifValue}</span>`;
            }
        }
        const flickrImgUrl = img.src
            .split("_")[0]
            .split("/images/fulls/")[1];
        const flickrIcon = this.getIconSvg(icons, "flickr");
        template += `<a target="_blank" class="flickr-link" href="https://flickr.com/photos/matthew-evans/${flickrImgUrl}/">${flickrIcon} View on Flickr</a>`;
        return template;
    }
    getIconSvg(icons, iconName) {
        let svgString = icons[iconName] || "";
        if (svgString) {
            svgString = svgString.replace("<svg", '<svg class="icon-inline"');
        }
        return svgString;
    }
    nextImage() {
        if (this.isTransitioning)
            return;
        if (this.currentImageIndex < this.images.length - 1) {
            this.fadeToImage(this.currentImageIndex + 1);
        }
    }
    previousImage() {
        if (this.isTransitioning)
            return;
        if (this.currentImageIndex > 0) {
            this.fadeToImage(this.currentImageIndex - 1);
        }
    }
    fadeToImage(newIndex) {
        const imageElement = this.dialog?.querySelector(".lightbox-image");
        if (!imageElement)
            return;
        this.isTransitioning = true;
        imageElement.style.opacity = "0";
        setTimeout(() => {
            this.currentImageIndex = newIndex;
            this.showImage();
            this.prefetchAdjacentImages();
            this.isTransitioning = false;
        }, 200);
    }
    prefetchAdjacentImages() {
        const indicesToPrefetch = [];
        if (this.currentImageIndex > 0) {
            indicesToPrefetch.push(this.currentImageIndex - 1);
        }
        if (this.currentImageIndex < this.images.length - 1) {
            indicesToPrefetch.push(this.currentImageIndex + 1);
        }
        if (this.currentImageIndex < this.images.length - 2) {
            indicesToPrefetch.push(this.currentImageIndex + 2);
        }
        indicesToPrefetch.forEach((index) => {
            const link = this.images[index];
            const thumbImg = link.querySelector("img");
            const imgName = thumbImg?.dataset.name || "";
            const baseName = imgName.replace(/\.[^.]+$/, '');
            const preloadLink = document.createElement("link");
            preloadLink.rel = "prefetch";
            preloadLink.as = "image";
            preloadLink.href = `/images/fulls/webp/${baseName}-1200w.webp`;
            if (!document.head.querySelector(`link[href="${preloadLink.href}"]`)) {
                document.head.appendChild(preloadLink);
            }
        });
    }
    adjustDialogSize(img) {
        if (!this.dialog)
            return;
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;
        const imageRatio = naturalWidth / naturalHeight;
        const isTinyViewport = window.innerWidth <= 737;
        const metadataHeight = isTinyViewport ? 40 : 80;
        const maxWidth = window.innerWidth * 0.9;
        const maxHeight = window.innerHeight * 0.9 - metadataHeight;
        const maxRatio = maxWidth / maxHeight;
        let newWidth;
        let newHeight;
        if (imageRatio > maxRatio) {
            newWidth = Math.min(naturalWidth, maxWidth);
            newHeight = newWidth / imageRatio;
        }
        else {
            newHeight = Math.min(naturalHeight, maxHeight);
            newWidth = newHeight * imageRatio;
        }
        this.dialog.style.width = newWidth + "px";
        this.dialog.style.height = (newHeight + metadataHeight) + "px";
        this.dialog.style.maxWidth = "95vw";
        this.dialog.style.maxHeight = "95vh";
    }
    close() {
        if (this.dialog) {
            this.dialog.close();
            document.body.classList.remove("modal-active");
        }
    }
}
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        new DialogLightbox(".thumb > a.image");
    });
}
else {
    new DialogLightbox(".thumb > a.image");
}
