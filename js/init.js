
/* =========================================================
   VELVET DAY - APPLICATION INITIALIZER
   ---------------------------------------------------------
   Central initialization point for all Velvet Day modules.

   Responsibilities:
   - Initialize the application modules
   - Initialize the theme
   - Initialize navigation
   - Initialize all feature modules
   - Initialize search and PWA support
   - Handle application-level events
   ========================================================= */

window.VelvetInitializer = (() => {
    "use strict";

    // -----------------------------------------------------
    // State
    // -----------------------------------------------------

    let initialized = false;

    // -----------------------------------------------------
    // Module Initialization Helper
    // -----------------------------------------------------

    function initializeModule(moduleName, moduleObject) {
        if (!moduleObject) {
            console.warn(`${moduleName} is not available.`);
            return false;
        }

        if (typeof moduleObject.initialize !== "function") {
            console.warn(`${moduleName} has no initialize method.`);
            return false;
        }

        try {
            moduleObject.initialize();

            console.log(`${moduleName} initialized.`);

            return true;
        } catch (error) {
            console.error(
                `Failed to initialize ${moduleName}:`,
                error
            );

            return false;
        }
    }

    // -----------------------------------------------------
    // Initialize Theme
    // -----------------------------------------------------

    function initializeTheme() {
        initializeModule("VelvetTheme", window.VelvetTheme);
    }

    // -----------------------------------------------------
    // Initialize Navigation
    // -----------------------------------------------------

    function initializeNavigation() {
        initializeModule(
            "VelvetNavigation",
            window.VelvetNavigation
        );
    }

    // -----------------------------------------------------
    // Initialize Core Features
    // -----------------------------------------------------

    function initializeCoreModules() {
        const modules = [
            ["VelvetTasks", window.VelvetTasks],
            ["VelvetBrainDump", window.VelvetBrainDump],
            ["VelvetNotes", window.VelvetNotes],
            ["VelvetChecklist", window.VelvetChecklist],
            ["VelvetCalendar", window.VelvetCalendar],
            ["VelvetRecurring", window.VelvetRecurring],
            ["VelvetReminders", window.VelvetReminders],
            ["VelvetProgress", window.VelvetProgress],
            ["VelvetSettings", window.VelvetSettings]
        ];

        modules.forEach(([name, moduleObject]) => {
            initializeModule(name, moduleObject);
        });
    }

    // -----------------------------------------------------
    // Initialize Search
    // -----------------------------------------------------

    function initializeSearch() {
        initializeModule("VelvetSearch", window.VelvetSearch);
    }

    // -----------------------------------------------------
    // Initialize PWA
    // -----------------------------------------------------

    function initializePWA() {
        initializeModule("VelvetPWA", window.VelvetPWA);
    }

    // -----------------------------------------------------
    // Application Events
    // -----------------------------------------------------

    function bindApplicationEvents() {
        // Example: Reload application data if a reload event
        // is dispatched by one of the feature modules.
        document.addEventListener("velvet:data-reloaded", () => {
            console.log("Velvet Day data has been reloaded.");
        });

        // Show a toast when the user completes a task.
        document.addEventListener(
            "velvet:task-completed",
            event => {
                const taskTitle = event.detail?.title;

                if (window.VelvetToast) {
                    VelvetToast.success(
                        taskTitle
                            ? `Completed: ${taskTitle}`
                            : "Task completed! ✨"
                    );
                }
            }
        );

        // Global application error logging.
        window.addEventListener("error", event => {
            console.error(
                "Velvet Day application error:",
                event.message
            );
        });

        // Handle unhandled asynchronous errors.
        window.addEventListener("unhandledrejection", event => {
            console.error(
                "Velvet Day asynchronous error:",
                event.reason
            );
        });
    }

    // -----------------------------------------------------
    // Welcome Message
    // -----------------------------------------------------

    function showWelcomeMessage() {
        const settings = window.VelvetStorage
            ? VelvetStorage.get("settings", {})
            : {};

        // Keep the welcome message subtle.
        if (settings.showWelcomeMessage === false) {
            return;
        }

        console.log("Welcome to Velvet Day ♡");
    }

    // -----------------------------------------------------
    // Initialize Application
    // -----------------------------------------------------

    function initialize() {
        if (initialized) return;

        console.log("Starting Velvet Day...");

        // 1. Initialize theme first so the correct colors
        //    are applied before the rest of the UI appears.
        initializeTheme();

        // 2. Initialize navigation.
        initializeNavigation();

        // 3. Initialize application features.
        initializeCoreModules();

        // 4. Initialize global search.
        initializeSearch();

        // 5. Initialize PWA features.
        initializePWA();

        // 6. Register application-level event listeners.
        bindApplicationEvents();

        // 7. Welcome.
        showWelcomeMessage();

        initialized = true;

        console.log("Velvet Day is ready. ♡");

        // Dispatch an event for anything that needs to know
        // when the entire application has finished starting.
        document.dispatchEvent(
            new CustomEvent("velvet:app-initialized")
        );
    }

    // -----------------------------------------------------
    // Public API
    // -----------------------------------------------------

    return {
        initialize,
        isInitialized: () => initialized
    };
})();

// ---------------------------------------------------------
// Automatically Start When DOM Is Ready
// ---------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    VelvetInitializer.initialize();
});
