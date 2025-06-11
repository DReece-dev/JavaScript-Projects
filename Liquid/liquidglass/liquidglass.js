// liquid-glass.js - Enhanced Liquid Glass UI System

// Main Liquid Glass Controller
class LiquidGlass {
    constructor() {
        this.config = {
            blurIntensity: 20,
            refractionStrength: 0.3,
            animationDuration: 600,
            mouseTrackingEnabled: true,
            adaptiveColorsEnabled: true,
            performanceMode: "high", // 'high', 'balanced', 'low'
            hapticFeedback: true,
        };

        this.elements = {
            cards: [],
            buttons: [],
            inputs: [],
            modals: new Map(),
            dropdowns: new Map(),
        };

        this.animations = new Map();
        this.observers = new Map();

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeComponents();
        this.startAnimationLoop();
        this.setupIntersectionObservers();
        this.initializeColorAdaptation();

        // Performance optimization
        this.throttledMouseMove = this.throttle(
            this.handleMouseMove.bind(this),
            16,
        );
        this.debouncedResize = this.debounce(this.handleResize.bind(this), 300);

        console.log("Liquid Glass UI initialized");
    }

    // Component Initialization
    initializeComponents() {
        // Initialize all glass elements
        this.elements.cards = document.querySelectorAll(".liquid-glass");
        this.elements.buttons = document.querySelectorAll(".glass-button");
        this.elements.inputs = document.querySelectorAll(".glass-input");

        // Setup ripple effects for buttons
        this.elements.buttons.forEach((button) => {
            this.setupButtonEffects(button);
        });

        // Setup focus effects for inputs
        this.elements.inputs.forEach((input) => {
            this.setupInputEffects(input);
        });

        // Initialize modals
        document.querySelectorAll("[data-modal]").forEach((modal) => {
            this.elements.modals.set(modal.dataset.modal, modal);
        });

        // Initialize dropdowns
        document.querySelectorAll(".glass-dropdown").forEach((dropdown) => {
            this.setupDropdown(dropdown);
        });

        // Initialize tabs
        this.initializeTabs();

        // Initialize accordions
        this.initializeAccordions();

        // Initialize sliders
        this.initializeSliders();

        // Initialize tooltips
        this.initializeTooltips();
    }

    // Enhanced Button Effects
    setupButtonEffects(button) {
        // Ripple effect on click
        button.addEventListener("click", (e) => {
            const ripple = document.createElement("span");
            ripple.className = "glass-ripple";

            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + "px";
            ripple.style.left = x + "px";
            ripple.style.top = y + "px";

            button.appendChild(ripple);

            // Haptic feedback simulation
            if (this.config.hapticFeedback && window.navigator.vibrate) {
                window.navigator.vibrate(10);
            }

            setTimeout(() => ripple.remove(), 600);
        });

        // Magnetic hover effect
        button.addEventListener("mousemove", (e) => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const deltaX = (x - centerX) / centerX;
            const deltaY = (y - centerY) / centerY;

            button.style.transform = `
                perspective(1000px)
                rotateY(${deltaX * 10}deg)
                rotateX(${-deltaY * 10}deg)
                translateZ(10px)
            `;
        });

