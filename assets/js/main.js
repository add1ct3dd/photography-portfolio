/**
 * Main site initialization without jQuery
 * Handles breakpoints, browser detection, responsive behavior, and EXIF loading
 */

// Breakpoints.
breakpoints({
	xlarge: ["1281px", "1680px"],
	large: ["981px", "1280px"],
	medium: ["737px", "980px"],
	small: ["481px", "736px"],
	xsmall: [null, "480px"],
});

const body = document.body;
const wrapper = document.getElementById("wrapper");

// Hack: Enable IE workarounds.
if (browser.name == "ie") body.classList.add("ie");

// Touch?
if (browser.mobile) body.classList.add("touch");

// Transitions supported?
if (browser.canUse("transition")) {
	// Play initial animations on page load.
	window.addEventListener("load", function () {
		window.setTimeout(function () {
			body.classList.remove("is-preload");
		}, 100);
	});

	// Prevent transitions/animations on resize.
	let resizeTimeout;

	window.addEventListener("resize", function () {
		window.clearTimeout(resizeTimeout);

		body.classList.add("is-resizing");

		resizeTimeout = window.setTimeout(function () {
			body.classList.remove("is-resizing");
		}, 100);
	});
}

// Keyboard navigation for accessibility
document.addEventListener("keydown", function (event) {
	if (event.key === "Escape" && body.classList.contains("content-active")) {
		// Close any open panels when ESC is pressed
		const panels = document.querySelectorAll(".panel");
		panels.forEach((panel) => {
			if (panel.classList.contains("active")) {
				panel.classList.remove("active");
			}
		});
		body.classList.remove("content-active");
	}
});

// Scroll back to top.
window.scrollTop = 0;

// Panels.
const panels = document.querySelectorAll(".panel");

panels.forEach((panel) => {
	const panelId = panel.getAttribute("id");
	const toggles = document.querySelectorAll(`[href="#${panelId}"]`);
	const closer = document.createElement("div");
	closer.className = "closer";
	panel.appendChild(closer);

	// Closer.
	closer.addEventListener("click", function (event) {
		hidePanel(panel, toggles);
	});

	// Panel click handlers
	panel.addEventListener("click", function (event) {
		event.stopPropagation();
	});

	// Toggle button handlers
	toggles.forEach((toggle) => {
		toggle.addEventListener("click", function (event) {
			event.preventDefault();
			if (panel.classList.contains("active")) {
				hidePanel(panel, toggles);
			} else {
				showPanel(panel, toggles);
			}
		});
	});
});

// Close panel when clicking outside of it
document.addEventListener("click", function (event) {
	const activePanels = document.querySelectorAll(".panel.active");
	activePanels.forEach((panel) => {
		// Check if click is outside the panel and not on a toggle button
		const panelId = panel.getAttribute("id");
		const toggles = document.querySelectorAll(`[href="#${panelId}"]`);
		let isClickOnToggle = false;

		toggles.forEach((toggle) => {
			if (toggle.contains(event.target)) {
				isClickOnToggle = true;
			}
		});

		// Close if click is outside panel and not on toggle button
		if (!panel.contains(event.target) && !isClickOnToggle) {
			hidePanel(panel, toggles);
		}
	});
});

// Panel show/hide functions
function showPanel(panel, toggles) {
	// Hide other panels
	const otherPanels = document.querySelectorAll(".panel");
	otherPanels.forEach((p) => {
		if (p !== panel && p.classList.contains("active")) {
			const otherToggles = document.querySelectorAll(
				`[href="#${p.getAttribute("id")}"]`
			);
			hidePanel(p, otherToggles);
		}
	});

	// Activate this panel
	panel.classList.add("active");
	toggles.forEach((t) => t.classList.add("active"));
	body.classList.add("content-active");
}

function hidePanel(panel, toggles) {
	panel.classList.remove("active");
	toggles.forEach((t) => t.classList.remove("active"));
	body.classList.remove("content-active");
}

// Load EXIF data on images
const exifDatas = {};
const main = document.getElementById("main");

if (main) {
	const thumbs = main.querySelectorAll(".thumb");

	thumbs.forEach((thumb) => {
		const image = thumb.querySelector(".image");
		const imageImg = image?.querySelector("img");

		if (!image) return;

		// Set initial background if src exists
		const setSrcBackground = function () {
			const src = imageImg.getAttribute("src");
			if (src && !src.includes("data:image/gif")) {
				image.style.backgroundImage = `url(${src})`;
			}
		};

		setSrcBackground();

		// Set background position
		const position = imageImg?.dataset.position;
		if (position) {
			image.style.backgroundPosition = position;
		}

		// Hide original img
		if (imageImg) {
			imageImg.style.display = "none";

			// Load EXIF data
			const loadExif = function () {
				const name = imageImg.dataset.name;
				if (!name || exifDatas[name]) return;

				if (window.EXIF) {
					window.EXIF.getData(imageImg, function () {
						exifDatas[name] = getExifDataMarkup(imageImg);
					});
				}
			};

			// Load on image complete
			if (imageImg.complete) {
				Promise.resolve().then(loadExif);
			} else {
				imageImg.addEventListener("load", loadExif);
			}

			// Watch for src attribute changes (lazy loading)
			if ("MutationObserver" in window) {
				const observer = new MutationObserver(function (mutations) {
					mutations.forEach(function (mutation) {
						if (mutation.attributeName === "src") {
							setSrcBackground();
							loadExif();
						}
					});
				});

				observer.observe(imageImg, {
					attributes: true,
					attributeFilter: ["src"],
				});
			}
		}
	});
}

// Generate EXIF data markup
function getExifDataMarkup(img) {
	const exifConfig = main ? JSON.parse(main.dataset.exif || "{}") : {};
	let template = "";

	// Add EXIF tags
	for (const current in exifConfig) {
		const currentData = exifConfig[current];
		if (!window.EXIF) break;

		const exifValue = window.EXIF.getTag(img, currentData.tag);

		if (typeof exifValue !== "undefined") {
			const iconSvg = getIconSvg(window.icons || {}, currentData.icon);
			const tagName = currentData.tag.split(/(?=[A-Z])/).join(" ");
			template += `<span title="${tagName}: ${exifValue}">${iconSvg} ${exifValue}</span>&nbsp;&nbsp;`;

			if (currentData.tag === "LensModel") {
				template += "<br>";
			}
		}
	}

	// Add Flickr link
	const flickrImgUrl = img.src.split("_")[0].split("/images/fulls/")[1];
	const flickrIcon = getIconSvg(window.icons || {}, "flickr");
	template += `<a target="_blank" style="float:right;" href="https://flickr.com/photos/matthew-evans/${flickrImgUrl}/">${flickrIcon} View on Flickr</a>`;

	return template;
}

// Icon SVG helper
function getIconSvg(icons, iconName) {
	let svgString = icons[iconName] || "";
	if (svgString) {
		svgString = svgString.replace("<svg", '<svg class="icon-inline"');
	}
	return svgString;
}
