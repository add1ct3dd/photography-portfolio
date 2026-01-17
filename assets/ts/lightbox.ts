/**
 * Lightweight TypeScript lightbox using native HTML5 <dialog> API
 * Replaces jQuery Poptrox with vanilla JavaScript
 */

interface ExifConfig {
  [key: string]: {
    tag: string;
    icon: string;
  };
}

interface ExifData {
  [imageName: string]: string;
}

class DialogLightbox {
  private dialog: HTMLDialogElement | null = null;
  private currentImageIndex: number = 0;
  private images: HTMLAnchorElement[] = [];
  private exifDatas: ExifData = {};
  private exifConfig: ExifConfig = {};
  private isTransitioning: boolean = false;

  // Pinch-to-zoom state
  private currentScale: number = 1;
  private initialDistance: number = 0;
  private lastScale: number = 1;
  private translateX: number = 0;
  private translateY: number = 0;
  private lastTranslateX: number = 0;
  private lastTranslateY: number = 0;
  private isPinching: boolean = false;
  private lastTouchX: number = 0;
  private lastTouchY: number = 0;

  constructor(private selector: string) {
    this.init();
  }

  private init(): void {
    // Get all image links
    this.images = Array.from(
      document.querySelectorAll(this.selector)
    ) as HTMLAnchorElement[];

    if (this.images.length === 0) {
      return;
    }

    // Get EXIF configuration from main element
    const mainElement = document.getElementById("main");
    if (mainElement && mainElement.dataset.exif) {
      try {
        this.exifConfig = JSON.parse(mainElement.dataset.exif);
      } catch {
        void 0; // Intentionally ignore EXIF config parsing errors
      }
    }

    // Create dialog element
    this.createDialog();

    // Attach click handlers to thumbnails
    this.attachThumbnailListeners();

    // Add keyboard navigation
    this.attachKeyboardListeners();
  }

  private createDialog(): void {
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

    // Attach dialog event listeners
    const closeBtn = this.dialog.querySelector(
      ".lightbox-close"
    ) as HTMLButtonElement;
    const prevBtn = this.dialog.querySelector(
      ".lightbox-prev"
    ) as HTMLButtonElement;
    const nextBtn = this.dialog.querySelector(
      ".lightbox-next"
    ) as HTMLButtonElement;

    closeBtn.addEventListener("click", () => this.close());
    prevBtn.addEventListener("click", () => this.previousImage());
    nextBtn.addEventListener("click", () => this.nextImage());

    // Close on backdrop click
    this.dialog.addEventListener("click", (event) => {
      if (event.target === this.dialog) {
        this.close();
      }
    });

    // Attach pinch-to-zoom handlers
    this.attachTouchHandlers();
  }