        button.addEventListener("mouseleave", () => {
            button.style.transform = "";
        });
    }

    // Enhanced Input Effects
    setupInputEffects(input) {
        // Dynamic label animation
        const wrapper = input.closest(".glass-input-wrapper");
        if (wrapper) {
            const label = wrapper.querySelector("label");

            input.addEventListener("focus", () => {
                if (label) label.classList.add("active");
                this.createFocusRipple(input);
            });

            input.addEventListener("blur", () => {
                if (!input.value && label) {
                    label.classList.remove("active");
                }
            });
        }

        // Auto-resize for textareas
        if (input.tagName === "TEXTAREA") {
            input.addEventListener("input", () => {
                input.style.height = "auto";
                input.style.height = input.scrollHeight + "px";
            });
        }
    }

    // Tab System
    initializeTabs() {
        document.querySelectorAll(".glass-tabs").forEach((tabGroup) => {
            const tabs = tabGroup.querySelectorAll(".glass-tab");
            const panels =
                tabGroup.parentElement.querySelectorAll(".tab-content");

            tabs.forEach((tab, index) => {
                tab.addEventListener("click", () => {
                    // Remove active states
                    tabs.forEach((t) => t.classList.remove("active"));
                    panels.forEach((p) => (p.style.display = "none"));

                    // Set active states
                    tab.classList.add("active");
                    if (panels[index]) {
                        panels[index].style.display = "block";
                        this.animateIn(panels[index]);
                    }

                    // Slide indicator
                    this.updateTabIndicator(tabGroup, tab);
                });
            });

            // Initialize indicator
            this.createTabIndicator(tabGroup);
        });
    }

    createTabIndicator(tabGroup) {
        const indicator = document.createElement("div");
        indicator.className = "glass-tab-indicator";
        tabGroup.appendChild(indicator);

        const activeTab = tabGroup.querySelector(".glass-tab.active");
        if (activeTab) {
            this.updateTabIndicator(tabGroup, activeTab);
        }
    }

    updateTabIndicator(tabGroup, activeTab) {
        const indicator = tabGroup.querySelector(".glass-tab-indicator");
        if (!indicator) return;

        const rect = activeTab.getBoundingClientRect();
        const groupRect = tabGroup.getBoundingClientRect();

        indicator.style.width = rect.width + "px";
        indicator.style.transform = `translateX(${rect.left - groupRect.left}px)`;
    }

    // Accordion System
    initializeAccordions() {
        document
            .querySelectorAll(".glass-accordion-header")
            .forEach((header) => {
                header.addEventListener("click", () => {
                    const item = header.parentElement;
                    const content = item.querySelector(
                        ".glass-accordion-content",
                    );
                    const isActive = item.classList.contains("active");

                    // Close all accordions in the same group
                    const accordion = item.parentElement;
                    accordion
                        .querySelectorAll(".glass-accordion-item")
                        .forEach((accItem) => {
                            accItem.classList.remove("active");
                            const accContent = accItem.querySelector(
                                ".glass-accordion-content",
                            );
                            this.slideUp(accContent);
                        });

                    // Open clicked accordion
                    if (!isActive) {
                        item.classList.add("active");
                        this.slideDown(content);
                    }
                });
            });
    }

    // Slider System
    initializeSliders() {
        document.querySelectorAll(".glass-slider").forEach((slider) => {
            const output = slider.dataset.output
                ? document.getElementById(slider.dataset.output)
                : slider.nextElementSibling;

            const updateSlider = () => {
                const value = slider.value;
                const min = slider.min || 0;
                const max = slider.max || 100;
                const percentage = ((value - min) / (max - min)) * 100;

                // Update output
                if (output) {
                    output.textContent = value;
                }

                // Update fill
                slider.style.setProperty("--value", percentage + "%");

                // Update color based on value
                const hue = (1 - percentage / 100) * 120; // Red to green
                slider.style.setProperty(
                    "--slider-color",
                    `hsl(${hue}, 70%, 50%)`,
                );
            };

            slider.addEventListener("input", updateSlider);
            updateSlider(); // Initial update
        });
    }

    // Tooltip System
    initializeTooltips() {
        document.querySelectorAll("[data-tooltip]").forEach((element) => {
            const tooltip = document.createElement("div");
            tooltip.className = "glass-tooltip-content";
            tooltip.textContent = element.dataset.tooltip;

            element.classList.add("glass-tooltip");
            element.appendChild(tooltip);

            // Position tooltip on hover
            element.addEventListener("mouseenter", () => {
                this.positionTooltip(element, tooltip);
            });
        });
    }

    positionTooltip(element, tooltip) {
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        // Check if tooltip would go off-screen
        if (rect.top - tooltipRect.height < 0) {
            tooltip.style.bottom = "auto";
            tooltip.style.top = "125%";
        }

        if (rect.left + tooltipRect.width / 2 > window.innerWidth) {
            tooltip.style.left = "auto";
            tooltip.style.right = "0";
            tooltip.style.transform = "translateX(0)";
        }
    }

    // Dropdown System
    setupDropdown(dropdown) {
        const toggle = dropdown.querySelector(".glass-dropdown-toggle");
        const menu = dropdown.querySelector(".glass-dropdown-menu");
        const id = dropdown.id || `dropdown-${Date.now()}`;

        dropdown.id = id;
        this.elements.dropdowns.set(id, { dropdown, toggle, menu });

        toggle.addEventListener("click", (e) => {
            e.stopPropagation();
            this.toggleDropdown(id);
        });

        // Close on item click
        menu.querySelectorAll(".glass-dropdown-item").forEach((item) => {
            item.addEventListener("click", () => {
                this.closeDropdown(id);
                // Trigger custom event
                dropdown.dispatchEvent(
                    new CustomEvent("itemSelected", {
                        detail: { value: item.textContent },
                    }),
                );
            });
        });
    }

    toggleDropdown(id) {
        const dropdownData = this.elements.dropdowns.get(id);
        if (!dropdownData) return;

        const { dropdown } = dropdownData;
        const isActive = dropdown.classList.contains("active");

        // Close all dropdowns
        this.elements.dropdowns.forEach((data) => {
            data.dropdown.classList.remove("active");
        });

        // Toggle current dropdown
        if (!isActive) {
            dropdown.classList.add("active");
            this.positionDropdown(dropdown);
        }
    }

    closeDropdown(id) {
        const dropdownData = this.elements.dropdowns.get(id);
        if (dropdownData) {
            dropdownData.dropdown.classList.remove("active");
        }
    }

    positionDropdown(dropdown) {
        const menu = dropdown.querySelector(".glass-dropdown-menu");
        const rect = dropdown.getBoundingClientRect();

        // Reset styles
        menu.style.top = "";
        menu.style.bottom = "";

        // Check if menu would go off-screen
        if (rect.bottom + menu.offsetHeight > window.innerHeight) {
            menu.style.bottom = "100%";
            menu.style.top = "auto";
            menu.style.marginBottom = "8px";
            menu.style.marginTop = "0";
        }
    }

    // Modal System
    openModal(modalId) {
        const modal = this.elements.modals.get(modalId);
        if (!modal) return;

        modal.classList.add("active");
        document.body.style.overflow = "hidden";

        // Animate modal content
        const content = modal.querySelector(".glass-modal");
        if (content) {
            this.animateIn(content);
        }

        // Focus trap
        this.trapFocus(modal);
    }

    closeModal(modalId) {
        const modal = this.elements.modals.get(modalId);
        if (!modal) return;

        modal.classList.remove("active");
        document.body.style.overflow = "";

        // Release focus trap
        this.releaseFocus();
    }

    // Mouse Tracking for Refraction
    handleMouseMove(e) {
        if (!this.config.mouseTrackingEnabled) return;

        requestAnimationFrame(() => {
            this.elements.cards.forEach((card) => {
                const rect = card.getBoundingClientRect();

                // Skip if card is not in viewport
                if (rect.bottom < 0 || rect.top > window.innerHeight) return;

                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;

                card.style.setProperty("--mouse-x", `${x}%`);
                card.style.setProperty("--mouse-y", `${y}%`);

                // 3D tilt effect
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const angleX = (e.clientY - centerY) / 30;
                const angleY = (centerX - e.clientX) / 30;

                card.style.transform = `
                    perspective(1000px)
                    rotateX(${angleX}deg)
                    rotateY(${angleY}deg)
                    translateZ(0)
                `;
            });
        });
    }

    // Color Adaptation System
    initializeColorAdaptation() {
        if (!this.config.adaptiveColorsEnabled) return;

        this.colorAdapter = new ColorAdapter();
        this.colorAdapter.start();

        // Listen for theme changes
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        mediaQuery.addEventListener("change", () => {
            this.colorAdapter.analyze();
        });
    }

    // Animation Utilities
    animateIn(element, duration = 400) {
        element.style.opacity = "0";
        element.style.transform = "translateY(20px) scale(0.95)";

        requestAnimationFrame(() => {
            element.style.transition = `all ${duration}ms var(--smooth-ease)`;
            element.style.opacity = "1";
            element.style.transform = "translateY(0) scale(1)";
        });
    }

    slideDown(element, duration = 300) {
        element.style.height = "0";
        element.style.overflow = "hidden";
        element.style.display = "block";

        const height = element.scrollHeight;
        element.style.transition = `height ${duration}ms var(--smooth-ease)`;

        requestAnimationFrame(() => {
            element.style.height = height + "px";
        });

        setTimeout(() => {
            element.style.height = "";
            element.style.overflow = "";
        }, duration);
    }

    slideUp(element, duration = 300) {
        element.style.height = element.scrollHeight + "px";
        element.style.overflow = "hidden";

        requestAnimationFrame(() => {
            element.style.transition = `height ${duration}ms var(--smooth-ease)`;
            element.style.height = "0";
        });

        setTimeout(() => {
            element.style.display = "none";
            element.style.height = "";
            element.style.overflow = "";
        }, duration);
    }

    createFocusRipple(element) {
        const ripple = document.createElement("div");
        ripple.className = "glass-focus-ripple";
        element.parentElement.appendChild(ripple);

        const rect = element.getBoundingClientRect();
        ripple.style.width = rect.width * 1.5 + "px";
        ripple.style.height = rect.height * 1.5 + "px";

        setTimeout(() => ripple.remove(), 1000);
    }

    // Performance Optimization
    throttle(func, limit) {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    }

    debounce(func, delay) {
        let debounceTimer;
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(context, args), delay);
        };
    }

    // Intersection Observer for Reveal Animations
    setupIntersectionObservers() {
        const options = {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px",
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("glass-revealed");
                    this.animateIn(entry.target);
                }
            });
        }, options);

        // Observe all glass elements
        document.querySelectorAll(".glass-reveal").forEach((el) => {
            observer.observe(el);
        });

        this.observers.set("reveal", observer);
    }

    // Focus Management
    trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select',
        );

        const firstFocusableElement = focusableElements[0];
        const lastFocusableElement =
            focusableElements[focusableElements.length - 1];

        this.focusTrapHandler = (e) => {
            if (e.key === "Tab") {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusableElement) {
                        lastFocusableElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusableElement) {
                        firstFocusableElement.focus();
                        e.preventDefault();
                    }
                }
            }

            if (e.key === "Escape") {
                this.closeAllModals();
            }
        };

        element.addEventListener("keydown", this.focusTrapHandler);
        firstFocusableElement.focus();
    }

    releaseFocus() {
        if (this.focusTrapHandler) {
            document.removeEventListener("keydown", this.focusTrapHandler);
            this.focusTrapHandler = null;
        }
    }

    closeAllModals() {
        this.elements.modals.forEach((modal, id) => {
            this.closeModal(id);
        });
    }

    // Animation Loop
    startAnimationLoop() {
        const animate = () => {
            // Update any continuous animations here
            this.updateAnimations();
            requestAnimationFrame(animate);
        };

        if (this.config.performanceMode !== "low") {
            requestAnimationFrame(animate);
        }
    }

    updateAnimations() {
        // Update shimmer effects
        document.querySelectorAll(".glass-shimmer").forEach((element) => {
            const time = Date.now() / 1000;
            const offset = Math.sin(time) * 50 + 50;
            element.style.setProperty("--shimmer-offset", offset + "%");
        });
    }

    // Event Listeners
    setupEventListeners() {
        // Mouse tracking
        document.addEventListener("mousemove", this.throttledMouseMove);

        // Window resize
        window.addEventListener("resize", this.debouncedResize);

        // Global click handler for dropdowns
        document.addEventListener("click", (e) => {
            if (!e.target.closest(".glass-dropdown")) {
                this.elements.dropdowns.forEach((data) => {
                    data.dropdown.classList.remove("active");
                });
            }
        });

        // Keyboard navigation
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                // Close dropdowns
                this.elements.dropdowns.forEach((data) => {
                    data.dropdown.classList.remove("active");
                });
            }
        });
    }

    handleResize() {
        // Update any size-dependent calculations
        this.updateTabIndicators();
        this.repositionDropdowns();
    }

    updateTabIndicators() {
        document.querySelectorAll(".glass-tabs").forEach((tabGroup) => {
            const activeTab = tabGroup.querySelector(".glass-tab.active");
            if (activeTab) {
                this.updateTabIndicator(tabGroup, activeTab);
            }
        });
    }

    repositionDropdowns() {
        this.elements.dropdowns.forEach((data) => {
            if (data.dropdown.classList.contains("active")) {
                this.positionDropdown(data.dropdown);
            }
        });
    }

    // Public API
    setConfig(key, value) {
        if (this.config.hasOwnProperty(key)) {
            this.config[key] = value;
            console.log(`Liquid Glass config updated: ${key} = ${value}`);
        }
    }

    destroy() {
        // Clean up event listeners
        document.removeEventListener("mousemove", this.throttledMouseMove);
        window.removeEventListener("resize", this.debouncedResize);

        // Clean up observers
        this.observers.forEach((observer) => observer.disconnect());

        // Clean up animations
        this.animations.forEach((animation) => cancelAnimationFrame(animation));

        console.log("Liquid Glass UI destroyed");
    }
}

