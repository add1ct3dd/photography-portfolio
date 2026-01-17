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
      } catch (e) {
        // EXIF config parsing failed
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
    this.dialog.addEventListener("click", (e) => {
      if (e.target === this.dialog) {
        this.close();
      }
    });
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
    document.addEventListener("keydown", (e) => {
      if (!this.dialog || !this.dialog.open) return;

      switch (e.key) {
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
      // Always clear previous metadata
      exifContainer.innerHTML = '<p>Loading metadata...</p>';
      
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
      
      // Load EXIF data for this image
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
    if (!(window as any).EXIF) {
      container.innerHTML = "<p>View on Flickr</p>";
      return;
    }

    try {
      if (img && img.src) {
        // Create a fresh image element to avoid EXIF.js caching issues
        const tempImg = new Image();
        
        tempImg.onload = () => {
          (window as any).EXIF.getData(tempImg, () => {
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
    } catch (e) {
      container.innerHTML = "<p>View on Flickr</p>";
    }
  }

  private getExifDataMarkup(img: HTMLImageElement, imgName: string): string {
    const EXIF = (window as any).EXIF;
    const icons = (window as any).icons || {};
    
    let template = "";

    // Add EXIF tags
    for (const current in this.exifConfig) {
      const currentData = this.exifConfig[current];
      const exifValue = EXIF.getTag(img, currentData.tag);

      if (typeof exifValue !== "undefined") {
        const iconSvg = this.getIconSvg(icons, currentData.icon);
        const tagName = currentData.tag.split(/(?=[A-Z])/).join(" ");
        template += `<span title="${tagName}: ${exifValue}">${iconSvg} ${exifValue}</span>&nbsp;&nbsp;`;

        if (currentData.tag === "LensModel") {
          template += "<br>";
        }
      }
    }

    // Add Flickr link
    const flickrImgUrl = img.src
      .split("_")[0]
      .split("/images/fulls/")[1];
    const flickrIcon = this.getIconSvg(icons, "flickr");
    template += `<a target="_blank" class="flickr-link" href="https://flickr.com/photos/matthew-evans/${flickrImgUrl}/" style="float:right;">${flickrIcon} View on Flickr</a>`;

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

    // Calculate max available space
    const maxWidth = window.innerWidth * 0.9;
    const maxHeight = window.innerHeight * 0.9;
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

    // Set dialog size (add 80px for metadata section)
    this.dialog.style.width = newWidth + "px";
    this.dialog.style.height = (newHeight + 80) + "px";
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