  private attachTouchHandlers(): void {
    const imageContainer = this.dialog?.querySelector(
      ".lightbox-image-container"
    ) as HTMLDivElement;
    const image = this.dialog?.querySelector(
      ".lightbox-image"
    ) as HTMLImageElement;

    if (!imageContainer || !image) return;

    // Handle touch events on both container and image for better browser compatibility
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        e.stopPropagation();
        this.isPinching = true;
        this.initialDistance = this.getTouchDistance(e.touches);
        this.lastScale = this.currentScale;
      } else if (e.touches.length === 1 && this.currentScale > 1) {
        // Single touch for panning when zoomed
        e.preventDefault();
        this.lastTouchX = e.touches[0].clientX;
        this.lastTouchY = e.touches[0].clientY;
        this.lastTranslateX = this.translateX;
        this.lastTranslateY = this.translateY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && this.isPinching) {
        e.preventDefault();
        e.stopPropagation();
        const currentDistance = this.getTouchDistance(e.touches);
        const scale = (currentDistance / this.initialDistance) * this.lastScale;
        this.currentScale = Math.min(Math.max(scale, 1), 8); // Limit zoom 1x-8x
        this.applyTransform(image);
      } else if (e.touches.length === 1 && this.currentScale > 1) {
        // Pan when zoomed in
        e.preventDefault();
        const deltaX = e.touches[0].clientX - this.lastTouchX;
        const deltaY = e.touches[0].clientY - this.lastTouchY;
        this.translateX = this.lastTranslateX + deltaX;
        this.translateY = this.lastTranslateY + deltaY;
        this.applyTransform(image);
      }
    };

    const handleTouchEnd = (_e: TouchEvent) => {
      if (_e.touches.length < 2) {
        this.isPinching = false;
      }
      // Reset if zoomed out completely
      if (this.currentScale <= 1) {
        this.resetZoom(image);
      }
    };

    // Attach to both container and image for cross-browser support
    imageContainer.addEventListener("touchstart", handleTouchStart, { passive: false });
    imageContainer.addEventListener("touchmove", handleTouchMove, { passive: false });
    imageContainer.addEventListener("touchend", handleTouchEnd, { passive: false });

    image.addEventListener("touchstart", handleTouchStart, { passive: false });
    image.addEventListener("touchmove", handleTouchMove, { passive: false });
    image.addEventListener("touchend", handleTouchEnd, { passive: false });

    // Also handle gesturestart/gesturechange for Safari/WebKit browsers
    if ('GestureEvent' in window) {
      imageContainer.addEventListener("gesturestart", (e) => {
        e.preventDefault();
        this.lastScale = this.currentScale;
      }, { passive: false });

      imageContainer.addEventListener("gesturechange", (e: Event) => {
        e.preventDefault();
        const gestureEvent = e as unknown as { scale: number };
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

    // Double-tap to zoom
    let lastTap = 0;
    const handleDoubleTap = (e: TouchEvent) => {
      if (e.touches.length === 0 && e.changedTouches.length === 1) {
        const now = Date.now();
        if (now - lastTap < 300) {
          // Double tap detected
          e.preventDefault();
          if (this.currentScale > 1) {
            this.resetZoom(image);
          } else {
            // Zoom to 3x centered on tap position
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

  private getTouchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private applyTransform(image: HTMLImageElement): void {
    image.style.transform = `translate3d(${this.translateX}px, ${this.translateY}px, 0) scale(${this.currentScale})`;

    // Update sizes attribute to trigger higher resolution image loading when zoomed
    // This tells the browser the image is being displayed larger than actual viewport
    this.updateImageSizesForZoom(image);
  }

  private updateImageSizesForZoom(image: HTMLImageElement): void {
    // Calculate effective display size based on zoom level
    // When zoomed to 2x, we need 2x the pixels for sharp display
    const baseSize = window.innerWidth <= 768 ? 95 : 90;
    const effectiveSize = Math.min(baseSize * this.currentScale, 100 * 8); // Cap at 8x viewport
    
    // Update sizes to tell browser to load higher resolution
    image.sizes = `${effectiveSize}vw`;
  }

  private resetZoom(image: HTMLImageElement): void {
    this.currentScale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.lastScale = 1;
    this.lastTranslateX = 0;
    this.lastTranslateY = 0;
    image.style.transform = "translate3d(0, 0, 0) scale(1)";
    // Reset sizes to normal
    image.sizes = "(max-width: 768px) 95vw, 90vw";
  }

  private attachThumbnailListeners(): void {
    this.images.forEach((link, index) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        this.openAt(index);
      });
    });
  }

  private attachKeyboardListeners(): void {
    document.addEventListener("keydown", (event) => {
      if (!this.dialog || !this.dialog.open) return;

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

  private openAt(index: number): void {
    if (index < 0 || index >= this.images.length) return;

    this.currentImageIndex = index;
    this.showImage();

    if (this.dialog) {
      this.dialog.showModal();
      document.body.classList.add("modal-active");
    }
  }

  private showImage(): void {
    const link = this.images[this.currentImageIndex];
    const thumbImg = link.querySelector("img") as HTMLImageElement;
    const imgName = thumbImg?.dataset.name || "";

    // Extract base name without extension
    const baseName = imgName.replace(/\.[^.]+$/, '');

    const imageElement = this.dialog?.querySelector(
      ".lightbox-image"
    ) as HTMLImageElement;
    const exifContainer = this.dialog?.querySelector(
      ".lightbox-exif"
    ) as HTMLDivElement;

    if (imageElement && exifContainer) {
      // Reset zoom when changing images
      this.resetZoom(imageElement);

      // Check if we should show the loading message (not on tiniest viewport where it's hidden anyway)
      const shouldShowLoadingMessage = window.innerWidth > 737;

      // Always clear previous metadata
      if (shouldShowLoadingMessage) {
        exifContainer.innerHTML = '<p>Loading metadata...</p>';
      } else {
        // On tiny viewports, just clear but don't show loading message
        exifContainer.innerHTML = '';
      }

      // Reset image opacity before loading new one
      imageElement.style.opacity = "0";

      // Use responsive image with high-quality variants for lightbox
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
      // Use sizes to tell browser how large image will display (approximately 90vw on desktop)
      imageElement.sizes = "(max-width: 768px) 95vw, 90vw";
      // Set src to highest quality fallback
      imageElement.src = `/images/fulls/${baseName}-3440w.jpg`;
      imageElement.alt = thumbImg?.alt || "Full size image";
      // Enable lazy decoding for better performance
      imageElement.decoding = "async";

      // Handle image load for sizing and fade-in
      imageElement.onload = () => {
        // Adjust dialog size to fit the image
        this.adjustDialogSize(imageElement);

        // Fade in the image smoothly
        requestAnimationFrame(() => {
          imageElement.style.opacity = "1";
        });
      };

      imageElement.onerror = () => {
        // Fallback if image fails to load
        requestAnimationFrame(() => {
          imageElement.style.opacity = "1";
        });
      };

      // Load EXIF data for this image always, so it's ready if viewport expands
      // Use a small delay to ensure image is loaded
      setTimeout(() => {
        // Double-check we're still viewing this image
        const currentLink = this.images[this.currentImageIndex];
        const currentThumbImg = currentLink.querySelector("img") as HTMLImageElement;
        const currentImgName = currentThumbImg?.dataset.name || "";

        if (currentImgName === imgName) {
          this.loadExifFromImage(imageElement, imgName, exifContainer);
        }
      }, 100);
    }

    // Update button states
    const prevBtn = this.dialog?.querySelector(
      ".lightbox-prev"
    ) as HTMLButtonElement;
    const nextBtn = this.dialog?.querySelector(
      ".lightbox-next"
    ) as HTMLButtonElement;

    if (prevBtn) prevBtn.disabled = this.currentImageIndex === 0;
    if (nextBtn)
      nextBtn.disabled = this.currentImageIndex === this.images.length - 1;
  }

  private loadExifFromImage(
    img: HTMLImageElement,
    imgName: string,
    container: HTMLDivElement
  ): void {
    // Check if EXIF library is available
    if (!window.EXIF) {
      container.innerHTML = "<p>View on Flickr</p>";
      return;
    }

    try {
      if (img && img.src) {
        // Create a fresh image element to avoid EXIF.js caching issues
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

        // Set the src to trigger load
        tempImg.src = img.src;
      } else {
        container.innerHTML = "<p>View on Flickr</p>";
      }
    } catch {
      container.innerHTML = "<p>View on Flickr</p>";
    }
  }

  private getExifDataMarkup(img: HTMLImageElement, _imgName: string): string {
    const EXIF = window.EXIF;
    const icons = window.icons || {};

    let template = "";

    // Add EXIF tags
    for (const current in this.exifConfig) {
      const currentData = this.exifConfig[current];
      const exifValue = EXIF?.getTag(img, currentData.tag);
      if (typeof exifValue !== "undefined") {
        const iconSvg = this.getIconSvg(icons, currentData.icon);
        const tagName = currentData.tag.split(/(?=[A-Z])/).join(" ");
        template += `<span title="${tagName}: ${exifValue}">${iconSvg} ${exifValue}</span>`;
      }
    }

    // Add Flickr link
    const flickrImgUrl = img.src
      .split("_")[0]
      .split("/images/fulls/")[1];
    const flickrIcon = this.getIconSvg(icons, "flickr");
    template += `<a target="_blank" class="flickr-link" href="https://flickr.com/photos/matthew-evans/${flickrImgUrl}/">${flickrIcon} View on Flickr</a>`;

    return template;
  }

  private getIconSvg(
    icons: Record<string, string>,
    iconName: string
  ): string {
    let svgString = icons[iconName] || "";
    if (svgString) {
      // Add icon-inline class if not already present
      svgString = svgString.replace("<svg", '<svg class="icon-inline"');
    }
    return svgString;
  }

  private nextImage(): void {
    if (this.isTransitioning) return;
    if (this.currentImageIndex < this.images.length - 1) {
      this.fadeToImage(this.currentImageIndex + 1);
    }
  }

  private previousImage(): void {
    if (this.isTransitioning) return;
    if (this.currentImageIndex > 0) {
      this.fadeToImage(this.currentImageIndex - 1);
    }
  }

  private fadeToImage(newIndex: number): void {
    const imageElement = this.dialog?.querySelector(
      ".lightbox-image"
    ) as HTMLImageElement;
    if (!imageElement) return;

    this.isTransitioning = true;
    imageElement.style.opacity = "0";

    setTimeout(() => {
      this.currentImageIndex = newIndex;
      this.showImage();
      // Prefetch adjacent images for smoother navigation
      this.prefetchAdjacentImages();
      this.isTransitioning = false;
    }, 200);
  }

  private prefetchAdjacentImages(): void {
    // Prefetch next 2 images and previous 1 image for optimal UX
    const indicesToPrefetch: number[] = [];

    // Previous image
    if (this.currentImageIndex > 0) {
      indicesToPrefetch.push(this.currentImageIndex - 1);
    }

    // Next 2 images
    if (this.currentImageIndex < this.images.length - 1) {
      indicesToPrefetch.push(this.currentImageIndex + 1);
    }
    if (this.currentImageIndex < this.images.length - 2) {
      indicesToPrefetch.push(this.currentImageIndex + 2);
    }

    indicesToPrefetch.forEach((index) => {
      const link = this.images[index];
      const thumbImg = link.querySelector("img") as HTMLImageElement;
      const imgName = thumbImg?.dataset.name || "";
      const baseName = imgName.replace(/\.[^.]+$/, '');

      // Create link element for preloading - browser will fetch but not render
      const preloadLink = document.createElement("link");
      preloadLink.rel = "prefetch";
      preloadLink.as = "image";
      // Prefetch the 1200w variant as a good balance between size and quality
      preloadLink.href = `/images/fulls/webp/${baseName}-1200w.webp`;
      // Only add if not already in DOM to avoid duplicates
      if (!document.head.querySelector(`link[href="${preloadLink.href}"]`)) {
        document.head.appendChild(preloadLink);
      }
    });
  }

  private adjustDialogSize(img: HTMLImageElement): void {
    if (!this.dialog) return;

    // Calculate size based on image dimensions
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    const imageRatio = naturalWidth / naturalHeight;

    // Estimate space needed for metadata and UI elements
    // On tiny viewports (< 737px), metadata is hidden so less space needed
    const isTinyViewport = window.innerWidth <= 737;
    const metadataHeight = isTinyViewport ? 40 : 80; // Less space on mobile

    // Calculate max available space, accounting for metadata/buttons
    const maxWidth = window.innerWidth * 0.9;
    const maxHeight = window.innerHeight * 0.9 - metadataHeight;
    const maxRatio = maxWidth / maxHeight;

    let newWidth: number;
    let newHeight: number;

    if (imageRatio > maxRatio) {
      // Image is wider, constrain by width
      newWidth = Math.min(naturalWidth, maxWidth);
      newHeight = newWidth / imageRatio;
    } else {
      // Image is taller, constrain by height
      newHeight = Math.min(naturalHeight, maxHeight);
      newWidth = newHeight * imageRatio;
    }

    // Set dialog size with metadata space included
    this.dialog.style.width = newWidth + "px";
    this.dialog.style.height = (newHeight + metadataHeight) + "px";
    this.dialog.style.maxWidth = "95vw";
    this.dialog.style.maxHeight = "95vh";
  }

  private close(): void {
    if (this.dialog) {
      this.dialog.close();
      document.body.classList.remove("modal-active");
    }
  }
}

// Initialize on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new DialogLightbox(".thumb > a.image");
  });
} else {
  new DialogLightbox(".thumb > a.image");
}