// Color Adaptation System
class ColorAdapter {
    constructor() {
        this.samples = [];
        this.updateInterval = 5000;
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.analyze();

        // Periodic updates
        this.intervalId = setInterval(() => {
            this.analyze();
        }, this.updateInterval);
    }

    stop() {
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    analyze() {
        // Sample colors from the page
        const elements = document.querySelectorAll(".bg-element, img, video");
        const colors = [];

        elements.forEach((element) => {
            const color = this.getDominantColor(element);
            if (color) colors.push(color);
        });

        if (colors.length > 0) {
            const averageColor = this.averageColors(colors);
            this.applyAdaptiveColors(averageColor);
        }
    }

    getDominantColor(element) {
        // Simplified color extraction
        // In a real implementation, you might use canvas to sample image colors
        const computedStyle = window.getComputedStyle(element);
        const bgColor = computedStyle.backgroundColor;

        if (bgColor && bgColor !== "rgba(0, 0, 0, 0)") {
            return this.parseColor(bgColor);
        }

        return null;
    }

    parseColor(colorString) {
        const match = colorString.match(/\d+/g);
        if (match && match.length >= 3) {
            return {
                r: parseInt(match[0]),
                g: parseInt(match[1]),
                b: parseInt(match[2]),
            };
        }
        return null;
    }

    averageColors(colors) {
        const total = colors.reduce(
            (acc, color) => ({
                r: acc.r + color.r,
                g: acc.g + color.g,
                b: acc.b + color.b,
            }),
            { r: 0, g: 0, b: 0 },
        );

        return {
            r: Math.round(total.r / colors.length),
            g: Math.round(total.g / colors.length),
            b: Math.round(total.b / colors.length),
        };
    }

    applyAdaptiveColors(color) {
        const hsl = this.rgbToHsl(color.r, color.g, color.b);

        document.documentElement.style.setProperty(
            "--adaptive-hue",
            `${hsl.h}deg`,
        );
        document.documentElement.style.setProperty(
            "--adaptive-saturation",
            `${hsl.s}%`,
        );
        document.documentElement.style.setProperty(
            "--adaptive-lightness",
            `${hsl.l}%`,
        );

        // Update glass tint
        const tintColor = `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 0.1)`;
        document.documentElement.style.setProperty("--primary-tint", tintColor);
    }

    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h,
            s,
            l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r:
                    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                    break;
                case g:
                    h = ((b - r) / d + 2) / 6;
                    break;
                case b:
                    h = ((r - g) / d + 4) / 6;
                    break;
            }
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100),
        };
    }
}

// Initialize on DOM ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        window.liquidGlass = new LiquidGlass();
    });
} else {
    window.liquidGlass = new LiquidGlass();
}

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
    module.exports = { LiquidGlass, ColorAdapter };
}
