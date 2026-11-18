/* ==========================================================
   VELVET DAY - MAIN APPLICATION
   File: js/app.js

   Responsibilities:
   - Initialize the main application
   - Load and save application data
   - Manage application state
   - Apply the selected theme
   - Handle page navigation
   - Handle the mobile sidebar
   - Provide a central VelvetDay API

   Dependencies:
   - js/storage.js
   ========================================================== */

(function () {
    "use strict";

    // ----------------------------------------------------------
    // 1. APPLICATION STATE
    // ----------------------------------------------------------

    const state = {
        data: {},
        currentPage: "dashboard",
        isInitialized: false
    };

    // ----------------------------------------------------------
    // 2. APPLICATION CONFIGURATION
    // ----------------------------------------------------------

    const config = {
        appName: "Velvet Day",
        defaultPage: "dashboard",
        defaultTheme: "dark"
    };

    // ----------------------------------------------------------
    // 3. DOM HELPER FUNCTIONS
    // ----------------------------------------------------------

    function getElement(selector) {
        return document.querySelector(selector);
    }

    function getAllElements(selector) {
        return document.querySelectorAll(selector);
    }

    // ----------------------------------------------------------
    // 4. LOAD APPLICATION DATA
    // ----------------------------------------------------------

    function loadAppData() {
        if (!window.VelvetStorage) {
            console.error(
                "Velvet Day: storage.js has not been loaded."
            );

            return {};
        }

        try {
            // storage.js exposes getAll(), not loadData().
            return VelvetStorage.getAll();
        } catch (error) {
            console.error(
                "Velvet Day: Failed to load application data.",
                error
            );

            return {};
        }
    }

    // ----------------------------------------------------------
    // 5. SAVE APPLICATION DATA
    // ----------------------------------------------------------

    function save(updates) {
        if (!updates || typeof updates !== "object") {
            console.error(
                "Velvet Day: Invalid data supplied to save()."
            );

            return false;
        }

        if (!window.VelvetStorage) {
            console.error(
                "Velvet Day: Storage module is unavailable."
            );

            return false;
        }

        // Merge updates with the current application data.
        const updatedData = {
            ...state.data,
            ...updates
        };

        // Merge settings separately so existing settings
        // are not accidentally removed.
        if (updates.settings) {
            updatedData.settings = {
                ...(state.data.settings || {}),
                ...updates.settings
            };
        }

        // Save the complete data object.
        const saved = VelvetStorage.saveData(updatedData);

        if (!saved) {
            console.error(
                "Velvet Day: Unable to save application data."
            );

            return false;
        }

        // Update application state only after a successful save.
        state.data = updatedData;

        // Notify other components.
        document.dispatchEvent(
            new CustomEvent("velvet:data-updated", {
                detail: {
                    updates: updates,
                    data: state.data
                }
            })
        );

        return true;
    }

    // ----------------------------------------------------------
    // 6. GET DATA
    // ----------------------------------------------------------

    function get(key, fallback = null) {
        if (!key || typeof key !== "string") {
            return fallback;
        }

        const keys = key.split(".");
        let value = state.data;

        for (const part of keys) {
            if (
                value === null ||
                value === undefined ||
                !Object.prototype.hasOwnProperty.call(value, part)
            ) {
                return fallback;
            }

            value = value[part];
        }

        return value === undefined ? fallback : value;
    }

    // ----------------------------------------------------------
    // 7. UPDATE A SINGLE PROPERTY
    // ----------------------------------------------------------

    function set(key, value) {
        if (!key || typeof key !== "string") {
            return false;
        }

        const keys = key.split(".");
        const updates = {};
        let current = updates;

        // Build nested update objects when necessary.
        for (let index = 0; index < keys.length - 1; index++) {
            current[keys[index]] = {};
            current = current[keys[index]];
        }

        current[keys[keys.length - 1]] = value;

        // Handle nested settings separately.
        if (keys[0] === "settings") {
            return save({
                settings: updates.settings
            });
        }

        return save(updates);
    }

    // ----------------------------------------------------------
    // 8. THEME MANAGEMENT
    // ----------------------------------------------------------

    function applyTheme(theme) {
        const selectedTheme =
            theme === "light" ? "light" : "dark";

        // Use the dedicated theme module when available.
        if (
            window.VelvetTheme &&
            typeof window.VelvetTheme.applyTheme === "function"
        ) {
            return window.VelvetTheme.applyTheme(selectedTheme);
        }

        document.documentElement.setAttribute(
            "data-theme",
            selectedTheme
        );

        updateThemeButtons(selectedTheme);

        return selectedTheme;
    }

    // ----------------------------------------------------------
    // 9. UPDATE THEME BUTTONS
    // ----------------------------------------------------------

    function updateThemeButtons(theme) {
        const themeButtons = getAllElements("[data-theme-toggle]");

        themeButtons.forEach(function (button) {
            const isDark = theme === "dark";

            button.setAttribute(
                "aria-label",
                isDark ? "Switch to light theme" : "Switch to dark theme"
            );

            button.setAttribute(
                "title",
                isDark ? "Switch to light mode" : "Switch to dark mode"
            );

            // Update an icon if the button contains one.
            const icon = button.querySelector("i, svg");

            if (icon) {
                icon.setAttribute(
                    "data-lucide",
                    isDark ? "sun" : "moon"
                );
            } else {
                button.textContent = isDark ? "☀" : "☾";
            }
        });
    }

    // ----------------------------------------------------------
    // 10. TOGGLE THEME
    // ----------------------------------------------------------

    function toggleTheme() {
        if (
            window.VelvetTheme &&
            typeof window.VelvetTheme.toggleTheme === "function"
        ) {
            return window.VelvetTheme.toggleTheme();
        }

        const currentTheme =
            document.documentElement.getAttribute("data-theme") ||
            config.defaultTheme;

        const newTheme =
            currentTheme === "dark" ? "light" : "dark";

        applyTheme(newTheme);

        save({
            settings: {
                theme: newTheme
            }
        });

        return newTheme;
    }

    // ----------------------------------------------------------
    // 11. PAGE TITLE CONFIGURATION
    // ----------------------------------------------------------

    const pageTitles = {
        dashboard: "Dashboard",
        tasks: "My Tasks",
        calendar: "Calendar",
        notes: "My Notes",
        "brain-dump": "Brain Dump",
        checklists: "My Checklists",
        recurring: "Recurring Tasks",
        reminders: "Reminders",
        progress: "My Progress",
        settings: "Settings"
    };

    // ----------------------------------------------------------
    // 12. UPDATE PAGE TITLE
    // ----------------------------------------------------------

    function updatePageTitle(pageName) {
        const title =
            pageTitles[pageName] || pageName;

        // Matches the index.html heading.
        const pageHeading = getElement("#pageTitle");

        if (pageHeading) {
            pageHeading.textContent = title;
        }

        // Also supports an optional data attribute.
        const alternateHeading = getElement("[data-page-title]");

        if (alternateHeading) {
            alternateHeading.textContent = title;
        }

        document.title = `${title} | ${config.appName}`;
    }

    // ----------------------------------------------------------
    // 13. PAGE NAVIGATION
    // ----------------------------------------------------------
    // index.html uses:
    // Navigation: data-page-target="tasks"
    // Content:    data-page="tasks"
    // ----------------------------------------------------------

    function navigate(pageName) {
        if (!pageName || typeof pageName !== "string") {
            return false;
        }

        // Find the requested page.
        const pageSections = getAllElements(".page-section");

        let targetPage = null;

        pageSections.forEach(function (section) {
            if (section.dataset.page === pageName) {
                targetPage = section;
            }
        });

        // Do not navigate to a page that does not exist.
        if (!targetPage) {
            console.warn(
                `Velvet Day: Page "${pageName}" was not found.`
            );

            return false;
        }

        state.currentPage = pageName;

        // Update navigation links.
        const navItems = getAllElements("[data-page-target]");

        navItems.forEach(function (item) {
            const isActive =
                item.dataset.pageTarget === pageName;

            item.classList.toggle("active", isActive);

            if (isActive) {
                item.setAttribute("aria-current", "page");
            } else {
                item.removeAttribute("aria-current");
            }
        });

        // Show the selected page and hide all others.
        pageSections.forEach(function (section) {
            const isActive =
                section.dataset.page === pageName;

            section.classList.toggle("active", isActive);
            section.hidden = !isActive;
        });

        updatePageTitle(pageName);

        closeMobileSidebar();

        // Notify other modules.
        document.dispatchEvent(
            new CustomEvent("velvet:page-changed", {
                detail: {
                    page: pageName
                }
            })
        );

        return true;
    }

    // ----------------------------------------------------------
    // 14. THEME INITIALIZATION
    // ----------------------------------------------------------

    function initializeTheme() {
        const settings = state.data.settings || {};

        const theme =
            settings.theme || config.defaultTheme;

        applyTheme(theme);
    }

    // ----------------------------------------------------------
    // 15. NAVIGATION INITIALIZATION
    // ----------------------------------------------------------

    function initializeNavigation() {
        const hashPage = window.location.hash
            .replace(/^#/, "")
            .trim();

        const availablePages = Array.from(
            getAllElements(".page-section")
        ).map(function (section) {
            return section.dataset.page;
        });

        const initialPage = availablePages.includes(hashPage)
            ? hashPage
            : config.defaultPage;

        navigate(initialPage);
    }

    // ----------------------------------------------------------
    // 16. MOBILE SIDEBAR
    // ----------------------------------------------------------

    function toggleMobileSidebar() {
        const sidebar = getElement("#sidebar");
        const overlay = getElement("#sidebarOverlay");

        if (!sidebar) {
            return;
        }

        const isOpen = sidebar.classList.toggle("open");

        if (overlay) {
            overlay.classList.toggle("active", isOpen);
        }

        document.body.classList.toggle(
            "sidebar-open",
            isOpen
        );
    }

    function closeMobileSidebar() {
        const sidebar = getElement("#sidebar");
        const overlay = getElement("#sidebarOverlay");

        if (sidebar) {
            sidebar.classList.remove("open");
        }

        if (overlay) {
            overlay.classList.remove("active");
        }

        document.body.classList.remove("sidebar-open");
    }

    // ----------------------------------------------------------
    // 17. GLOBAL EVENT LISTENERS
    // ----------------------------------------------------------

    function setupEventListeners() {

        // ------------------------------------------------------
        // Navigation clicks
        // ------------------------------------------------------

        document.addEventListener("click", function (event) {
            const navButton = event.target.closest(
                "[data-page-target]"
            );

            if (!navButton) {
                return;
            }

            event.preventDefault();

            const pageName = navButton.dataset.pageTarget;

            if (navigate(pageName)) {
                // Update the URL without reloading the application.
                window.history.replaceState(
                    null,
                    "",
                    `#${pageName}`
                );
            }
        });

        // ------------------------------------------------------
        // Browser back/forward and hash navigation
        // ------------------------------------------------------

        window.addEventListener("hashchange", function () {
            const pageName = window.location.hash
                .replace(/^#/, "")
                .trim();

            if (pageName) {
                navigate(pageName);
            }
        });

        // ------------------------------------------------------
        // Mobile menu button
        // ------------------------------------------------------

        const menuToggle = getElement("#menuToggle");

        if (menuToggle) {
            menuToggle.addEventListener(
                "click",
                toggleMobileSidebar
            );
        }

        // ------------------------------------------------------
        // Mobile sidebar close button
        // ------------------------------------------------------

        const sidebarClose = getElement("#sidebarClose");

        if (sidebarClose) {
            sidebarClose.addEventListener(
                "click",
                closeMobileSidebar
            );
        }

        // ------------------------------------------------------
        // Mobile sidebar overlay
        // ------------------------------------------------------

        const sidebarOverlay = getElement("#sidebarOverlay");

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener(
                "click",
                closeMobileSidebar
            );
        }

        // ------------------------------------------------------
        // Escape key closes the mobile sidebar
        // ------------------------------------------------------

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                closeMobileSidebar();
            }
        });
    }

    // ----------------------------------------------------------
    // 18. INITIALIZE APPLICATION
    // ----------------------------------------------------------

    function initialize() {
        if (state.isInitialized) {
            return;
        }

        console.log("💜 Starting Velvet Day...");

        // Load saved data.
        state.data = loadAppData();

        // Ensure settings are available.
        if (!state.data.settings) {
            state.data.settings = {
                theme: config.defaultTheme
            };
        }

        // Initialize theme.
        initializeTheme();

        // Initialize navigation.
        initializeNavigation();

        // Register global events.
        setupEventListeners();

        // Mark the application as initialized.
        state.isInitialized = true;

        console.log("✨ Velvet Day is ready!");
    }

    // ----------------------------------------------------------
    // 19. PUBLIC APPLICATION API
    // ----------------------------------------------------------

    window.VelvetDay = {
        state: state,
        config: config,

        initialize: initialize,

        get: get,
        set: set,
        save: save,

        navigate: navigate,
        updatePageTitle: updatePageTitle,

        applyTheme: applyTheme,
        toggleTheme: toggleTheme,

        toggleMobileSidebar: toggleMobileSidebar,
        closeMobileSidebar: closeMobileSidebar
    };

    // ----------------------------------------------------------
    // 20. START APPLICATION WHEN DOM IS READY
    // ----------------------------------------------------------

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            { once: true }
        );
    } else {
        initialize();
    }

})();
