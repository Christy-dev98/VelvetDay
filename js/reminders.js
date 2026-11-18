
// ============================================================
// VELVET DAY - REMINDER MANAGER
// File: js/reminders.js
//
// Features:
// - Browser notification permissions
// - Task reminders
// - Upcoming task tracking
// - Reminder settings
// - Enable / disable reminders
// - Notification deduplication
// - Local storage persistence
// - Reminder dashboard
//
// NOTE:
// Browser notifications work best on localhost or HTTPS.
// This module requires VelvetStorage and VelvetTasks.
// ============================================================


// ============================================================
// 1. CONFIGURATION
// ============================================================

const VelvetRemindersConfig = {

    storageKey: "reminderSettings",

    notifiedStorageKey: "reminderNotificationsSent",

    selectors: {

        container: "#remindersContainer",

        permissionButton: "[data-reminder-action='permission']",

        toggleButton: "[data-reminder-action='toggle']",

        settingsForm: "#reminderSettingsForm",

        enabledInput: "#remindersEnabled",

        timeInput: "#reminderTime",

        advanceInput: "#reminderAdvance",

        saveButton: "[data-reminder-action='save']"
    },

    // How frequently the app checks for reminders
    checkInterval: 30 * 1000,

    // Default reminder time
    defaultReminderTime: "09:00",

    // Default reminder advance time
    defaultAdvanceMinutes: 15,

    // Available reminder advance options
    advanceOptions: [
        0,
        5,
        10,
        15,
        30,
        60
    ]
};


// ============================================================
// 2. REMINDER MANAGER
// ============================================================

