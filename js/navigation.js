
/* ==========================================================
   VELVET DAY - NAVIGATION MANAGER
   File: js/navigation.js

   This file manages page navigation throughout Velvet Day.

   Features:
   - Page switching
   - Active navigation highlighting
   - Page title updates
   - Browser back/forward navigation
   - Navigation history
   - Mobile sidebar support
   - Keyboard navigation shortcuts

   Dependencies:
   - js/app.js

   IMPORTANT:
   app.js already contains basic navigation functionality.
   This file works with VelvetDay.navigate() instead of
   creating a completely separate navigation system.

   ========================================================== */

(function () {
    "use strict";

    // ----------------------------------------------------------
    // 1. NAVIGATION CONFIGURATION
    // ----------------------------------------------------------

    const config = {
        defaultPage: "dashboard",

        pages: {
            dashboard: {
                title: "Dashboard",
                subtitle: "Your little corner of productivity"
            },

            tasks: {
                title: "My Tasks",
                subtitle: "One step at a time"
            },

            brain: {
                title: "Brain Dump",
                subtitle: "Let it all out"
            },

            notes: {
                title: "My Notes",
                subtitle: "Thoughts worth keeping"
            },

            checklist: {
                title: "Checklists",
                subtitle: "Little things, all organized"
            },

            calendar: {
                title: "Calendar",
                subtitle: "Make space for what matters"
            },

            recurring: {
                title: "Recurring Tasks",
                subtitle: "Build little habits"
            },

            reminders: {
                title: "Reminders",
                subtitle: "Things you don't want to forget"
            },

            progress: {
                title: "My Progress",
                subtitle: "Look how far you've come"
            },

            settings: {
                title: "Settings",
                subtitle: "Make Velvet Day yours"
            }
        }
    };

    // ----------------------------------------------------------
    // 2. NAVIGATION STATE
    // ----------------------------------------------------------

    const state = {
        currentPage: config.defaultPage,
        previousPage: null,
        history: [],
        isInitialized: false
    };

    // ----------------------------------------------------------
    // 3. HELPER - GET PAGE INFORMATION
    // ----------------------------------------------------------
    // Returns the information configured for a page.
    // ----------------------------------------------------------

    function getPageInfo(pageName) {
        return config.pages[pageName] || {
            title: pageName,
            subtitle: ""
        };
    }

    // ----------------------------------------------------------
    // 4. CHECK WHETHER A PAGE EXISTS
    // ----------------------------------------------------------

    function pageExists(pageName) {
        return Object.prototype.hasOwnProperty.call(
            config.pages,
            pageName
        );
    }

    // ----------------------------------------------------------
    // 5. UPDATE PAGE HEADING
    // ----------------------------------------------------------
    // Updates elements displaying the current page title
    // and subtitle.
    //
    // Expected optional HTML:
    //
    // <h1 data-page-title></h1>
    // <p data-page-subtitle></p>
    // ----------------------------------------------------------

    function updatePageHeading(pageName) {
        const pageInfo = getPageInfo(pageName);

        const titleElement = document.querySelector(
            "[data-page-title]"
        );

        const subtitleElement = document.querySelector(
            "[data-page-subtitle]"
        );

        if (titleElement) {
            titleElement.textContent = pageInfo.title;
        }

        if (subtitleElement) {
            subtitleElement.textContent = pageInfo.subtitle;
        }

        // Update the browser tab title
        document.title = `${pageInfo.title} | Velvet Day`;
    }

    // ----------------------------------------------------------
    // 6. UPDATE ACTIVE NAVIGATION ITEM
    // ----------------------------------------------------------
    // Highlights the navigation item for the selected page.
    //
    // Expected HTML:
    //
    // <button data-page="dashboard">Dashboard</button>
    // <button data-page="tasks">Tasks</button>
    // ----------------------------------------------------------

    function updateActiveNavigation(pageName) {
        const navigationItems = document.querySelectorAll(
            "[data-page]"
        );

        navigationItems.forEach(function (item) {
            const isActive = item.dataset.page === pageName;

            item.classList.toggle("active", isActive);

            if (isActive) {
                item.setAttribute("aria-current", "page");
            } else {
                item.removeAttribute("aria-current");
            }
        });
    }

    // ----------------------------------------------------------
    // 7. SHOW PAGE CONTENT
    // ----------------------------------------------------------
    // Makes the selected page visible and hides other pages.
    //
    // Expected HTML:
    //
    // <section data-page-content="dashboard"></section>
    // <section data-page-content="tasks"></section>
    // ----------------------------------------------------------

    function showPageContent(pageName) {
        const pageSections = document.querySelectorAll(
            "[data-page-content]"
        );

        pageSections.forEach(function (section) {
            const isActive =
                section.dataset.pageContent === pageName;

            section.classList.toggle("active", isActive);

            section.hidden = !isActive;
        });
    }

    // ----------------------------------------------------------
    // 8. CLOSE MOBILE SIDEBAR
    // ----------------------------------------------------------
    // Uses the sidebar methods from VelvetDay when available.
    // ----------------------------------------------------------

    function closeMobileSidebar() {
        if (
            window.VelvetDay &&
            typeof VelvetDay.closeMobileSidebar === "function"
        ) {
            VelvetDay.closeMobileSidebar();
            return;
        }

        const sidebar = document.querySelector("#sidebar");
        const overlay = document.querySelector("#sidebarOverlay");

        if (sidebar) {
            sidebar.classList.remove("open");
        }

        if (overlay) {
            overlay.classList.remove("active");
        }

        document.body.classList.remove("sidebar-open");
    }

    // ----------------------------------------------------------
    // 9. NAVIGATE TO PAGE
    // ----------------------------------------------------------
    // This function delegates the actual page switching to
    // VelvetDay.navigate(), which is defined in app.js.
    //
    // It also manages our navigation state and history.
    // ----------------------------------------------------------

    function navigate(pageName, options = {}) {
        if (!pageExists(pageName)) {
            console.warn(
                `Velvet Day: Page "${pageName}" does not exist.`
            );

            return false;
        }

        const previousPage = state.currentPage;

        // Prevent unnecessary navigation to the same page
        if (
            previousPage === pageName &&
            !options.force
        ) {
            return true;
        }

        state.previousPage = previousPage;

        // Add previous page to history
        if (!options.fromHistory && previousPage) {
            state.history.push(previousPage);
        }

        state.currentPage = pageName;

        // Use the main application navigation function
        if (
            window.VelvetDay &&
            typeof VelvetDay.navigate === "function"
        ) {
            VelvetDay.navigate(pageName);
        } else {
            // Fallback if app.js navigation is unavailable
            updateActiveNavigation(pageName);
            showPageContent(pageName);
        }

        // Ensure title and subtitle are updated
        updatePageHeading(pageName);

        // Close mobile sidebar
        closeMobileSidebar();

        // Update browser history
        if (!options.fromHistory && options.updateBrowserHistory !== false) {
            try {
                history.pushState(
                    {
                        page: pageName
                    },
                    "",
                    `#${pageName}`
                );
            } catch (error) {
                console.warn(
                    "Velvet Day: Could not update browser history.",
                    error
                );
            }
        }

        // Notify other scripts
        document.dispatchEvent(
            new CustomEvent("velvet:navigation", {
                detail: {
                    page: pageName,
                    previousPage: previousPage
                }
            })
        );

        return true;
    }

    // ----------------------------------------------------------
    // 10. GO BACK TO PREVIOUS PAGE
    // ----------------------------------------------------------
    // Returns to the previous page stored in navigation history.
    // ----------------------------------------------------------

    function goBack() {
        if (state.history.length === 0) {
            navigate(config.defaultPage);
            return;
        }

        const previousPage = state.history.pop();

        navigate(previousPage, {
            fromHistory: true,
            updateBrowserHistory: false
        });
    }

    // ----------------------------------------------------------
    // 11. HANDLE BROWSER BACK/FORWARD BUTTONS
    // ----------------------------------------------------------
    // Listens to the browser's popstate event.
    //
    // This allows the user to navigate using the browser's
    // Back and Forward buttons.
    // ----------------------------------------------------------

    function handleBrowserHistory(event) {
        const pageName =
            event.state && event.state.page
                ? event.state.page
                : window.location.hash.replace("#", "");

        if (pageExists(pageName)) {
            navigate(pageName, {
                fromHistory: true,
                updateBrowserHistory: false,
                force: true
            });
        } else {
            navigate(config.defaultPage, {
                fromHistory: true,
                updateBrowserHistory: false,
                force: true
            });
        }
    }

    // ----------------------------------------------------------
    // 12. HANDLE NAVIGATION CLICK
    // ----------------------------------------------------------
    // Uses event delegation so dynamically created navigation
    // elements also work.
    // ----------------------------------------------------------

    function handleNavigationClick(event) {
        const navigationButton = event.target.closest("[data-page]");

        if (!navigationButton) {
            return;
        }

        const pageName = navigationButton.dataset.page;

        if (!pageName) {
            return;
        }

        event.preventDefault();

        navigate(pageName);
    }

    // ----------------------------------------------------------
    // 13. KEYBOARD SHORTCUTS
    // ----------------------------------------------------------
    // Alt + 1 -> Dashboard
    // Alt + 2 -> Tasks
    // Alt + 3 -> Brain Dump
    // Alt + 4 -> Notes
    // Alt + 5 -> Calendar
    //
    // Escape -> Close mobile sidebar
    // ----------------------------------------------------------

    function handleKeyboardShortcuts(event) {
        // Ignore shortcuts while typing in input fields
        const activeElement = document.activeElement;

        const isTyping =
            activeElement &&
            (
                activeElement.tagName === "INPUT" ||
                activeElement.tagName === "TEXTAREA" ||
                activeElement.tagName === "SELECT" ||
                activeElement.isContentEditable
            );

        // Escape closes mobile sidebar
        if (event.key === "Escape") {
            closeMobileSidebar();
            return;
        }

        if (isTyping) {
            return;
        }

        // Alt + number shortcuts
        if (event.altKey && !event.ctrlKey && !event.shiftKey) {
            const shortcutPages = {
                "1": "dashboard",
                "2": "tasks",
                "3": "brain",
                "4": "notes",
                "5": "calendar"
            };

            const pageName = shortcutPages[event.key];

            if (pageName) {
                event.preventDefault();
                navigate(pageName);
            }
        }
    }

    // ----------------------------------------------------------
    // 14. LISTEN FOR NAVIGATION FROM OTHER SCRIPTS
    // ----------------------------------------------------------
    // Other JavaScript files can request navigation by dispatching:
    //
    // document.dispatchEvent(
    //     new CustomEvent("velvet:go-to-page", {
    //         detail: { page: "notes" }
    //     })
    // );
    // ----------------------------------------------------------

    function handleExternalNavigation(event) {
        const pageName = event.detail && event.detail.page;

        if (pageName) {
            navigate(pageName);
        }
    }

    // ----------------------------------------------------------
    // 15. INITIALIZE NAVIGATION
    // ----------------------------------------------------------

    function initialize() {
        if (state.isInitialized) {
            return;
        }

        // Read the initial page from the URL
        const initialPage = window.location.hash.replace("#", "");

        const pageToOpen = pageExists(initialPage)
            ? initialPage
            : config.defaultPage;

        // Register click handler
        document.addEventListener(
            "click",
            handleNavigationClick
        );

        // Register browser history handler
        window.addEventListener(
            "popstate",
            handleBrowserHistory
        );

        // Register keyboard shortcuts
        document.addEventListener(
            "keydown",
            handleKeyboardShortcuts
        );

        // Register external navigation
        document.addEventListener(
            "velvet:go-to-page",
            handleExternalNavigation
        );

        // Initialize page
        navigate(pageToOpen, {
            force: true,
            updateBrowserHistory: false
        });

        // If no valid hash exists, set the default page hash
        if (!pageExists(initialPage)) {
            try {
                history.replaceState(
                    {
                        page: pageToOpen
                    },
                    "",
                    `#${pageToOpen}`
                );
            } catch (error) {
                console.warn(
                    "Velvet Day: Could not initialize browser history.",
                    error
                );
            }
        }

        state.isInitialized = true;

        console.log("✨ Velvet Day navigation initialized.");
    }

    // ----------------------------------------------------------
    // 16. PUBLIC API
    // ----------------------------------------------------------

    window.VelvetNavigation = {
        config: config,
        state: state,

        initialize: initialize,
        navigate: navigate,
        goBack: goBack,

        getCurrentPage: function () {
            return state.currentPage;
        },

        getPreviousPage: function () {
            return state.previousPage;
        },

        getPageInfo: getPageInfo,
        pageExists: pageExists
    };

    // ----------------------------------------------------------
    // 17. START NAVIGATION AFTER DOM IS READY
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
