
/* ==========================================================
   VELVET DAY - THEME MANAGER
   File: js/theme.js

   This file manages the visual themes of Velvet Day.

   Features:
   - Dark theme
   - Light theme
   - Theme switching
   - Save theme preference
   - Restore theme on refresh
   - Update theme toggle buttons
   - Theme change events
   - CSS custom property management

   Dependencies:
   - js/storage.js
   - js/utils.js
   - js/app.js

   ========================================================== */

(function () {
    "use strict";

    // ----------------------------------------------------------
    // 1. THEME CONFIGURATION
    // ----------------------------------------------------------
    // All theme colors are centralized here.
    //
    // If you want to change the appearance of the app later,
    // you can modify these colors without changing the JS logic.
    // ----------------------------------------------------------

    const themes = {

        // ------------------------------------------------------
        // DARK THEME
        // ------------------------------------------------------
        dark: {
            name: "Midnight Velvet",

            colors: {
                background: "#1C171B",
                backgroundSecondary: "#241D23",
                backgroundTertiary: "#2E252D",

                sidebar: "#211A21",
                card: "#2B222B",
                cardHover: "#342934",

                border: "#443544",

                text: "#F3EAF4",
                textSecondary: "#BDAEBD",
                textMuted: "#8E7D91",

                primary: "#B99ACD",
                primaryHover: "#CDB3DD",
                primarySoft: "#49364F",

                accent: "#D6B6DF",
                accentSoft: "#443247",

                success: "#A8C8A0",
                warning: "#E6C18B",
                danger: "#D997A7",

                inputBackground: "#322733",

                shadow: "rgba(0, 0, 0, 0.25)"
            }
        },

        // ------------------------------------------------------
        // LIGHT THEME
        // ------------------------------------------------------
        light: {
            name: "Soft Lavender",

            colors: {
                background: "#F7F3F7",
                backgroundSecondary: "#F0E9F1",
                backgroundTertiary: "#E8DFE9",

                sidebar: "#EFE6F0",
                card: "#FFFFFF",
                cardHover: "#F8F3F9",

                border: "#E4D8E7",

                text: "#493B4D",
                textSecondary: "#7F7084",
                textMuted: "#A092A5",

                primary: "#9275A5",
                primaryHover: "#7F6294",
                primarySoft: "#E8DDEE",

                accent: "#B79AC8",
                accentSoft: "#EEE4F2",

                success: "#779A72",
                warning: "#C39A5E",
                danger: "#C47F91",

                inputBackground: "#F6F0F7",

                shadow: "rgba(90, 65, 95, 0.08)"
            }
        }
    };

    // ----------------------------------------------------------
    // 2. THEME STATE
    // ----------------------------------------------------------

    let currentTheme = "dark";

    // ----------------------------------------------------------
    // 3. GET THE CURRENT THEME
    // ----------------------------------------------------------

    function getCurrentTheme() {
        return currentTheme;
    }

    // ----------------------------------------------------------
    // 4. GET THEME DETAILS
    // ----------------------------------------------------------
    // Returns the configuration of a requested theme.
    //
    // Example:
    // getThemeDetails("dark");
    // ----------------------------------------------------------

    function getThemeDetails(themeName) {
        return themes[themeName] || themes.dark;
    }

    // ----------------------------------------------------------
    // 5. APPLY CSS VARIABLES
    // ----------------------------------------------------------
    // Converts theme colors into CSS custom properties.
    //
    // Example:
    // --bg-primary
    // --bg-card
    // --text-primary
    // --accent-color
    //
    // These variables can be used throughout style.css.
    // ----------------------------------------------------------

    function applyCSSVariables(themeName) {
        const theme = getThemeDetails(themeName);

        const colors = theme.colors;

        const root = document.documentElement;

        // Main backgrounds
        root.style.setProperty("--bg-primary", colors.background);
        root.style.setProperty("--bg-secondary", colors.backgroundSecondary);
        root.style.setProperty("--bg-tertiary", colors.backgroundTertiary);

        // Layout backgrounds
        root.style.setProperty("--sidebar-bg", colors.sidebar);
        root.style.setProperty("--card-bg", colors.card);
        root.style.setProperty("--card-hover", colors.cardHover);

        // Borders
        root.style.setProperty("--border-color", colors.border);

        // Text
        root.style.setProperty("--text-primary", colors.text);
        root.style.setProperty("--text-secondary", colors.textSecondary);
        root.style.setProperty("--text-muted", colors.textMuted);

        // Primary colors
        root.style.setProperty("--primary-color", colors.primary);
        root.style.setProperty("--primary-hover", colors.primaryHover);
        root.style.setProperty("--primary-soft", colors.primarySoft);

        // Accent colors
        root.style.setProperty("--accent-color", colors.accent);
        root.style.setProperty("--accent-soft", colors.accentSoft);

        // Status colors
        root.style.setProperty("--success-color", colors.success);
        root.style.setProperty("--warning-color", colors.warning);
        root.style.setProperty("--danger-color", colors.danger);

        // Inputs
        root.style.setProperty("--input-bg", colors.inputBackground);

        // Shadows
        root.style.setProperty("--shadow-color", colors.shadow);
    }

    // ----------------------------------------------------------
    // 6. UPDATE THEME TOGGLE BUTTONS
    // ----------------------------------------------------------
    // Buttons with data-theme-toggle will automatically update.
    //
    // Expected HTML:
    // <button data-theme-toggle>
    //     <i data-lucide="sun"></i>
    // </button>
    // ----------------------------------------------------------

    function updateThemeButtons(themeName) {
        const buttons = document.querySelectorAll("[data-theme-toggle]");

        buttons.forEach(function (button) {
            const isDark = themeName === "dark";

            // Update tooltip
            button.title = isDark
                ? "Switch to light mode"
                : "Switch to dark mode";

            // Update accessibility label
            button.setAttribute(
                "aria-label",
                isDark
                    ? "Switch to light mode"
                    : "Switch to dark mode"
            );

            // Update icon if available
            const icon = button.querySelector("[data-lucide]");

            if (icon) {
                icon.setAttribute(
                    "data-lucide",
                    isDark ? "sun" : "moon"
                );
            }

            // Store the currently selected theme on the button
            button.dataset.currentTheme = themeName;
        });

        // Refresh Lucide icons if the library is available
        if (window.lucide && typeof window.lucide.createIcons === "function") {
            window.lucide.createIcons();
        }
    }

    // ----------------------------------------------------------
    // 7. APPLY THE THEME
    // ----------------------------------------------------------
    // Applies the selected theme to the entire application.
    //
    // This function:
    // - Validates the theme
    // - Updates CSS variables
    // - Updates document attributes
    // - Updates button icons
    // - Saves the user's preference
    // - Dispatches a theme change event
    // ----------------------------------------------------------

    function applyTheme(themeName, savePreference = true) {
        // Only allow themes that exist in the configuration
        if (!themes[themeName]) {
            themeName = "dark";
        }

        currentTheme = themeName;

        // Set the theme on the document
        document.documentElement.setAttribute(
            "data-theme",
            themeName
        );

        // Update theme classes
        document.documentElement.classList.remove(
            "theme-dark",
            "theme-light"
        );

        document.documentElement.classList.add(
            `theme-${themeName}`
        );

        // Update colors
        applyCSSVariables(themeName);

        // Update buttons
        updateThemeButtons(themeName);

        // Save preference
        if (savePreference && window.VelvetStorage) {
            const settings = VelvetStorage.get("settings") || {};

            VelvetStorage.set("settings", {
                ...settings,
                theme: themeName
            });
        }

        // Notify other scripts
        document.dispatchEvent(
            new CustomEvent("velvet:theme-changed", {
                detail: {
                    theme: themeName,
                    colors: themes[themeName].colors
                }
            })
        );

        return themeName;
    }

    // ----------------------------------------------------------
    // 8. TOGGLE THEME
    // ----------------------------------------------------------
    // Switches between dark and light theme.
    // ----------------------------------------------------------

    function toggleTheme() {
        const newTheme = currentTheme === "dark"
            ? "light"
            : "dark";

        return applyTheme(newTheme);
    }

    // ----------------------------------------------------------
    // 9. INITIALIZE THEME
    // ----------------------------------------------------------
    // Reads the saved theme from LocalStorage.
    //
    // If no saved theme exists, dark theme is used.
    // ----------------------------------------------------------

    function initialize() {
        let savedTheme = "dark";

        if (window.VelvetStorage) {
            const settings = VelvetStorage.get("settings");

            if (settings && themes[settings.theme]) {
                savedTheme = settings.theme;
            }
        }

        // Apply theme without saving again during initialization
        applyTheme(savedTheme, false);

        console.log(
            `💜 Velvet Day theme initialized: ${themes[savedTheme].name}`
        );
    }

    // ----------------------------------------------------------
    // 10. PUBLIC API
    // ----------------------------------------------------------
    // Other JavaScript files can use:
    //
    // VelvetTheme.applyTheme("dark");
    // VelvetTheme.applyTheme("light");
    // VelvetTheme.toggleTheme();
    // VelvetTheme.getCurrentTheme();
    // VelvetTheme.getThemeDetails("dark");
    // ----------------------------------------------------------

    window.VelvetTheme = {
        themes: themes,

        initialize: initialize,

        applyTheme: applyTheme,
        toggleTheme: toggleTheme,

        getCurrentTheme: getCurrentTheme,
        getThemeDetails: getThemeDetails,

        updateThemeButtons: updateThemeButtons
    };

    // ----------------------------------------------------------
    // 11. INITIALIZE
    // ----------------------------------------------------------
    // Run after the DOM has been parsed.
    // ----------------------------------------------------------

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize);
    } else {
        initialize();
    }

})();
