
/* =========================================================
   VELVET DAY - PWA MANAGER
   ---------------------------------------------------------
   Handles:
   - Service worker registration
   - Install prompts
   - Installed app detection
   - Install button visibility
   ========================================================= */

window.VelvetPWA = (() => {
    "use strict";

    // -----------------------------------------------------
    // State
    // -----------------------------------------------------

    let deferredInstallPrompt = null;
    let initialized = false;

    // -----------------------------------------------------
    // Configuration
    // -----------------------------------------------------

    const config = {
        serviceWorkerPath: "./service-worker.js",
        installButtonSelector: "[data-install-app]",
        installStatusSelector: "[data-pwa-status]"
    };

    // -----------------------------------------------------
    // Check Installed Mode
    // -----------------------------------------------------

    function isInstalled() {
        return (
            window.matchMedia("(display-mode: standalone)").matches ||
            window.navigator.standalone === true
        );
    }

    // -----------------------------------------------------
    // Update Install Button
    // -----------------------------------------------------

    function updateInstallButton() {
        const installButtons = document.querySelectorAll(
            config.installButtonSelector
        );

        installButtons.forEach(button => {
            if (isInstalled()) {
                button.classList.add("hidden");
                button.disabled = true;
            } else {
                button.classList.remove("hidden");
                button.disabled = !deferredInstallPrompt;
            }
        });
    }

    // -----------------------------------------------------
    // Update Status
    // -----------------------------------------------------

    function updateStatus(message) {
        const statusElement = document.querySelector(
            config.installStatusSelector
        );

        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    // -----------------------------------------------------
    // Register Service Worker
    // -----------------------------------------------------

    async function registerServiceWorker() {
        if (!("serviceWorker" in navigator)) {
            console.warn("Service workers are not supported.");

            return null;
        }

        try {
            const registration = await navigator.serviceWorker.register(
                config.serviceWorkerPath
            );

            console.log("Velvet Day service worker registered.");

            return registration;
        } catch (error) {
            console.error(
                "Velvet Day service worker registration failed:",
                error
            );

            return null;
        }
    }

    // -----------------------------------------------------
    // Handle Install Prompt
    // -----------------------------------------------------

    async function installApp() {
        if (!deferredInstallPrompt) {
            updateStatus(
                "Installation is not currently available on this browser."
            );

            return false;
        }

        deferredInstallPrompt.prompt();

        const choice = await deferredInstallPrompt.userChoice;

        if (choice.outcome === "accepted") {
            console.log("Velvet Day installation accepted.");

            if (window.VelvetToast) {
                VelvetToast.success("Thank you for installing Velvet Day!");
            }
        } else {
            console.log("Velvet Day installation dismissed.");
        }

        deferredInstallPrompt = null;

        updateInstallButton();

        return choice.outcome === "accepted";
    }

    // -----------------------------------------------------
    // Bind Events
    // -----------------------------------------------------

    function bindEvents() {
        // Browser tells us the app can be installed.
        window.addEventListener("beforeinstallprompt", event => {
            event.preventDefault();

            deferredInstallPrompt = event;

            updateInstallButton();

            updateStatus("Velvet Day is ready to install.");
        });

        // User has successfully installed the app.
        window.addEventListener("appinstalled", () => {
            deferredInstallPrompt = null;

            updateInstallButton();

            updateStatus("Velvet Day is installed.");

            if (window.VelvetToast) {
                VelvetToast.success("Velvet Day installed successfully!");
            }
        });

        // Install buttons.
        document.addEventListener("click", event => {
            const installButton = event.target.closest(
                config.installButtonSelector
            );

            if (!installButton) return;

            event.preventDefault();

            installApp();
        });
    }

    // -----------------------------------------------------
    // Initialize
    // -----------------------------------------------------

    async function initialize() {
        if (initialized) return;

        bindEvents();

        await registerServiceWorker();

        updateInstallButton();

        if (isInstalled()) {
            updateStatus("Velvet Day is installed.");
        } else {
            updateStatus("You can install Velvet Day on your device.");
        }

        initialized = true;

        console.log("VelvetPWA initialized.");
    }

    // -----------------------------------------------------
    // Public API
    // -----------------------------------------------------

    return {
        initialize,
        installApp,
        registerServiceWorker,
        isInstalled,
        updateInstallButton
    };
})();
