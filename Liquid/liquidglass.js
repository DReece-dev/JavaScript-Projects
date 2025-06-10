/* liquidglass.v7.js */
/* The definitive intelligent engine for the Aesthetic Core Edition. */

class LiquidGlass {
    constructor(config = {}) {
        this.config = {
            quality: "high", // 'high', 'low'
            tiltIntensity: 15,
            ...config,
        };

        this.isReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        this.elements = new Map();
        this.activeElements = new Set();
        this.pointer = { x: 0.5, y: 0.5, rawX: 0, rawY: 0, active: false };

        this._initCanvas();
        this._bindMethods();
    }

    _bindMethods() {
        [
            "init",
            "_handlePointerMove",
            "_render",
            "_handleIntersection",
            "_triggerFeedback",
            "_triggerRipple",
        ].forEach((method) => {
            this[method] = this[method].bind(this);
        });
    }

    _initCanvas() {
        this.analysisCanvas = document.createElement("canvas");
        this.analysisCtx = this.analysisCanvas.getContext("2d", {
            willReadFrequently: true,
        });
        this.analysisCanvas.style.display = "none";
        document.body.appendChild(this.analysisCanvas);
    }

    init() {
        if (this.isReducedMotion) this.config.quality = "low";
        console.log(
            `LiquidGlass.js v7.0 Initialized (Quality: ${this.config.quality})`,
        );

        this.intersectionObserver = new IntersectionObserver(
            this._handleIntersection,
            { threshold: 0.1 },
        );

        document
            .querySelectorAll(".lg-material")
            .forEach((el) => this.addElement(el));
        this._setupGlobalListeners();
        this._render();
        return this;
    }

    addElement(el) {
        if (this.elements.has(el)) return;

        const elementState = {
            config: {
                tiltIntensity:
                    parseFloat(el.dataset.lgTiltIntensity) ||
                    this.config.tiltIntensity,
            },
            isAnalyzed: false,
            isVisible: false,
        };
        this.elements.set(el, elementState);
        this.intersectionObserver.observe(el);

        if (
            this.config.quality === "high" &&
            !el.querySelector(".lg-ripple-container")
        ) {
            const rippleContainer = document.createElement("div");
            rippleContainer.className = "lg-ripple-container";
            el.prepend(rippleContainer);
        }
        el.addEventListener("click", this._triggerRipple);
        el.addEventListener("click", this._triggerFeedback);

        if (el.dataset.lgAutotintFrom) {
            this._setupAutoTint(el);
        }
    }

    _setupGlobalListeners() {
        if (this.config.quality !== "low") {
            window.addEventListener("mousemove", this._handlePointerMove, {
                passive: true,
            });
        }
    }

    async _setupAutoTint(el) {
        const targetSelector = el.dataset.lgAutotintFrom;
        const imageElement = document.querySelector(targetSelector);
        if (!imageElement) {
            console.error(
                `LiquidGlass: Auto-tint target "${targetSelector}" not found.`,
            );
            return;
        }

        const applyTint = async () => {
            try {
                const rgb = await this._getDominantColor(imageElement.src);
                el.style.setProperty(
                    "--lg-tint-rgb",
                    `${rgb.r}, ${rgb.g}, ${rgb.b}`,
                );
                el.dispatchEvent(
                    new CustomEvent("lg:tint-applied", {
                        detail: { color: rgb },
                    }),
                );
            } catch (error) {
                console.error("AutoTint Error:", error);
            }
        };

        if (imageElement.complete) {
            applyTint();
        } else {
            imageElement.addEventListener("load", applyTint, { once: true });
        }
    }

    _handlePointerMove(e) {
        this.pointer.active = true;
        this.pointer.rawX = e.clientX;
        this.pointer.rawY = e.clientY;
        this.pointer.x = e.clientX / window.innerWidth;
        this.pointer.y = e.clientY / window.innerHeight;
    }

    _handleIntersection(entries) {
        entries.forEach((entry) => {
            const el = entry.target;
            const state = this.elements.get(el);
            if (entry.isIntersecting) {
                this.activeElements.add(el);
                if (!state.isAnalyzed) {
                    this._analyzeContext(el);
                    state.isAnalyzed = true;
                }
                el.dispatchEvent(
                    new CustomEvent("lg:enter-view", { detail: state }),
                );
            } else {
                this.activeElements.delete(el);
            }
        });
    }

    _render() {
        if (this.config.quality === "low") {
            requestAnimationFrame(this._render);
            return;
        }

        const rotateX = (this.pointer.y - 0.5) * -1;
        const rotateY = this.pointer.x - 0.5;

        this.activeElements.forEach((el) => {
            const state = this.elements.get(el);
            el.style.transform = `perspective(1400px) rotateX(${rotateX * state.config.tiltIntensity}deg) rotateY(${rotateY * state.config.tiltIntensity}deg)`;

            if (this.pointer.active) {
                const rect = el.getBoundingClientRect();
                el.style.setProperty(
                    "--lg-pointer-x",
                    `${this.pointer.rawX - rect.left}px`,
                );
                el.style.setProperty(
                    "--lg-pointer-y",
                    `${this.pointer.rawY - rect.top}px`,
                );
            }
            el.style.setProperty(
                "--lg-pointer-active",
                this.pointer.active ? "1" : "0",
            );
        });

        requestAnimationFrame(this._render);
    }