const VelvetReminders = {

    // --------------------------------------------------------
    // State
    // --------------------------------------------------------

    settings: {

        enabled: true,

        reminderTime: "09:00",

        advanceMinutes: 15
    },

    notifiedReminders: [],

    intervalId: null,

    initialized: false,


    // --------------------------------------------------------
    // Initialize
    // --------------------------------------------------------

    initialize: function () {

        if (this.initialized) {
            return;
        }

        this.initialized = true;

        // Load reminder settings
        this.loadSettings();

        // Load already sent notifications
        this.loadNotifiedReminders();

        // Bind UI events
        this.bindEvents();

        // Update dashboard
        this.render();

        // Start checking reminders
        this.startChecking();

        // Check immediately
        this.checkReminders();

        console.log("Velvet Reminders initialized ♡");
    },


    // --------------------------------------------------------
    // Load settings
    // --------------------------------------------------------

    loadSettings: function () {

        try {

            const saved = VelvetStorage.get(
                VelvetRemindersConfig.storageKey
            );


            if (saved && typeof saved === "object") {

                this.settings = {

                    ...this.settings,

                    ...saved
                };
            }

        } catch (error) {

            console.error(
                "Unable to load reminder settings:",
                error
            );
        }
    },


    // --------------------------------------------------------
    // Save settings
    // --------------------------------------------------------

    saveSettings: function () {

        try {

            VelvetStorage.set(
                VelvetRemindersConfig.storageKey,
                this.settings
            );

            return true;

        } catch (error) {

            console.error(
                "Unable to save reminder settings:",
                error
            );

            this.showMessage(
                "Unable to save reminder settings.",
                "error"
            );

            return false;
        }
    },


    // --------------------------------------------------------
    // Load sent notification history
    // --------------------------------------------------------

    loadNotifiedReminders: function () {

        try {

            const saved = VelvetStorage.get(
                VelvetRemindersConfig.notifiedStorageKey
            );


            this.notifiedReminders = Array.isArray(saved)
                ? saved
                : [];

        } catch (error) {

            console.error(
                "Unable to load notification history:",
                error
            );

            this.notifiedReminders = [];
        }
    },


    // --------------------------------------------------------
    // Save notification history
    // --------------------------------------------------------

    saveNotifiedReminders: function () {

        try {

            VelvetStorage.set(
                VelvetRemindersConfig.notifiedStorageKey,
                this.notifiedReminders
            );

        } catch (error) {

            console.error(
                "Unable to save notification history:",
                error
            );
        }
    },


    // --------------------------------------------------------
    // Check notification support
    // --------------------------------------------------------

    isSupported: function () {

        return (
            "Notification" in window
        );
    },


    // --------------------------------------------------------
    // Get notification permission
    // --------------------------------------------------------

    getPermission: function () {

        if (!this.isSupported()) {
            return "unsupported";
        }


        return Notification.permission;
    },


    // --------------------------------------------------------
    // Request notification permission
    // --------------------------------------------------------

    requestPermission: async function () {

        if (!this.isSupported()) {

            this.showMessage(
                "Notifications are not supported by this browser.",
                "warning"
            );

            return false;
        }


        if (Notification.permission === "granted") {

            this.showMessage(
                "Notifications are already enabled ♡",
                "success"
            );

            this.render();

            return true;
        }


        if (Notification.permission === "denied") {

            this.showMessage(
                "Notifications are blocked. Enable them in your browser settings.",
                "warning"
            );

            this.render();

            return false;
        }


        try {

            const permission =
                await Notification.requestPermission();


            if (permission === "granted") {

                this.showMessage(
                    "Notifications enabled ♡",
                    "success"
                );

                this.sendNotification(
                    "Velvet Day ♡",
                    {
                        body: "Your reminders are ready.",
                        tag: "velvet-welcome"
                    }
                );

                this.render();

                return true;
            }


            this.showMessage(
                "Notification permission was not granted.",
                "warning"
            );


            this.render();

            return false;

        } catch (error) {

            console.error(
                "Notification permission error:",
                error
            );


            this.showMessage(
                "Unable to request notification permission.",
                "error"
            );


            return false;
        }
    },


    // --------------------------------------------------------
    // Send browser notification
    // --------------------------------------------------------

    sendNotification: function (title, options = {}) {

        if (!this.isSupported()) {
            return false;
        }


        if (Notification.permission !== "granted") {
            return false;
        }


        try {

            const notification = new Notification(
                title,
                {
                    body: options.body || "",

                    icon: options.icon || "",

                    badge: options.badge || "",

                    tag: options.tag || "velvet-day",

                    renotify: options.renotify || false,

                    requireInteraction:
                        options.requireInteraction || false
                }
            );


            // Handle notification click
            notification.onclick = function () {

                window.focus();

                notification.close();

                if (options.onClick) {
                    options.onClick();
                }
            };


            return true;

        } catch (error) {

            console.error(
                "Unable to send notification:",
                error
            );

            return false;
        }
    },


    // --------------------------------------------------------
    // Enable / disable reminders
    // --------------------------------------------------------

    toggleReminders: function (enabled) {

        const previousEnabled = this.settings.enabled;


        this.settings.enabled = Boolean(enabled);


        if (!this.saveSettings()) {

            this.settings.enabled = previousEnabled;

            return false;
        }


        if (this.settings.enabled) {

            this.startChecking();

            this.checkReminders();

        } else {

            this.stopChecking();
        }


        this.render();


        this.dispatchEvent(
            "velvet:reminder-settings-updated",
            {
                settings: this.settings
            }
        );


        this.showMessage(
            this.settings.enabled
                ? "Reminders enabled ♡"
                : "Reminders paused.",
            "success"
        );


        return true;
    },


    // --------------------------------------------------------
    // Update settings
    // --------------------------------------------------------

    updateSettings: function (newSettings = {}) {

        const previousSettings = {
            ...this.settings
        };


        this.settings = {

            ...this.settings,

            ...newSettings
        };


        // Validate reminder time
        if (
            !this.isValidTime(
                this.settings.reminderTime
            )
        ) {

            this.settings = previousSettings;

            this.showMessage(
                "Please select a valid reminder time.",
                "warning"
            );

            return false;
        }


        // Validate advance time
        const advanceMinutes = Number(
            this.settings.advanceMinutes
        );


        if (
            !VelvetRemindersConfig.advanceOptions.includes(
                advanceMinutes
            )
        ) {

            this.settings = previousSettings;

            this.showMessage(
                "Invalid reminder advance time.",
                "warning"
            );

            return false;
        }


        if (!this.saveSettings()) {

            this.settings = previousSettings;

            return false;
        }


        this.render();


        this.dispatchEvent(
            "velvet:reminder-settings-updated",
            {
                settings: this.settings
            }
        );


        this.showMessage(
            "Reminder settings saved ♡",
            "success"
        );


        return true;
    },


    // --------------------------------------------------------
    // Validate time
    // --------------------------------------------------------

    isValidTime: function (time) {

        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(
            String(time || "")
        );
    },


    // --------------------------------------------------------
    // Start checking reminders
    // --------------------------------------------------------

    startChecking: function () {

        this.stopChecking();


        if (!this.settings.enabled) {
            return;
        }


        this.intervalId = window.setInterval(
            () => this.checkReminders(),
            VelvetRemindersConfig.checkInterval
        );
    },


    // --------------------------------------------------------
    // Stop checking reminders
    // --------------------------------------------------------

    stopChecking: function () {

        if (this.intervalId !== null) {

            window.clearInterval(
                this.intervalId
            );

            this.intervalId = null;
        }
    },


    // --------------------------------------------------------
    // Check tasks for reminders
    // --------------------------------------------------------

   
// Corrected reminder check
checkReminders: function () {

    if (!this.settings.enabled) {
        return;
    }

    if (
        !window.VelvetTasks ||
        typeof VelvetTasks.getTasks !== "function"
    ) {
        return;
    }

    const tasks = VelvetTasks.getTasks();
    const now = new Date();

    tasks.forEach(task => {

        if (task.completed || !task.dueDate) {
            return;
        }

        const dueValue = String(task.dueDate);

        let reminderDate;

        // Date-only tasks use the configured reminder time.
        if (/^\d{4}-\d{2}-\d{2}$/.test(dueValue)) {

            const [year, month, day] =
                dueValue.split("-").map(Number);

            const [hours, minutes] =
                this.settings.reminderTime.split(":").map(Number);

            reminderDate = new Date(
                year,
                month - 1,
                day,
                hours,
                minutes,
                0,
                0
            );

        } else {

            // Date/time tasks are reminded before their due time.
            const dueDate = new Date(dueValue);

            if (Number.isNaN(dueDate.getTime())) {
                return;
            }

            reminderDate = new Date(
                dueDate.getTime() -
                Number(this.settings.advanceMinutes) * 60 * 1000
            );
        }

        // Notify during the first check window after the reminder time.
        const windowEnd = new Date(
            reminderDate.getTime() +
            VelvetRemindersConfig.checkInterval
        );

        if (now >= reminderDate && now <= windowEnd) {
            this.notifyTask(task);
        }
    });
},



    // --------------------------------------------------------
    // Notify for task
    // --------------------------------------------------------

    notifyTask: function (task) {

        const notificationKey = this.getNotificationKey(
            task
        );


        // Avoid duplicate notifications
        if (
            this.notifiedReminders.includes(
                notificationKey
            )
        ) {
            return false;
        }


        const sent = this.sendNotification(
            "Task reminder ♡",
            {
                body: `Don't forget: ${task.title}`,

                tag: notificationKey,

                requireInteraction: false
            }
        );


        if (!sent) {
            return false;
        }


        // Mark notification as sent
        this.notifiedReminders.push(
            notificationKey
        );


        this.saveNotifiedReminders();


        this.dispatchEvent(
            "velvet:reminder-sent",
            {
                task: task
            }
        );


        return true;
    },


    // --------------------------------------------------------
    // Create notification key
    // --------------------------------------------------------

    getNotificationKey: function (task) {

        const dueDate = String(
            task.dueDate || ""
        );


        return `${task.id}-${dueDate}`;
    },


    // --------------------------------------------------------
    // Get upcoming tasks
    // --------------------------------------------------------

    getUpcomingTasks: function () {

        if (
            !window.VelvetTasks ||
            typeof VelvetTasks.getTasks !== "function"
        ) {
        return [];
        }


        const now = new Date();


        return VelvetTasks.getTasks()
            .filter(task => {

                if (
                    task.completed ||
                    !task.dueDate
                ) {
                    return false;
                }


                const dueDate = this.parseDate(
                    task.dueDate
                );


                if (!dueDate) {
                    return false;
                }


                return dueDate >= now;

            })
            .sort((a, b) => {

                return (
                    this.parseDate(a.dueDate) -
                    this.parseDate(b.dueDate)
                );
            });
    },


    // --------------------------------------------------------
    // Get overdue tasks
    // --------------------------------------------------------

    getOverdueTasks: function () {

        if (
            !window.VelvetTasks ||
            typeof VelvetTasks.getTasks !== "function"
        ) {
            return [];
        }


        const now = new Date();


        return VelvetTasks.getTasks()
            .filter(task => {

                if (
                    task.completed ||
                    !task.dueDate
                ) {
                    return false;
                }


                const dueDate = this.parseDate(
                    task.dueDate
                );


                return (
                    dueDate &&
                    dueDate < now
                );
        });
    },


    // --------------------------------------------------------
    // Render reminders dashboard
    // --------------------------------------------------------

    render: function () {

        const container = document.querySelector(
            VelvetRemindersConfig.selectors.container
        );


        if (!container) {
            return;
        }


        const upcomingTasks = this.getUpcomingTasks();

        const overdueTasks = this.getOverdueTasks();

        const permission = this.getPermission();


        container.innerHTML = `

            <div class="notification-permission-card">

                <div class="notification-permission-info">

                    <div class="notification-permission-icon">
                        <i data-lucide="bell-ring"></i>
                    </div>

                    <div>

                        <h3>Browser Notifications</h3>

                        <p>
                            ${this.escapeHTML(
                                this.getPermissionLabel(permission)
                            )}
                        </p>

                    </div>

                </div>


                ${permission !== "granted"
                    ? `
                        <button
                            type="button"
                            class="primary-button"
                            data-reminder-action="permission"
                        >
                            Enable Notifications
                        </button>
                    `
                    : `
                        <span class="badge">
                            Notifications Enabled
                        </span>
                    `
                }

            </div>


            <div class="reminder-settings-card dashboard-card">

                <div class="card-header">

                    <h3>Reminder Settings</h3>

                    <button
                        type="button"
                        class="secondary-button"
                        data-reminder-action="toggle"
                    >
                        ${this.settings.enabled ? "Pause Reminders" : "Enable Reminders"}
                    </button>

                </div>


                <div class="reminder-setting-row">

                    <span>Reminders</span>

                    <span class="badge">
                        ${this.settings.enabled ? "Enabled" : "Disabled"}
                    </span>

                </div>


                <div class="reminder-setting-row">

                    <span>Default reminder time</span>

                    <strong>
                        ${this.escapeHTML(this.settings.reminderTime)}
                    </strong>

                </div>


                <div class="reminder-setting-row">

                    <span>Notify before due time</span>

                    <strong>
                        ${Number(this.settings.advanceMinutes)} minutes
                    </strong>

                </div>

            </div>


            <div class="dashboard-card reminder-list-card">

                <div class="card-header">

                    <h3>Upcoming Tasks</h3>

                    <span class="badge">
                        ${upcomingTasks.length}
                    </span>

                </div>


                ${upcomingTasks.length > 0
                    ? upcomingTasks.slice(0, 10).map(task => `

                        <div class="reminder-card">

                            <div class="reminder-card-content">

                                <h4>
                                    ${this.escapeHTML(task.title)}
                                </h4>

                                <span class="reminder-date">
                                    ${this.escapeHTML(this.formatDate(task.dueDate))}
                                </span>

                            </div>

                        </div>

                    `).join("")
                    : `
                        <div class="empty-state">

                            <p>
                                No upcoming tasks. Enjoy your free time ♡
                            </p>

                        </div>
                    `
                }

            </div>


            <div class="dashboard-card reminder-list-card">

                <div class="card-header">

                    <h3>Overdue Tasks</h3>

                    <span class="badge">
                        ${overdueTasks.length}
                    </span>

                </div>


                ${overdueTasks.length > 0
                    ? overdueTasks.map(task => `

                        <div class="reminder-card overdue">

                            <div class="reminder-card-content">

                                <h4>
                                    ${this.escapeHTML(task.title)}
                                </h4>

                                <span class="reminder-date">
                                    ${this.escapeHTML(this.formatDate(task.dueDate))}
                                </span>

                            </div>

                        </div>

                    `).join("")
                    : `
                        <div class="empty-state">

                            <p>
                                You're all caught up. No overdue tasks ♡
                            </p>

                        </div>
                    `
                }

            </div>

        `;


        this.refreshIcons();
    },


    // --------------------------------------------------------
    // Permission label
    // --------------------------------------------------------

    getPermissionLabel: function (permission) {

        switch (permission) {

            case "granted":

                return "Notifications are enabled.";


            case "denied":

                return "Notifications are blocked in your browser.";


            case "default":

                return "Permission is needed to send notifications.";


            case "unsupported":

                return "Your browser does not support notifications.";


            default:

                return "Notification status unavailable.";
        }
    },


    // --------------------------------------------------------
    // Bind UI events
    // --------------------------------------------------------

    bindEvents: function () {

        document.addEventListener("click", (event) => {

            const button = event.target.closest(
                "[data-reminder-action]"
            );


            if (!button) {
                return;
            }


            const action = button.dataset.reminderAction;


            switch (action) {

                case "permission":

                    this.requestPermission();

                    break;


                case "toggle":

                    this.toggleReminders(
                        !this.settings.enabled
                    );

                    break;


                case "save":

                    this.saveFormSettings();

                    break;
            }
        });


        // Settings form
        const form = document.querySelector(
            VelvetRemindersConfig.selectors.settingsForm
        );


        if (form) {

            form.addEventListener("submit", (event) => {

                event.preventDefault();

                this.saveFormSettings();
            });
        }


        // Refresh when tasks change
        document.addEventListener(
            "velvet:tasks-updated",
            () => {

                this.checkReminders();

                this.render();
            }
        );


        document.addEventListener(
            "velvet:data-reloaded",
            () => {

                this.checkReminders();

                this.render();
            }
        );


        // When tab becomes active again, check notifications
        document.addEventListener(
            "visibilitychange",
            () => {

                if (!document.hidden) {

                    this.checkReminders();

                    this.render();
                }
            }
        );
    },


    // --------------------------------------------------------
    // Save form settings
    // --------------------------------------------------------

    saveFormSettings: function () {

        const timeInput = document.querySelector(
            VelvetRemindersConfig.selectors.timeInput
        );


        const advanceInput = document.querySelector(
            VelvetRemindersConfig.selectors.advanceInput
        );


        const enabledInput = document.querySelector(
            VelvetRemindersConfig.selectors.enabledInput
        );


        const newSettings = {};


        if (timeInput) {

            newSettings.reminderTime =
                timeInput.value;
        }


        if (advanceInput) {

            newSettings.advanceMinutes =
                Number(advanceInput.value);
        }


        if (enabledInput) {

            newSettings.enabled =
                enabledInput.checked;
        }


        return this.updateSettings(
            newSettings
        );
    },


    // --------------------------------------------------------
    // Parse task due date
    // --------------------------------------------------------

    parseDate: function (dateValue) {

        if (!dateValue) {
            return null;
        }


        // Supports date-only values and datetime values
        const value = String(dateValue);


        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {

            const [year, month, day] =
                value.split("-").map(Number);


            return new Date(
                year,
                month - 1,
                day,
                23,
                59,
                59,
                999
            );
        }


        const date = new Date(value);


        return Number.isNaN(date.getTime())
            ? null
            : date;
    },


    // --------------------------------------------------------
    // Format date
    // --------------------------------------------------------

    formatDate: function (dateValue) {

        const date = this.parseDate(dateValue);


        if (!date) {
            return "No date";
        }


        return date.toLocaleDateString(
            undefined,
            {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );
    },


    // --------------------------------------------------------
    // Escape HTML
    // --------------------------------------------------------

    escapeHTML: function (value) {

        const div = document.createElement("div");

        div.textContent = String(value ?? "");

        return div.innerHTML;
    },


    // --------------------------------------------------------
    // Refresh Lucide icons
    // --------------------------------------------------------

    refreshIcons: function () {

        if (
            window.lucide &&
            typeof window.lucide.createIcons === "function"
        ) {

            window.lucide.createIcons();
        }
    },


    // --------------------------------------------------------
    // Show message
    // --------------------------------------------------------

    showMessage: function (message, type = "info") {

        if (
            window.VelvetToast &&
            typeof window.VelvetToast.show === "function"
        ) {

            window.VelvetToast.show(message, type);

            return;
        }


        console.log(
            `[${type.toUpperCase()}] ${message}`
        );
    },


    // --------------------------------------------------------
    // Dispatch custom event
    // --------------------------------------------------------

    dispatchEvent: function (eventName, detail = {}) {

        document.dispatchEvent(
            new CustomEvent(eventName, {
                detail: detail
            })
        );
    }

};


// ============================================================
// 3. EXPOSE REMINDER MANAGER
// ============================================================

window.VelvetReminders = VelvetReminders;


// ============================================================
// 4. INITIALIZE WHEN DOM IS READY
// ============================================================

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        () => VelvetReminders.initialize(),
        { once: true }
    );

} else {

    VelvetReminders.initialize();
}

