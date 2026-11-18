

// ============================================================
// VELVET DAY - RECURRING TASK MANAGER
// File: js/recurring.js
//
// Features:
// - Daily, weekly, monthly, yearly recurring tasks
// - Start and end dates
// - Enable / disable recurring schedules
// - Automatic task generation
// - Duplicate prevention
// - Local storage persistence
// - Recurring task overview
// ============================================================


// ============================================================
// 1. CONFIGURATION
// ============================================================

const VelvetRecurringConfig = {

    storageKey: "recurringTasks",

    selectors: {

        container: "#recurringContainer",

        form: "#recurringForm",

        modal: "#recurringModal",

        addButton: "[data-add-recurring]",

        closeButton: '[data-recurring-action="close"]',

        titleInput: "#recurringTitle",

        descriptionInput: "#recurringDescription",

        categoryInput: "#recurringCategory",

        priorityInput: "#recurringPriority",

        frequencyInput: "#recurringFrequency",

        startDateInput: "#recurringStartDate",

        endDateInput: "#recurringEndDate",

        weeklyDayInput: "#recurringWeekday",

        monthlyDayInput: "#recurringMonthDay",

        yearlyMonthInput: "#recurringYearMonth",

        yearlyDayInput: "#recurringYearDay"
    },

    frequencies: [
        "daily",
        "weekly",
        "monthly",
        "yearly"
    ],

    categories: [
        "Personal",
        "Work",
        "Study",
        "Health",
        "Career",
        "Shopping",
        "Other"
    ],

    priorities: [
        "low",
        "medium",
        "high"
    ],

    weekdays: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ],

    months: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ]
};


// ============================================================
// 2. RECURRING TASK MANAGER
// ============================================================