    _analyzeContext(el) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        // A small delay helps ensure the background image is fully rendered by the browser
        setTimeout(() => {
            this.analysisCtx.drawImage(
                document.body,
                rect.left,
                rect.top,
                rect.width,
                rect.height,
                0,
                0,
                rect.width,
                rect.height,
            );

            const imageData = this.analysisCtx.getImageData(
                0,
                0,
                rect.width,
                rect.height,
            ).data;
            let r = 0,
                g = 0,
                b = 0,
                count = 0;
            for (let i = 0; i < imageData.length; i += 4) {
                r += imageData[i];
                g += imageData[i + 1];
                b += imageData[i + 2];
                count++;
            }

            const avgR = r / count,
                avgG = g / count,
                avgB = b / count;
            const textColor = window.getComputedStyle(el).color;
            const rgb = textColor.match(/\d+/g).map(Number);
            const contrast = this._calculateContrast([avgR, avgG, avgB], rgb);

            el.classList.toggle("lg-readable-boost", contrast < 4.5);
        }, 50);
    }

    _calculateContrast(rgb1, rgb2) {
        const lum1 = this._getLuminance(rgb1[0], rgb1[1], rgb1[2]);
        const lum2 = this._getLuminance(rgb2[0], rgb2[1], rgb2[2]);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
    }

    _getLuminance(r, g, b) {
        const a = [r, g, b].map((v) => {
            v /= 255;
            return v <= 0.03928
                ? v / 12.92
                : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    _getDominantColor(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                const size = 50;
                canvas.width = size;
                canvas.height = size;
                ctx.drawImage(img, 0, 0, size, size);

                const data = ctx.getImageData(0, 0, size, size).data;
                let colorCounts = {};
                let maxCount = 0;
                let dominantColor = { r: 128, g: 128, b: 128 };
                for (let i = 0; i < data.length; i += 4) {
                    if (
                        data[i + 3] < 128 ||
                        (data[i] > 250 &&
                            data[i + 1] > 250 &&
                            data[i + 2] > 250) ||
                        (data[i] < 5 && data[i + 1] < 5 && data[i + 2] < 5)
                    )
                        continue;
                    const rgb = `${data[i]},${data[i + 1]},${data[i + 2]}`;
                    colorCounts[rgb] = (colorCounts[rgb] || 0) + 1;
                    if (colorCounts[rgb] > maxCount) {
                        maxCount = colorCounts[rgb];
                        dominantColor = {
                            r: data[i],
                            g: data[i + 1],
                            b: data[i + 2],
                        };
                    }
                }
                resolve(dominantColor);
            };
            img.onerror = reject;
            img.src = imageUrl;
        });
    }

    _triggerRipple(e) {
        if (this.config.quality !== "high") return;
        const rippleContainer = e.currentTarget.querySelector(
            ".lg-ripple-container",
        );
        if (!rippleContainer) return;

        const rect = rippleContainer.getBoundingClientRect();
        const ripple = document.createElement("div");
        ripple.className = "lg-ripple";
        ripple.style.left = `${e.clientX - rect.left}px`;
        ripple.style.top = `${e.clientY - rect.top}px`;
        rippleContainer.appendChild(ripple);
        setTimeout(() => ripple.remove(), 700);
        e.currentTarget.dispatchEvent(new CustomEvent("lg:ripple"));
    }

    _triggerFeedback(e) {
        if (navigator.vibrate) navigator.vibrate(30);
    }

    setTheme(themeName) {
        document.documentElement.className =
            themeName === "dark" ? "lg-dark-theme" : "";
        // Re-analyze all elements after a theme change
        this.elements.forEach((state, el) => {
            state.isAnalyzed = false;
            if (this.activeElements.has(el)) {
                this._analyzeContext(el);
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.body.insertAdjacentHTML(
        "afterbegin",
        `
        <svg style="position:absolute; height:0; width:0;">
            <defs>
                <filter id="lg-global-lensing-filter">
                    <feTurbulence type="fractalNoise" baseFrequency="0.01 0.02" numOctaves="1" result="warp" seed="10" />
                    <feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="20" in="SourceGraphic" in2="warp" />
                </filter>
                <filter id="lg-ripple-filter">
                    <feTurbulence type="fractalNoise" baseFrequency="0.02 0.05" numOctaves="1" result="warp" seed="2" />
                    <feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="25" in="SourceGraphic" in2="warp" />
                </filter>
            </defs>
        </svg>
    `,
    );

    window.liquidGlass = new LiquidGlass().init();
});
