
// ============================================================
// VELVET DAY - SETTINGS MANAGER
// File: js/settings.js
//
// Features:
// - Dark / light theme
// - Reminder preferences
// - Default reminder time
// - Data export / backup
// - Data import / restore
// - Clear all app data
// - Reset preferences
// - Local storage management
//
// Dependencies:
// - storage.js
// - theme.js
// - reminders.js (optional)
// ============================================================


// ============================================================
// 1. CONFIGURATION
// ============================================================

const VelvetSettingsConfig = {

    settingsKey: "settings",

    defaultSettings: {

        theme: "dark",

        remindersEnabled: true,

        reminderTime: "09:00",

        advanceMinutes: 15,

        startWeekOnMonday: true,

        showCompletedTasks: true,

        compactMode: false
    },

    selectors: {

        themeToggle: "[data-settings-theme]",

        settingsForm: "#settingsForm",

        remindersEnabled: "#settingsRemindersEnabled",

        reminderTime: "#settingsReminderTime",

        advanceMinutes: "#settingsAdvanceMinutes",

        weekStart: "#settingsWeekStart",

        showCompleted: "#settingsShowCompleted",

        compactMode: "#settingsCompactMode",

        saveButton: "[data-settings-action='save']",

        exportButton: "[data-settings-action='export']",

        importButton: "[data-settings-action='import']",

        importInput: "#settingsImportFile",

        resetButton: "[data-settings-action='reset']",

        clearDataButton: "[data-settings-action='clear-data']"
    }
};


// ============================================================
// 2. SETTINGS MANAGER
// ============================================================

