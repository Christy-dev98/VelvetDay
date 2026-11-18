
/* ==========================================================
   VELVET DAY - MAIN APPLICATION
   File: js/app.js

   This file is responsible for starting the application
   and connecting its different components.

   Responsibilities:
   - Initialize Velvet Day
   - Load stored data
   - Manage application state
   - Initialize theme
   - Initialize navigation
   - Set up global event listeners
   - Provide a central app object for other scripts

   Dependencies:
   - js/storage.js

   ========================================================== */

(function () {
    "use strict";

    // ----------------------------------------------------------
    // 1. APPLICATION STATE
    // ----------------------------------------------------------
    // This object contains the data currently being used by the app.
    //
    // LocalStorage stores the permanent copy.
    // VelvetDay.state stores the copy currently used by JavaScript.
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
    // These functions help us find HTML elements without
    // repeatedly writing document.querySelector().
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
    // Loads the saved data using storage.js.
    // ----------------------------------------------------------

    function loadAppData() {
        if (!window.VelvetStorage) {
            console.error(
                "Velvet Day: storage.js has not been loaded."
            );

            return {};
        }

        return VelvetStorage.loadData();
    }

    // ----------------------------------------------------------
    // 5. SAVE APPLICATION DATA
    // ----------------------------------------------------------
    // Updates the app's state and saves the changes locally.
    //
    // Example:
    // VelvetDay.save({
    //     tasks: updatedTasks
    // });
    // ----------------------------------------------------------

    function save(updates) {
        if (!updates || typeof updates !== "object") {
            return false;
        }

        // Update the in-memory data
        state.data = {
            ...state.data,
            ...updates
        };

        // Merge settings separately to prevent overwriting
        // other settings accidentally.
        if (updates.settings) {
            state.data.settings = {
                ...(state.data.settings || {}),
                ...updates.settings
            };
        }

        // Save the complete data object
        const saved = VelvetStorage.saveData(state.data);

        // Notify other components that the data has changed
        document.dispatchEvent(
            new CustomEvent("velvet:data-updated", {
                detail: {
                    updates: updates,
                    data: state.data
                }
            })
        );

        return saved;
    }

    // ----------------------------------------------------------
    // 6. GET DATA
    // ----------------------------------------------------------
    // Gets a value from the current application state.
    //
    // Example:
    // VelvetDay.get("tasks");
    // VelvetDay.get("settings");
    // ----------------------------------------------------------

    function get(key) {
        return state.data[key];
    }

    // ----------------------------------------------------------
    // 7. UPDATE A SINGLE PROPERTY
    // ----------------------------------------------------------
    // Updates a specific section of the app data.
    //
    // Example:
    // VelvetDay.set("notes", notes);
    // ----------------------------------------------------------

    function set(key, value) {
        const updates = {
            [key]: value
        };

        return save(updates);
    }

    // ----------------------------------------------------------
    // 8. THEME MANAGEMENT
    // ----------------------------------------------------------
    // Applies the selected theme to the HTML document.
    //
    // Supported themes:
    // - dark
    // - light
    //
    // The theme is stored in LocalStorage through settings.
    // ----------------------------------------------------------

    function applyTheme(theme) {
        const selectedTheme = theme || config.defaultTheme;

        // Set the theme attribute on the document
        document.documentElement.setAttribute(
            "data-theme",
            selectedTheme
        );

        // Toggle theme classes for compatibility with CSS
        document.documentElement.classList.remove(
            "theme-dark",
            "theme-light"
        );

        document.documentElement.classList.add(
            `theme-${selectedTheme}`
        );

        // Update theme toggle buttons if they exist
        updateThemeButtons(selectedTheme);

        return selectedTheme;
    }

    // ----------------------------------------------------------
    // 9. UPDATE THEME BUTTONS
    // ----------------------------------------------------------
    // Changes the icon or label on theme toggle buttons.
    // ----------------------------------------------------------

    function updateThemeButtons(theme) {
        const themeButtons = getAllElements("[data-theme-toggle]");

        themeButtons.forEach(function (button) {
            button.setAttribute("aria-label", "Switch theme");

            // Update the icon based on the current theme
            const icon = button.querySelector("i, svg");

            if (icon) {
                icon.setAttribute(
                    "data-lucide",
                    theme === "dark" ? "sun" : "moon"
                );
            }

            button.setAttribute(
                "title",
                theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
            );
        });
    }

    // ----------------------------------------------------------
    // 10. TOGGLE THEME
    // ----------------------------------------------------------
    // Switches between light and dark mode.
    // ----------------------------------------------------------

    function toggleTheme() {
        const currentTheme =
            document.documentElement.getAttribute("data-theme") ||
            config.defaultTheme;

        const newTheme =
            currentTheme === "dark" ? "light" : "dark";

        // Apply the new theme
        applyTheme(newTheme);

        // Save the preference
        save({
            settings: {
                ...state.data.settings,
                theme: newTheme
            }
        });

        return newTheme;
    }

    // ----------------------------------------------------------
    // 11. NAVIGATION
    // ----------------------------------------------------------
    // Handles switching between different pages or sections.
    //
    // Navigation buttons should have:
    // data-page="dashboard"
    // data-page="tasks"
    // data-page="notes"
    //
    // Content sections should have:
    // data-page-content="dashboard"
    // data-page-content="tasks"
    // data-page-content="notes"
    // ----------------------------------------------------------

    function navigate(pageName) {
        if (!pageName) {
            return;
        }

        state.currentPage = pageName;

        // Update navigation buttons
        const navItems = getAllElements("[data-page]");

        navItems.forEach(function (item) {
            const itemPage = item.dataset.page;

            if (itemPage === pageName) {
                item.classList.add("active");

                item.setAttribute("aria-current", "page");
            } else {
                item.classList.remove("active");

                item.removeAttribute("aria-current");
            }
        });

        // Show and hide page sections
        const pageContents = getAllElements("[data-page-content]");

        pageContents.forEach(function (section) {
            const sectionPage = section.dataset.pageContent;

            const isActive = sectionPage === pageName;

            section.classList.toggle("active", isActive);

            section.hidden = !isActive;
        });

        // Update page title if an element exists
        updatePageTitle(pageName);

        // Close mobile sidebar after navigation
        closeMobileSidebar();

        // Notify other scripts that navigation has changed
        document.dispatchEvent(
            new CustomEvent("velvet:page-changed", {
                detail: {
                    page: pageName
                }
            })
        );
    }

    // ----------------------------------------------------------
    // 12. UPDATE PAGE TITLE
    // ----------------------------------------------------------
    // Updates the page title and optionally the browser tab title.
    // ----------------------------------------------------------

    function updatePageTitle(pageName) {
        const pageTitles = {
            dashboard: "Dashboard",
            tasks: "My Tasks",
            brain: "Brain Dump",
            notes: "My Notes",
            checklist: "Checklists",
            calendar: "Calendar",
            recurring: "Recurring Tasks",
            reminders: "Reminders",
            progress: "My Progress",
            settings: "Settings"
        };

        const title = pageTitles[pageName] || pageName;

        const pageHeading = getElement("[data-page-title]");

        if (pageHeading) {
            pageHeading.textContent = title;
        }

        document.title = `${title} | ${config.appName}`;
    }

    // ----------------------------------------------------------
    // 13. MOBILE SIDEBAR
    // ----------------------------------------------------------
    // Opens and closes the mobile sidebar.
    //
    // Expected optional HTML elements:
    // #sidebar
    // #sidebarOverlay
    // [data-sidebar-toggle]
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

        document.body.classList.toggle("sidebar-open", isOpen);
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
    // 14. EVENT LISTENERS
    // ----------------------------------------------------------
    // Registers app-wide events.
    //
    // Event delegation allows buttons to work even when their
    // elements are created dynamically later.
    // ----------------------------------------------------------

    function setupEventListeners() {

        // Navigation clicks
        document.addEventListener("click", function (event) {
            const navButton = event.target.closest("[data-page]");

            if (navButton) {
                event.preventDefault();

                navigate(navButton.dataset.page);

                return;
            }

            // Theme toggle
            const themeButton = event.target.closest(
                "[data-theme-toggle]"
            );

            if (themeButton) {
                event.preventDefault();

                toggleTheme();

                return;
            }

            // Mobile sidebar toggle
            const sidebarButton = event.target.closest(
                "[data-sidebar-toggle]"
            );

            if (sidebarButton) {
                event.preventDefault();

                toggleMobileSidebar();

                return;
            }

            // Close sidebar when clicking overlay
            const overlay = event.target.closest("#sidebarOverlay");

            if (overlay) {
                closeMobileSidebar();
            }
        });

        // Keyboard shortcuts
        document.addEventListener("keydown", function (event) {

            // Escape closes sidebar
            if (event.key === "Escape") {
                closeMobileSidebar();
            }

            // Ctrl + / or Cmd + / focuses the search box
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key === "/"
            ) {
                event.preventDefault();

                const searchInput = getElement(
                    "[data-search-input]"
                );

                if (searchInput) {
                    searchInput.focus();
                }
            }
        });

        // Listen for storage changes from other browser tabs
        window.addEventListener("storage", function (event) {
            if (event.key === "velvetDayData") {
                state.data = loadAppData();

                document.dispatchEvent(
                    new CustomEvent("velvet:data-reloaded", {
                        detail: {
                            data: state.data
                        }
                    })
                );
            }
        });
    }

    // ----------------------------------------------------------
    // 15. INITIALIZE THE THEME
    // ----------------------------------------------------------
    // Reads the user's saved theme and applies it.
    // ----------------------------------------------------------

    function initializeTheme() {
        const settings = state.data.settings || {};

        const theme = settings.theme || config.defaultTheme;

        applyTheme(theme);
    }

    // ----------------------------------------------------------
    // 16. INITIALIZE NAVIGATION
    // ----------------------------------------------------------
    // Starts the application on the default page.
    // ----------------------------------------------------------

    function initializeNavigation() {
        const initialPage = config.defaultPage;

        navigate(initialPage);
    }

    // ----------------------------------------------------------
    // 17. INITIALIZE APPLICATION
    // ----------------------------------------------------------
    // This is the main startup function.
    //
    // It should run only once.
    // ----------------------------------------------------------

    function initialize() {
        if (state.isInitialized) {
            return;
        }

        console.log("💜 Starting Velvet Day...");

        // Load data from LocalStorage
        state.data = loadAppData();

        // Initialize theme
        initializeTheme();

        // Initialize navigation
        initializeNavigation();

        // Register app-wide event listeners
        setupEventListeners();

        // Mark the app as initialized
        state.isInitialized = true;

        console.log("✨ Velvet Day is ready!");
    }

    // ----------------------------------------------------------
    // 18. PUBLIC APPLICATION API
    // ----------------------------------------------------------
    // Other JavaScript files can access VelvetDay.
    // ----------------------------------------------------------

    window.VelvetDay = {
        state: state,
        config: config,

        initialize: initialize,

        get: get,
        set: set,
        save: save,

        navigate: navigate,

        applyTheme: applyTheme,
        toggleTheme: toggleTheme,

        toggleMobileSidebar: toggleMobileSidebar,
        closeMobileSidebar: closeMobileSidebar
    };

    // ----------------------------------------------------------
    // 19. START APP WHEN DOM IS READY
    // ----------------------------------------------------------
    // If HTML is still loading, wait for DOMContentLoaded.
    // Otherwise initialize immediately.
    // ----------------------------------------------------------

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );
    } else {
        initialize();
    }

})();