const VelvetRecurring = {

    // --------------------------------------------------------
    // State
    // --------------------------------------------------------

    recurringTasks: [],

    initialized: false,


    // --------------------------------------------------------
    // Initialize
    // --------------------------------------------------------

    initialize: function () {

        if (this.initialized) {
            return;
        }

        this.initialized = true;

        // Load saved schedules
        this.loadRecurringTasks();

        // Bind UI events
        this.bindEvents();

        // Generate tasks due today
        this.generateDueTasks();

        // Render schedules
        this.render();

        console.log("Velvet Recurring initialized ♡");
    },


    // --------------------------------------------------------
    // Load recurring tasks from local storage
    // --------------------------------------------------------

    loadRecurringTasks: function () {

        try {

            const saved = VelvetStorage.get(
                VelvetRecurringConfig.storageKey
            );

            this.recurringTasks = Array.isArray(saved)
                ? saved
                : [];

        } catch (error) {

            console.error(
                "Unable to load recurring tasks:",
                error
            );

            this.recurringTasks = [];
        }
    },


    // --------------------------------------------------------
    // Save recurring tasks
    // --------------------------------------------------------

    saveRecurringTasks: function () {

        try {

            VelvetStorage.set(
                VelvetRecurringConfig.storageKey,
                this.recurringTasks
            );

            return true;

        } catch (error) {

            console.error(
                "Unable to save recurring tasks:",
                error
            );

            this.showMessage(
                "Unable to save recurring schedule.",
                "error"
            );

            return false;
        }
    },


    // --------------------------------------------------------
    // Create recurring schedule
    // --------------------------------------------------------

    createRecurring: function (data) {

        data = data || {};


        const title = String(data.title || "").trim();


        if (!title) {

            this.showMessage(
                "Please enter a recurring task title.",
                "warning"
            );

            return null;
        }


        const frequency = String(
            data.frequency || "daily"
        ).toLowerCase();


        if (
            !VelvetRecurringConfig.frequencies.includes(
                frequency
            )
        ) {

            this.showMessage(
                "Invalid recurrence frequency.",
                "error"
            );

            return null;
        }


        const startDate = this.normalizeDateString(
            data.startDate || this.getTodayKey()
        );


        if (!startDate) {

            this.showMessage(
                "Please provide a valid start date.",
                "warning"
            );

            return null;
        }


        const endDate = data.endDate
            ? this.normalizeDateString(data.endDate)
            : null;


        if (data.endDate && !endDate) {

            this.showMessage(
                "Please provide a valid end date.",
                "warning"
            );

            return null;
        }


        if (endDate && endDate < startDate) {

            this.showMessage(
                "End date cannot be before start date.",
                "warning"
            );

            return null;
        }


        const now = new Date().toISOString();


        const recurring = {

            id: this.generateId(),

            title: title,

            description: String(
                data.description || ""
            ).trim(),

            category: data.category || "Personal",

            priority: data.priority || "medium",

            frequency: frequency,

            startDate: startDate,

            endDate: endDate,

            // Weekly: 0 Sunday - 6 Saturday
            weekday: data.weekday !== undefined
                ? Number(data.weekday)
                : new Date(startDate + "T00:00:00").getDay(),

            // Monthly: 1 - 31
            monthDay: data.monthDay !== undefined
                ? Number(data.monthDay)
                : new Date(startDate + "T00:00:00").getDate(),

            // Yearly month: 0 - 11
            yearMonth: data.yearMonth !== undefined
                ? Number(data.yearMonth)
                : new Date(startDate + "T00:00:00").getMonth(),

            yearDay: data.yearDay !== undefined
                ? Number(data.yearDay)
                : new Date(startDate + "T00:00:00").getDate(),

            enabled: data.enabled !== false,

            // Prevent generating same date twice
            generatedDates: [],

            createdAt: now,

            updatedAt: now
        };


        // Validate recurrence-specific fields
        if (
            frequency === "weekly" &&
            (recurring.weekday < 0 ||
             recurring.weekday > 6)
        ) {

            this.showMessage(
                "Please select a valid weekday.",
                "warning"
            );

            return null;
        }


        if (
            frequency === "monthly" &&
            (recurring.monthDay < 1 ||
             recurring.monthDay > 31)
        ) {

            this.showMessage(
                "Monthly day must be between 1 and 31.",
                "warning"
            );

            return null;
        }


        if (
            frequency === "yearly" &&
            (
                recurring.yearMonth < 0 ||
                recurring.yearMonth > 11 ||
                recurring.yearDay < 1 ||
                recurring.yearDay > 31
            )
        ) {

            this.showMessage(
                "Please provide a valid yearly date.",
                "warning"
            );

            return null;
        }


        // Add schedule
        this.recurringTasks.unshift(recurring);


        // Save
        if (!this.saveRecurringTasks()) {

            this.recurringTasks.shift();

            return null;
        }


        // Generate task if schedule is due today
        this.generateTaskForDate(
            recurring,
            this.getTodayKey()
        );


        this.render();


        this.dispatchEvent(
            "velvet:recurring-updated",
            {
                recurringTasks: this.recurringTasks
            }
        );


        this.showMessage(
            "Recurring task created ♡",
            "success"
        );


        return recurring;
    },


    // --------------------------------------------------------
    // Check whether schedule is due on a given date
    // --------------------------------------------------------

    isDueOnDate: function (recurring, dateString) {

        const date = this.parseDate(dateString);


        if (!date) {
            return false;
        }


        // Before start date
        if (dateString < recurring.startDate) {
            return false;
        }


        // After end date
        if (
            recurring.endDate &&
            dateString > recurring.endDate
        ) {
            return false;
        }


        switch (recurring.frequency) {

            case "daily":

                return true;


            case "weekly":

                return date.getDay() ===
                    Number(recurring.weekday);


            case "monthly":

                return date.getDate() ===
                    Number(recurring.monthDay);


            case "yearly":

                return (
                    date.getMonth() ===
                        Number(recurring.yearMonth) &&

                    date.getDate() ===
                        Number(recurring.yearDay)
                );


            default:

                return false;
        }
    },


    // --------------------------------------------------------
    // Generate recurring tasks for today
    // --------------------------------------------------------

    generateDueTasks: function () {

        const today = this.getTodayKey();

        let generatedCount = 0;


        this.recurringTasks.forEach(recurring => {

            if (!recurring.enabled) {
                return;
            }


            if (
                this.isDueOnDate(
                    recurring,
                    today
                )
            ) {

                const task = this.generateTaskForDate(
                    recurring,
                    today
                );


                if (task) {
                    generatedCount++;
                }
            }
        });


        if (generatedCount > 0) {

            this.showMessage(
                `${generatedCount} recurring task${generatedCount > 1 ? "s" : ""} added for today ♡`,
                "success"
            );
        }


        return generatedCount;
    },


    // --------------------------------------------------------
    // Generate a task from a recurring schedule
    // --------------------------------------------------------

    generateTaskForDate: function (
        recurring,
        dateString
    ) {

        if (!recurring || !recurring.enabled) {
            return null;
        }


        // Check if recurrence is due
        if (
            !this.isDueOnDate(
                recurring,
                dateString
            )
        ) {
            return null;
        }


        // Duplicate prevention
        if (
            recurring.generatedDates &&
            recurring.generatedDates.includes(dateString)
        ) {

            return null;
        }


        // Task manager must exist
        if (
            !window.VelvetTasks ||
            typeof VelvetTasks.addTask !== "function"
        ) {

            console.warn(
                "VelvetTasks is not available yet."
            );

            return null;
        }


        // Create task
        const task = VelvetTasks.addTask({

            title: recurring.title,

            description: recurring.description,

            category: recurring.category,

            priority: recurring.priority,

            dueDate: dateString,

            completed: false,

            recurringId: recurring.id
        });


        // If task wasn't created, do not mark date generated
        if (!task) {
            return null;
        }


        // Mark this date as generated
        recurring.generatedDates =
            recurring.generatedDates || [];


        recurring.generatedDates.push(dateString);

        recurring.updatedAt = new Date().toISOString();


        this.saveRecurringTasks();


        this.dispatchEvent(
            "velvet:recurring-task-generated",
            {
                recurring: recurring,
                task: task,
                date: dateString
            }
        );


        return task;
    },


    // --------------------------------------------------------
    // Enable / disable schedule
    // --------------------------------------------------------

    toggleRecurring: function (recurringId) {

        const recurring = this.getById(recurringId);


        if (!recurring) {
            return false;
        }


        const previousEnabled = recurring.enabled;


        recurring.enabled = !recurring.enabled;

        recurring.updatedAt = new Date().toISOString();


        if (!this.saveRecurringTasks()) {

            recurring.enabled = previousEnabled;

            return false;
        }


        // Generate today's task if enabled and due
        if (recurring.enabled) {

            this.generateTaskForDate(
                recurring,
                this.getTodayKey()
            );
        }


        this.render();


        this.dispatchEvent(
            "velvet:recurring-updated",
            {
                recurringTasks: this.recurringTasks
            }
        );


        this.showMessage(
            recurring.enabled
                ? "Recurring schedule enabled ♡"
                : "Recurring schedule paused.",
            "success"
        );


        return true;
    },


    // --------------------------------------------------------
    // Delete recurring schedule
    // --------------------------------------------------------

    deleteRecurring: function (recurringId) {

        const index = this.recurringTasks.findIndex(
            item =>
                String(item.id) === String(recurringId)
        );


        if (index === -1) {
            return false;
        }


        const recurring = this.recurringTasks[index];


        const confirmed = window.confirm(
            `Delete recurring schedule "${recurring.title}"?`
        );


        if (!confirmed) {
            return false;
        }


        this.recurringTasks.splice(index, 1);


        if (!this.saveRecurringTasks()) {

            this.recurringTasks.splice(
                index,
                0,
                recurring
            );

            return false;
        }


        this.render();


        this.dispatchEvent(
            "velvet:recurring-updated",
            {
                recurringTasks: this.recurringTasks
            }
        );


        this.showMessage(
            "Recurring schedule deleted.",
            "success"
        );


        return true;
    },


    // --------------------------------------------------------
    // Get schedule by ID
    // --------------------------------------------------------

    getById: function (recurringId) {

        return this.recurringTasks.find(
            item =>
                String(item.id) === String(recurringId)
        ) || null;
    },


    // --------------------------------------------------------
    // Get all schedules
    // --------------------------------------------------------

    getAll: function () {

        return [...this.recurringTasks];
    },


    // --------------------------------------------------------
    // Get active schedules
    // --------------------------------------------------------

    getActive: function () {

        return this.recurringTasks.filter(
            item => item.enabled
        );
    },


    // --------------------------------------------------------
    // Get statistics
    // --------------------------------------------------------

    getStatistics: function () {

        const total = this.recurringTasks.length;


        const active = this.recurringTasks.filter(
            item => item.enabled
        ).length;


        const paused = total - active;


        return {

            total: total,

            active: active,

            paused: paused
        };
    },


    // --------------------------------------------------------
    // Render schedules
    // --------------------------------------------------------

    render: function () {

        const container = document.querySelector(
            "#recurringContainer"
        );


        if (!container) {
            return;
        }


        if (this.recurringTasks.length === 0) {

            container.innerHTML = `
                <div class="empty-state">

                    <div class="empty-state-icon">
                        <i data-lucide="repeat"></i>
                    </div>

                    <h3>No recurring tasks yet</h3>

                    <p>
                        Create routines and recurring tasks
                        to make your days easier.
                    </p>

                    <button
                        type="button"
                        class="primary-button"
                        data-add-recurring
                    >
                        <i data-lucide="plus"></i>
                        Create Recurring Task
                    </button>

                </div>
            `;


            this.refreshIcons();

            return;
        }


        container.innerHTML = this.recurringTasks
            .map(item => this.createCard(item))
            .join("");


        this.refreshIcons();
    },


    // --------------------------------------------------------
    // Create schedule card
    // --------------------------------------------------------

    createCard: function (recurring) {

        const id = this.escapeHTML(
            String(recurring.id)
        );


        const title = this.escapeHTML(
            recurring.title
        );


        const description = this.escapeHTML(
            recurring.description || ""
        );


        const frequencyLabel = this.getFrequencyLabel(
            recurring
        );


        const statusClass = recurring.enabled
            ? "recurring-active"
            : "recurring-paused";


        const statusLabel = recurring.enabled
            ? "Active"
            : "Paused";


        const generatedCount =
            (recurring.generatedDates || []).length;


        return `
            <article
                class="dashboard-card recurring-card ${statusClass}"
                data-recurring-id="${id}"
            >

                <div class="card-header">

                    <div class="recurring-card-heading">

                        <div class="recurring-icon">
                            <i data-lucide="repeat"></i>
                        </div>

                        <div>

                            <h3>${title}</h3>

                            <span class="recurring-status">
                                ${statusLabel}
                            </span>

                        </div>

                    </div>


                    <div class="recurring-actions">

                        <button
                            type="button"
                            class="icon-button"
                            data-recurring-action="toggle"
                            data-recurring-id="${id}"
                            title="${recurring.enabled ? "Pause schedule" : "Enable schedule"}"
                            aria-label="${recurring.enabled ? "Pause schedule" : "Enable schedule"}"
                        >
                            <i data-lucide="${recurring.enabled ? "pause" : "play"}"></i>
                        </button>


                        <button
                            type="button"
                            class="icon-button"
                            data-recurring-action="delete"
                            data-recurring-id="${id}"
                            title="Delete schedule"
                            aria-label="Delete recurring schedule"
                        >
                            <i data-lucide="trash-2"></i>
                        </button>

                    </div>

                </div>


                ${description
                    ? `<p class="recurring-description">${description}</p>`
                    : ""
                }


                <div class="recurring-frequency">

                    <i data-lucide="calendar-clock"></i>

                    <span>${this.escapeHTML(frequencyLabel)}</span>

                </div>


                <div class="recurring-details">

                    <span>
                        <i data-lucide="calendar"></i>
                        Starts ${this.escapeHTML(this.formatDate(recurring.startDate))}
                    </span>

                    ${recurring.endDate
                        ? `
                            <span>
                                Ends ${this.escapeHTML(this.formatDate(recurring.endDate))}
                            </span>
                        `
                        : `
                            <span>
                                No end date
                            </span>
                        `
                    }

                </div>


                <div class="recurring-footer">

                    <span>
                        ${generatedCount} task${generatedCount !== 1 ? "s" : ""} generated
                    </span>

                    <span class="task-tag">
                        ${this.escapeHTML(recurring.category || "Personal")}
                    </span>

                </div>

            </article>
        `;
    },


    // --------------------------------------------------------
    // Get frequency label
    // --------------------------------------------------------

    getFrequencyLabel: function (recurring) {

        switch (recurring.frequency) {

            case "daily":

                return "Every day";


            case "weekly":

                return `Every ${VelvetRecurringConfig.weekdays[recurring.weekday]}`;


            case "monthly":

                return `Every month on day ${recurring.monthDay}`;


            case "yearly":

                return `Every year on ${VelvetRecurringConfig.months[recurring.yearMonth]} ${recurring.yearDay}`;


            default:

                return "Recurring";
        }
    },


    // --------------------------------------------------------
    // Bind events
    // --------------------------------------------------------

    bindEvents: function () {

        // Open create modal
        document.addEventListener("click", (event) => {

            const addButton = event.target.closest(
                VelvetRecurringConfig.selectors.addButton
            );


            if (addButton) {

                this.openModal();
            }
        });


        // Close modal
        document.addEventListener("click", (event) => {

            const closeButton = event.target.closest(
                VelvetRecurringConfig.selectors.closeButton
            );


            if (closeButton) {

                this.closeModal();
            }
        });


        // Modal backdrop click
        const modal = document.querySelector(
            VelvetRecurringConfig.selectors.modal
        );


        if (modal) {

            modal.addEventListener("click", (event) => {

                if (event.target === modal) {

                    this.closeModal();
                }
            });
        }


        // Escape closes modal
        document.addEventListener("keydown", (event) => {

            if (event.key === "Escape") {

                const modal = document.querySelector(
                    VelvetRecurringConfig.selectors.modal
                );


                if (
                    modal &&
                    modal.classList.contains("active")
                ) {

                    this.closeModal();
                }
            }
        });


        // Recurring card actions
        const container = document.querySelector(
            VelvetRecurringConfig.selectors.container
        );


        if (container) {

            container.addEventListener("click", (event) => {

                const button = event.target.closest(
                    "[data-recurring-action]"
                );


                if (!button) {
                    return;
                }


                const action =
                    button.dataset.recurringAction;


                const recurringId =
                    button.dataset.recurringId;


                if (action === "toggle") {

                    this.toggleRecurring(recurringId);
                }


                if (action === "delete") {

                    this.deleteRecurring(recurringId);
                }
            });
        }


        // Form submission
        const form = document.querySelector(
            VelvetRecurringConfig.selectors.form
        );


        if (form) {

            form.addEventListener("submit", (event) => {

                event.preventDefault();

                this.handleFormSubmit(form);
            });
        }
    },


    // --------------------------------------------------------
    // Handle form submit
    // --------------------------------------------------------

    handleFormSubmit: function (form) {

        const title = this.getInputValue(
            VelvetRecurringConfig.selectors.titleInput
        );


        const description = this.getInputValue(
            VelvetRecurringConfig.selectors.descriptionInput
        );


        const category = this.getInputValue(
            VelvetRecurringConfig.selectors.categoryInput
        );


        const priority = this.getInputValue(
            VelvetRecurringConfig.selectors.priorityInput
        );


        const frequency = this.getInputValue(
            VelvetRecurringConfig.selectors.frequencyInput
        );


        const startDate = this.getInputValue(
            VelvetRecurringConfig.selectors.startDateInput
        );


        const endDate = this.getInputValue(
            VelvetRecurringConfig.selectors.endDateInput
        );


        const weekday = this.getInputValue(
            VelvetRecurringConfig.selectors.weeklyDayInput
        );


        const monthDay = this.getInputValue(
            VelvetRecurringConfig.selectors.monthlyDayInput
        );


        const yearMonth = this.getInputValue(
            VelvetRecurringConfig.selectors.yearlyMonthInput
        );


        const yearDay = this.getInputValue(
            VelvetRecurringConfig.selectors.yearlyDayInput
        );


        const data = {

            title: title,

            description: description,

            category: category || "Personal",

            priority: priority || "medium",

            frequency: frequency || "daily",

            startDate: startDate || this.getTodayKey(),

            endDate: endDate || null,

            weekday: weekday !== ""
                ? Number(weekday)
                : undefined,

            monthDay: monthDay !== ""
                ? Number(monthDay)
                : undefined,

            yearMonth: yearMonth !== ""
                ? Number(yearMonth)
                : undefined,

            yearDay: yearDay !== ""
                ? Number(yearDay)
                : undefined
        };


        const recurring = this.createRecurring(data);


        if (recurring) {

            form.reset();

            this.closeModal();
        }
    },


    // --------------------------------------------------------
    // Get input value
    // --------------------------------------------------------

    getInputValue: function (selector) {

        const input = document.querySelector(selector);


        return input
            ? String(input.value || "").trim()
            : "";
    },


    // --------------------------------------------------------
    // Open modal
    // --------------------------------------------------------

    openModal: function () {

        const modal = document.querySelector(
            VelvetRecurringConfig.selectors.modal
        );


        const form = document.querySelector(
            VelvetRecurringConfig.selectors.form
        );


        if (form) {
            form.reset();
        }


        const startInput = document.querySelector(
            VelvetRecurringConfig.selectors.startDateInput
        );


        if (startInput) {

            startInput.value = this.getTodayKey();
        }


        if (modal) {

            modal.classList.add("active");

            document.body.classList.add("modal-open");
        }
    },


    // --------------------------------------------------------
    // Close modal
    // --------------------------------------------------------

    closeModal: function () {

        const modal = document.querySelector(
            VelvetRecurringConfig.selectors.modal
        );


        if (modal) {

            modal.classList.remove("active");

            document.body.classList.remove("modal-open");
        }
    },


    // --------------------------------------------------------
    // Generate ID
    // --------------------------------------------------------

    generateId: function () {

        if (
            window.crypto &&
            typeof window.crypto.randomUUID === "function"
        ) {

            return window.crypto.randomUUID();
        }


        return "recurring-" +
            Date.now() +
            "-" +
            Math.random().toString(36).substring(2, 9);
    },


    // --------------------------------------------------------
    // Get today's date key
    // --------------------------------------------------------

    getTodayKey: function () {

        return this.getDateKey(new Date());
    },


    // --------------------------------------------------------
    // Date to YYYY-MM-DD
    // --------------------------------------------------------

    getDateKey: function (date) {

        const year = date.getFullYear();

        const month = String(
            date.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            date.getDate()
        ).padStart(2, "0");


        return `${year}-${month}-${day}`;
    },


    // --------------------------------------------------------
    // Parse date string safely
    // --------------------------------------------------------

    parseDate: function (dateString) {

        if (!dateString) {
            return null;
        }


        const parts = String(dateString)
            .substring(0, 10)
            .split("-")
            .map(Number);


        if (parts.length !== 3) {
            return null;
        }


        const [year, month, day] = parts;


        if (
            !year ||
            month < 1 ||
            month > 12 ||
            day < 1 ||
            day > 31
        ) {
            return null;
        }


        const date = new Date(
            year,
            month - 1,
            day
        );


        // Reject impossible dates
        if (
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day
        ) {
            return null;
        }


        return date;
    },


    // --------------------------------------------------------
    // Normalize date string
    // --------------------------------------------------------

    normalizeDateString: function (dateString) {

        const date = this.parseDate(dateString);


        return date
            ? this.getDateKey(date)
            : null;
    },


    // --------------------------------------------------------
    // Format date
    // --------------------------------------------------------

    formatDate: function (dateString) {

        const date = this.parseDate(dateString);


        if (!date) {
            return dateString || "";
        }


        return date.toLocaleDateString(
            undefined,
            {
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
    // Refresh icons
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


        console.log(`[${type.toUpperCase()}] ${message}`);
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
// 3. EXPOSE RECURRING MANAGER
// ============================================================

window.VelvetRecurring = VelvetRecurring;


// ============================================================
// 4. INITIALIZE WHEN DOM IS READY
// ============================================================

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        () => VelvetRecurring.initialize(),
        { once: true }
    );

} else {

    VelvetRecurring.initialize();
}