const VelvetSettings = {

    // --------------------------------------------------------
    // State
    // --------------------------------------------------------

    settings: {},

    initialized: false,


    // --------------------------------------------------------
    // Initialize
    // --------------------------------------------------------

    initialize: function () {

        if (this.initialized) {
            return;
        }

        this.initialized = true;

        // Load saved settings
        this.loadSettings();

        // Bind events
        this.bindEvents();

        // Fill settings form
        this.populateForm();

        console.log("Velvet Settings initialized ♡");
    },


    // --------------------------------------------------------
    // Load settings
    // --------------------------------------------------------

    loadSettings: function () {

        try {

            const saved = VelvetStorage.get(
                VelvetSettingsConfig.settingsKey
            );

            this.settings = {

                ...VelvetSettingsConfig.defaultSettings,

                ...(saved && typeof saved === "object"
                    ? saved
                    : {})
            };

        } catch (error) {

            console.error(
                "Unable to load settings:",
                error
            );

            this.settings = {
                ...VelvetSettingsConfig.defaultSettings
            };
        }

        return this.settings;
    },


    // --------------------------------------------------------
    // Save settings
    // --------------------------------------------------------

    saveSettings: function () {

        try {

            VelvetStorage.set(
                VelvetSettingsConfig.settingsKey,
                this.settings
            );

            this.dispatchEvent(
                "velvet:settings-updated",
                {
                    settings: this.settings
                }
            );

            return true;

        } catch (error) {

            console.error(
                "Unable to save settings:",
                error
            );

            this.showMessage(
                "Unable to save settings.",
                "error"
            );

            return false;
        }
    },


    // --------------------------------------------------------
    // Get settings
    // --------------------------------------------------------

    getSettings: function () {

        return {
            ...this.settings
        };
    },


    // --------------------------------------------------------
    // Update a single setting
    // --------------------------------------------------------

    updateSetting: function (key, value) {

        if (!Object.prototype.hasOwnProperty.call(
            VelvetSettingsConfig.defaultSettings,
            key
        )) {

            console.warn(
                `Unknown setting: ${key}`
            );

            return false;
        }


        const previousValue = this.settings[key];


        this.settings[key] = value;


        if (!this.saveSettings()) {

            this.settings[key] = previousValue;

            return false;
        }


        this.applySetting(
            key,
            value
        );


        this.populateForm();


        return true;
    },


    // --------------------------------------------------------
    // Update multiple settings
    // --------------------------------------------------------

    updateSettings: function (newSettings = {}) {

        const previousSettings = {
            ...this.settings
        };


        this.settings = {

            ...this.settings,

            ...newSettings
        };


        if (!this.validateSettings()) {

            this.settings = previousSettings;

            this.populateForm();

            return false;
        }


        if (!this.saveSettings()) {

            this.settings = previousSettings;

            this.populateForm();

            return false;
        }


        // Apply each updated setting
        Object.keys(newSettings).forEach(key => {

            this.applySetting(
                key,
                this.settings[key]
            );
        });


        this.populateForm();


        this.showMessage(
            "Settings saved successfully ♡",
            "success"
        );


        return true;
    },


    // --------------------------------------------------------
    // Validate settings
    // --------------------------------------------------------

    validateSettings: function () {

        const settings = this.settings;


        // Theme validation
        if (
            !["dark", "light"].includes(
                settings.theme
            )
        ) {

            this.showMessage(
                "Invalid theme selected.",
                "warning"
            );

            return false;
        }


        // Reminder time validation
        if (
            !/^([01]\d|2[0-3]):([0-5]\d)$/.test(
                settings.reminderTime
            )
        ) {

            this.showMessage(
                "Please select a valid reminder time.",
                "warning"
            );

            return false;
        }


        // Advance minutes validation
        const validAdvanceMinutes = [
            0,
            5,
            10,
            15,
            30,
            60
        ];


        if (
            !validAdvanceMinutes.includes(
                Number(settings.advanceMinutes)
            )
        ) {

            this.showMessage(
                "Invalid reminder advance time.",
                "warning"
            );

            return false;
        }


        // Boolean validation
        const booleanKeys = [

            "remindersEnabled",

            "startWeekOnMonday",

            "showCompletedTasks",

            "compactMode"
        ];


        for (const key of booleanKeys) {

            if (
                typeof settings[key] !== "boolean"
            ) {

                this.showMessage(
                    `Invalid value for ${key}.`,
                    "warning"
                );

                return false;
            }
        }


        return true;
    },


    // --------------------------------------------------------
    // Apply individual settings
    // --------------------------------------------------------

    applySetting: function (key, value) {

        switch (key) {

            case "theme":

                if (
                    window.VelvetTheme &&
                    typeof VelvetTheme.applyTheme === "function"
                ) {

                    VelvetTheme.applyTheme(value);
                }

                break;


            case "remindersEnabled":

                if (
                    window.VelvetReminders &&
                    typeof VelvetReminders.toggleReminders === "function"
                ) {

                    VelvetReminders.toggleReminders(value);
                }

                break;


            case "reminderTime":

            case "advanceMinutes":

                if (
                    window.VelvetReminders &&
                    typeof VelvetReminders.updateSettings === "function"
                ) {

                    VelvetReminders.updateSettings({

                        reminderTime:
                            this.settings.reminderTime,

                        advanceMinutes:
                            Number(this.settings.advanceMinutes)
                    });
                }

                break;


            case "startWeekOnMonday":

                this.dispatchEvent(
                    "velvet:week-start-updated",
                    {
                        monday: value
                    }
                );

                break;


            case "showCompletedTasks":

                this.dispatchEvent(
                    "velvet:completed-visibility-updated",
                    {
                        showCompleted: value
                    }
                );

                break;


            case "compactMode":

                document.body.classList.toggle(
                    "compact-mode",
                    value
                );

                break;
        }
    },


    // --------------------------------------------------------
    // Populate settings form
    // --------------------------------------------------------

    populateForm: function () {

        const settings = this.settings;


        this.setInputValue(
            VelvetSettingsConfig.selectors.remindersEnabled,
            settings.remindersEnabled
        );


        this.setInputValue(
            VelvetSettingsConfig.selectors.reminderTime,
            settings.reminderTime
        );


        this.setInputValue(
            VelvetSettingsConfig.selectors.advanceMinutes,
            settings.advanceMinutes
        );


        this.setInputValue(
            VelvetSettingsConfig.selectors.weekStart,
            settings.startWeekOnMonday
                ? "monday"
                : "sunday"
        );


        this.setInputValue(
            VelvetSettingsConfig.selectors.showCompleted,
            settings.showCompletedTasks
        );


        this.setInputValue(
            VelvetSettingsConfig.selectors.compactMode,
            settings.compactMode
        );


        this.updateThemeButtons();
    },


    // --------------------------------------------------------
    // Set input value
    // --------------------------------------------------------

    setInputValue: function (selector, value) {

        const element = document.querySelector(
            selector
        );


        if (!element) {
            return;
        }


        if (element.type === "checkbox") {

            element.checked = Boolean(value);

        } else {

            element.value = value;
        }
    },


    // --------------------------------------------------------
    // Save settings form
    // --------------------------------------------------------

    saveForm: function () {

        const remindersEnabled = this.getInputValue(
            VelvetSettingsConfig.selectors.remindersEnabled
        );


        const reminderTime = this.getInputValue(
            VelvetSettingsConfig.selectors.reminderTime
        );


        const advanceMinutes = this.getInputValue(
            VelvetSettingsConfig.selectors.advanceMinutes
        );


        const weekStart = this.getInputValue(
            VelvetSettingsConfig.selectors.weekStart
        );


        const showCompletedTasks = this.getInputValue(
            VelvetSettingsConfig.selectors.showCompleted
        );


        const compactMode = this.getInputValue(
            VelvetSettingsConfig.selectors.compactMode
        );


        const newSettings = {

            remindersEnabled:
                remindersEnabled !== null
                    ? Boolean(remindersEnabled)
                    : this.settings.remindersEnabled,

            reminderTime:
                reminderTime || this.settings.reminderTime,

            advanceMinutes:
                advanceMinutes !== null
                    ? Number(advanceMinutes)
                    : this.settings.advanceMinutes,

            startWeekOnMonday:
                weekStart
                    ? weekStart === "monday"
                    : this.settings.startWeekOnMonday,

            showCompletedTasks:
                showCompletedTasks !== null
                    ? Boolean(showCompletedTasks)
                    : this.settings.showCompletedTasks,

            compactMode:
                compactMode !== null
                    ? Boolean(compactMode)
                    : this.settings.compactMode
        };


        return this.updateSettings(
            newSettings
        );
    },


    // --------------------------------------------------------
    // Get input value
    // --------------------------------------------------------

    getInputValue: function (selector) {

        const element = document.querySelector(
            selector
        );


        if (!element) {
            return null;
        }


        if (element.type === "checkbox") {

            return element.checked;
        }


        return element.value;
    },


    // --------------------------------------------------------
    // Toggle theme
    // --------------------------------------------------------

    toggleTheme: function () {

        if (
            !window.VelvetTheme ||
            typeof VelvetTheme.toggleTheme !== "function"
        ) {

            this.showMessage(
                "Theme manager is unavailable.",
                "error"
            );

            return;
        }


        const theme = VelvetTheme.toggleTheme();


        this.settings.theme = theme;


        this.saveSettings();


        this.updateThemeButtons();


        return theme;
    },


    // --------------------------------------------------------
    // Set theme
    // --------------------------------------------------------

    setTheme: function (theme) {

        if (
            !["dark", "light"].includes(theme)
        ) {

            return false;
        }


        this.settings.theme = theme;


        if (
            window.VelvetTheme &&
            typeof VelvetTheme.applyTheme === "function"
        ) {

            VelvetTheme.applyTheme(theme);
        }


        this.saveSettings();


        this.updateThemeButtons();


        return true;
    },


    // --------------------------------------------------------
    // Update theme buttons
    // --------------------------------------------------------

    updateThemeButtons: function () {

        document.querySelectorAll(
            VelvetSettingsConfig.selectors.themeToggle
        ).forEach(button => {

            const theme = this.settings.theme;


            button.setAttribute(
                "aria-label",
                theme === "dark"
                    ? "Switch to light theme"
                    : "Switch to dark theme"
            );


            button.setAttribute(
                "title",
                theme === "dark"
                    ? "Switch to light theme"
                    : "Switch to dark theme"
            );
        });
    },


    // --------------------------------------------------------
    // Export application data
    // --------------------------------------------------------

    exportData: function () {

        try {

            const backup = {

                application: "Velvet Day",

                version: "1.0.0",

                exportedAt: new Date().toISOString(),

                data: {}
            };


            // Export all Velvet Day local storage values
            for (
                let i = 0;
                i < localStorage.length;
                i++
            ) {

                const key = localStorage.key(i);


                if (!key) {
                    continue;
                }


                const value = localStorage.getItem(
                    key
                );


                backup.data[key] = value;
            }


            const json = JSON.stringify(
                backup,
                null,
                2
            );


            const blob = new Blob(
                [json],
                {
                    type: "application/json"
                }
            );


            const url = URL.createObjectURL(
                blob
            );


            const link = document.createElement(
                "a"
            );


            const date = new Date()
                .toISOString()
                .slice(0, 10);


            link.href = url;


            link.download =
                `velvet-day-backup-${date}.json`;


            document.body.appendChild(
                link
            );


            link.click();


            link.remove();


            URL.revokeObjectURL(
                url
            );


            this.showMessage(
                "Your backup has been downloaded ♡",
                "success"
            );


            return true;

        } catch (error) {

            console.error(
                "Data export failed:",
                error
            );


            this.showMessage(
                "Unable to export data.",
                "error"
            );


            return false;
        }
    },


    // --------------------------------------------------------
    // Import application data
    // --------------------------------------------------------

    importData: function (file) {

        if (!file) {

            this.showMessage(
                "Please select a backup file.",
                "warning"
            );

            return;
        }


        const reader = new FileReader();


        reader.onload = (event) => {

            try {

                const backup = JSON.parse(
                    event.target.result
                );


                if (
                    !backup ||
                    !backup.data ||
                    typeof backup.data !== "object"
                ) {

                    throw new Error(
                        "Invalid backup format."
                    );
                }


                const confirmed = window.confirm(
                    "Importing a backup will replace your current Velvet Day data. Continue?"
                );


                if (!confirmed) {
                    return;
                }


                // Restore values from backup
                Object.entries(
                    backup.data
                ).forEach(([key, value]) => {

                    localStorage.setItem(
                        key,
                        value
                    );
                });


                this.showMessage(
                    "Backup imported successfully. Reloading ♡",
                    "success"
                );


                window.setTimeout(
                    () => window.location.reload(),
                    800
                );

            } catch (error) {

                console.error(
                    "Data import failed:",
                    error
                );


                this.showMessage(
                    "Invalid backup file or import failed.",
                    "error"
                );
            }
        };


        reader.onerror = () => {

            this.showMessage(
                "Unable to read backup file.",
                "error"
            );
        };


        reader.readAsText(
            file
        );
    },


    // --------------------------------------------------------
    // Reset settings
    // --------------------------------------------------------

    resetSettings: function () {

        const confirmed = window.confirm(
            "Reset all preferences to their default values?"
        );


        if (!confirmed) {
            return false;
        }


        this.settings = {

            ...VelvetSettingsConfig.defaultSettings
        };


        if (!this.saveSettings()) {
            return false;
        }


        // Apply default theme
        this.applySetting(
            "theme",
            this.settings.theme
        );


        // Apply default reminder settings
        this.applySetting(
            "remindersEnabled",
            this.settings.remindersEnabled
        );


        this.applySetting(
            "reminderTime",
            this.settings.reminderTime
        );


        this.applySetting(
            "advanceMinutes",
            this.settings.advanceMinutes
        );


        this.applySetting(
            "compactMode",
            this.settings.compactMode
        );


        this.populateForm();


        this.showMessage(
            "Settings restored to default ♡",
            "success"
        );


        return true;
    },


    // --------------------------------------------------------
    // Clear all application data
    // --------------------------------------------------------

    clearAllData: function () {

        const confirmed = window.confirm(
            "This will permanently delete all Velvet Day tasks, notes, checklists, recurring tasks, and settings from this browser. This cannot be undone. Continue?"
        );


        if (!confirmed) {
            return false;
        }


        const secondConfirmation = window.confirm(
            "Are you absolutely sure? Please export a backup first if you want to keep your data."
        );


        if (!secondConfirmation) {
            return false;
        }


        // Clear local storage
        localStorage.clear();


        // Clear session storage if used
        sessionStorage.clear();


        this.showMessage(
            "All app data cleared. Reloading...",
            "success"
        );


        window.setTimeout(
            () => window.location.reload(),
            800
        );


        return true;
    },


    // --------------------------------------------------------
    // Bind events
    // --------------------------------------------------------

    bindEvents: function () {

        // Theme toggle
        document.addEventListener(
            "click",
            (event) => {

                const button = event.target.closest(
                    VelvetSettingsConfig.selectors.themeToggle
                );


                if (!button) {
                    return;
                }


                event.preventDefault();


                this.toggleTheme();
            }
        );


        // Settings form
        const form = document.querySelector(
            VelvetSettingsConfig.selectors.settingsForm
        );


        if (form) {

            form.addEventListener(
                "submit",
                (event) => {

                    event.preventDefault();

                    this.saveForm();
                }
            );
        }


        // Settings action buttons
        document.addEventListener(
            "click",
            (event) => {

                const button = event.target.closest(
                    "[data-settings-action]"
                );


                if (!button) {
                    return;
                }


                const action =
                    button.dataset.settingsAction;


                switch (action) {

                    case "save":

                        this.saveForm();

                        break;


                    case "export":

                        this.exportData();

                        break;


                    case "import":

                        this.openImportPicker();

                        break;


                    case "reset":

                        this.resetSettings();

                        break;


                    case "clear-data":

                        this.clearAllData();

                        break;
                }
            }
        );


        // File import
        const importInput = document.querySelector(
            VelvetSettingsConfig.selectors.importInput
        );


        if (importInput) {

            importInput.addEventListener(
                "change",
                (event) => {

                    const file =
                        event.target.files?.[0];


                    if (file) {

                        this.importData(
                            file
                        );
                    }


                    // Allow selecting same file again
                    event.target.value = "";
                }
            );
        }
    },


    // --------------------------------------------------------
    // Open backup file picker
    // --------------------------------------------------------

    openImportPicker: function () {

        const input = document.querySelector(
            VelvetSettingsConfig.selectors.importInput
        );


        if (!input) {

            this.showMessage(
                "Import file input is missing from HTML.",
                "warning"
            );

            return;
        }


        input.click();
    },


    // --------------------------------------------------------
    // Dispatch custom events
    // --------------------------------------------------------

    dispatchEvent: function (
        eventName,
        detail = {}
    ) {

        document.dispatchEvent(
            new CustomEvent(
                eventName,
                {
                    detail: detail
                }
            )
        );
    },


    // --------------------------------------------------------
    // Show message
    // --------------------------------------------------------

    showMessage: function (
        message,
        type = "info"
    ) {

        if (
            window.VelvetToast &&
            typeof VelvetToast.show === "function"
        ) {

            VelvetToast.show(
                message,
                type
            );

            return;
        }


        console.log(
            `[${type.toUpperCase()}] ${message}`
        );
    }

};


// ============================================================
// 3. EXPOSE SETTINGS MANAGER
// ============================================================

window.VelvetSettings = VelvetSettings;


// ============================================================
// 4. INITIALIZE WHEN DOM IS READY
// ============================================================

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        () => VelvetSettings.initialize(),
        { once: true }
    );

} else {

    VelvetSettings.initialize();
}
