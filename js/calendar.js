

// ============================================================
// VELVET DAY - CALENDAR MANAGER
// File: js/calendar.js
//
// Features:
// - Monthly calendar view
// - Previous / next month navigation
// - Jump to today
// - Select dates
// - Highlight today
// - Highlight selected date
// - Show task indicators on dates
// - Display tasks for selected date
// - Add a task for the selected date
// - Integrate with VelvetTasks
// ============================================================


// ============================================================
// 1. CONFIGURATION
// ============================================================

const VelvetCalendarConfig = {

    selectors: {

        calendarGrid: "#calendarGrid",

        monthLabel: "#calendarMonthLabel",

        selectedDateLabel: "#calendarSelectedDate",

        selectedDayTasks: "#calendarDayTasks",

        previousButton: "[data-calendar-action='previous']",

        nextButton: "[data-calendar-action='next']",

        todayButton: "[data-calendar-action='today']",

        addTaskButton: "[data-calendar-action='add-task']"
    },

    // First day of the week:
    // 0 = Sunday
    // 1 = Monday
    firstDayOfWeek: 1
};


// ============================================================
// 2. CALENDAR MANAGER
// ============================================================

const VelvetCalendar = {

    // --------------------------------------------------------
    // State
    // --------------------------------------------------------

    currentDate: new Date(),

    selectedDate: new Date(),

    initialized: false,


    // --------------------------------------------------------
    // Initialize
    // --------------------------------------------------------

    initialize: function () {

        if (this.initialized) {
            return;
        }

        this.initialized = true;

        // Start calendar at current month
        this.currentDate = this.getStartOfMonth(new Date());

        this.selectedDate = this.normalizeDate(new Date());

        // Bind events
        this.bindEvents();

        // Render calendar
        this.render();

        // Listen for task updates
        this.bindTaskEvents();

        console.log("Velvet Calendar initialized ♡");
    },


    // --------------------------------------------------------
    // Render entire calendar
    // --------------------------------------------------------

    render: function () {

        this.renderMonthLabel();

        this.renderCalendarGrid();

        this.renderSelectedDate();

        this.renderSelectedDayTasks();

        this.refreshIcons();
    },


    // --------------------------------------------------------
    // Render month and year label
    // --------------------------------------------------------

    renderMonthLabel: function () {

        const label = document.querySelector(
            VelvetCalendarConfig.selectors.monthLabel
        );

        if (!label) {
            return;
        }

        label.textContent = this.currentDate.toLocaleDateString(
            undefined,
            {
                month: "long",
                year: "numeric"
            }
        );
    },


    // --------------------------------------------------------
    // Render calendar grid
    // --------------------------------------------------------

    renderCalendarGrid: function () {

        const container = document.querySelector(
            VelvetCalendarConfig.selectors.calendarGrid
        );

        if (!container) {
            return;
        }

        const year = this.currentDate.getFullYear();

        const month = this.currentDate.getMonth();

        // First date of the current month
        const firstDate = new Date(year, month, 1);

        // Last date of the current month
        const lastDate = new Date(year, month + 1, 0);

        const totalDays = lastDate.getDate();

        // Offset based on configured first weekday
        let startingOffset =
            firstDate.getDay() -
            VelvetCalendarConfig.firstDayOfWeek;

        if (startingOffset < 0) {
            startingOffset += 7;
        }

        // Previous month days needed to fill first row
        const previousMonthLastDate = new Date(
            year,
            month,
            0
        ).getDate();

        const totalCells = Math.ceil(
            (startingOffset + totalDays) / 7
        ) * 7;

        const today = this.normalizeDate(new Date());

        let html = "";

        // Render weekday labels
        html += this.renderWeekdayHeaders();


        // Render all date cells
        for (let cellIndex = 0; cellIndex < totalCells; cellIndex++) {

            let date;

            let isCurrentMonth = true;

            // Previous month
            if (cellIndex < startingOffset) {

                const dayNumber =
                    previousMonthLastDate -
                    startingOffset +
                    cellIndex +
                    1;

                date = new Date(
                    year,
                    month - 1,
                    dayNumber
                );

                isCurrentMonth = false;
            }

            // Current month
            else if (
                cellIndex <
                startingOffset + totalDays
            ) {

                const dayNumber =
                    cellIndex - startingOffset + 1;

                date = new Date(
                    year,
                    month,
                    dayNumber
                );
            }

            // Next month
            else {

                const dayNumber =
                    cellIndex -
                    (startingOffset + totalDays) +
                    1;

                date = new Date(
                    year,
                    month + 1,
                    dayNumber
                );

                isCurrentMonth = false;
            }


            const normalizedDate = this.normalizeDate(date);

            const dateKey = this.getDateKey(normalizedDate);

            const selectedKey = this.getDateKey(
                this.selectedDate
            );

            const todayKey = this.getDateKey(today);

            const isToday = dateKey === todayKey;

            const isSelected = dateKey === selectedKey;

            const tasks = this.getTasksForDate(normalizedDate);

            const hasTasks = tasks.length > 0;

            const completedTasks = tasks.filter(
                task => task.completed
            ).length;


            // Cell classes
            const classes = [

                "calendar-day",

                isCurrentMonth
                    ? "current-month"
                    : "other-month",

                isToday
                    ? "today"
                    : "",

                isSelected
                    ? "selected"
                    : "",

                hasTasks
                    ? "has-tasks"
                    : ""
            ]
            .filter(Boolean)
            .join(" ");


            // Task indicator
            const taskIndicator = hasTasks
                ? `
                    <div class="calendar-task-indicator">
                        <span class="calendar-task-dot"></span>
                        <span class="calendar-task-count">
                            ${tasks.length}
                        </span>
                    </div>
                `
                : "";


            // Completion indicator
            const completionIndicator =
                hasTasks && completedTasks === tasks.length
                    ? `<span class="calendar-all-completed" title="All tasks completed">✓</span>`
                    : "";


            html += `
                <button
                    type="button"
                    class="${classes}"
                    data-calendar-date="${dateKey}"
                    aria-label="${this.escapeHTML(
                        date.toLocaleDateString(undefined, {
                            dateStyle: "full"
                        })
                    )}${hasTasks ? `, ${tasks.length} tasks` : ""}"
                    aria-pressed="${isSelected}"
                >

                    <span class="calendar-day-number">
                        ${date.getDate()}
                    </span>

                    ${taskIndicator}

                    ${completionIndicator}

                </button>
            `;
        }


        container.innerHTML = html;
    },


    // --------------------------------------------------------
    // Render weekday headers
    // --------------------------------------------------------

    renderWeekdayHeaders: function () {

        const weekdays = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
        ];


        // Rotate weekday order
        const rotatedWeekdays = [
            ...weekdays.slice(
                VelvetCalendarConfig.firstDayOfWeek
            ),

            ...weekdays.slice(
                0,
                VelvetCalendarConfig.firstDayOfWeek
            )
        ];


        return `
            <div class="calendar-weekday-header">
                ${rotatedWeekdays.map(day => `
                    <div class="calendar-day-name">
                        ${day.substring(0, 3)}
                    </div>
                `).join("")}
            </div>
        `;
    },


    // --------------------------------------------------------
    // Render selected date label
    // --------------------------------------------------------

    renderSelectedDate: function () {

        const label = document.querySelector(
            VelvetCalendarConfig.selectors.selectedDateLabel
        );

        if (!label) {
            return;
        }


        label.textContent = this.selectedDate.toLocaleDateString(
            undefined,
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
    },


    // --------------------------------------------------------
    // Render tasks for selected date
    // --------------------------------------------------------

    renderSelectedDayTasks: function () {

        const container = document.querySelector(
            VelvetCalendarConfig.selectors.selectedDayTasks
        );

        if (!container) {
            return;
        }


        const tasks = this.getTasksForDate(
            this.selectedDate
        );


        // No tasks
        if (tasks.length === 0) {

            container.innerHTML = `
                <div class="empty-state calendar-empty-state">

                    <div class="empty-state-icon">
                        <i data-lucide="calendar-heart"></i>
                    </div>

                    <h3>No plans for this day</h3>

                    <p>
                        A little space for yourself is okay too ♡
                    </p>

                </div>
            `;

            this.refreshIcons();

            return;
        }


        // Render tasks
        container.innerHTML = tasks.map(task => {

            const title = this.escapeHTML(
                task.title || "Untitled Task"
            );

            const taskId = this.escapeHTML(
                String(task.id)
            );

            const category = this.escapeHTML(
                task.category || "Other"
            );

            const priority = this.escapeHTML(
                task.priority || "medium"
            );


            return `
                <div
                    class="calendar-task-item ${task.completed ? "completed" : ""}"
                    data-calendar-task-id="${taskId}"
                >

                    <button
                        type="button"
                        class="task-checkbox ${task.completed ? "checked" : ""}"
                        data-calendar-task-action="toggle"
                        data-task-id="${taskId}"
                        aria-label="${task.completed ? "Mark incomplete" : "Mark complete"}"
                    >
                        ${task.completed ? "✓" : ""}
                    </button>


                    <div class="calendar-task-details">

                        <span class="calendar-task-title">
                            ${title}
                        </span>

                        <div class="calendar-task-meta">

                            <span class="task-tag">
                                ${category}
                            </span>

                            <span class="priority-badge priority-${priority}">
                                ${priority}
                            </span>

                        </div>

                    </div>

                </div>
            `;

        }).join("");


        this.refreshIcons();
    },


    // --------------------------------------------------------
    // Get tasks for a date
    // --------------------------------------------------------

    getTasksForDate: function (date) {

        if (
            !window.VelvetTasks ||
            typeof VelvetTasks.getTasks !== "function"
        ) {
            return [];
        }


        const allTasks = VelvetTasks.getTasks();

        const targetDate = this.getDateKey(date);


        return allTasks.filter(task => {

            if (!task.dueDate) {
                return false;
            }


            // Compare date only, not time
            const taskDate = String(task.dueDate)
                .substring(0, 10);


            return taskDate === targetDate;
        });
    },


    // --------------------------------------------------------
    // Navigate to previous month
    // --------------------------------------------------------

    previousMonth: function () {

        this.currentDate = new Date(
            this.currentDate.getFullYear(),
            this.currentDate.getMonth() - 1,
            1
        );


        this.render();
    },


    // --------------------------------------------------------
    // Navigate to next month
    // --------------------------------------------------------

    nextMonth: function () {

        this.currentDate = new Date(
            this.currentDate.getFullYear(),
            this.currentDate.getMonth() + 1,
            1
        );


        this.render();
    },


    // --------------------------------------------------------
    // Jump to today
    // --------------------------------------------------------

    goToToday: function () {

        const today = new Date();


        this.currentDate = this.getStartOfMonth(today);

        this.selectedDate = this.normalizeDate(today);


        this.render();
    },


    // --------------------------------------------------------
    // Select date
    // --------------------------------------------------------

    selectDate: function (dateString) {

        const date = this.parseDateKey(dateString);


        if (!date) {
            return;
        }


        this.selectedDate = this.normalizeDate(date);


        // If selected date belongs to another month,
        // update the displayed month
        if (
            date.getMonth() !== this.currentDate.getMonth() ||
            date.getFullYear() !== this.currentDate.getFullYear()
        ) {

            this.currentDate = this.getStartOfMonth(date);
        }


        this.render();
    },


    // --------------------------------------------------------
    // Add task for selected date
    // --------------------------------------------------------

    addTaskForSelectedDate: function () {

        if (
            !window.VelvetTasks ||
            typeof VelvetTasks.openModal !== "function"
        ) {

            this.showMessage(
                "Task manager is not available.",
                "error"
            );

            return;
        }


        // Open task modal
        VelvetTasks.openModal();


        // Set due date in task form if available
        const dueDateInput = document.querySelector(
            '#taskForm [name="dueDate"]'
        );


        if (dueDateInput) {

            dueDateInput.value = this.getDateKey(
                this.selectedDate
            );
        }


        // Dispatch event so other modules can respond
        this.dispatchEvent(
            "velvet:calendar-add-task",
            {
                date: this.getDateKey(this.selectedDate)
            }
        );
    },


    // --------------------------------------------------------
    // Bind events
    // --------------------------------------------------------

    bindEvents: function () {

        // Previous month
        document.addEventListener("click", (event) => {

            if (
                event.target.closest(
                    VelvetCalendarConfig.selectors.previousButton
                )
            ) {

                this.previousMonth();
            }
        });


        // Next month
        document.addEventListener("click", (event) => {

            if (
                event.target.closest(
                    VelvetCalendarConfig.selectors.nextButton
                )
            ) {

                this.nextMonth();
            }
        });


        // Today
        document.addEventListener("click", (event) => {

            if (
                event.target.closest(
                    VelvetCalendarConfig.selectors.todayButton
                )
            ) {

                this.goToToday();
            }
        });


        // Add task for selected date
        document.addEventListener("click", (event) => {

            if (
                event.target.closest(
                    VelvetCalendarConfig.selectors.addTaskButton
                )
            ) {

                this.addTaskForSelectedDate();
            }
        });


        // Date selection
        const calendarGrid = document.querySelector(
            VelvetCalendarConfig.selectors.calendarGrid
        );


        if (calendarGrid) {

            calendarGrid.addEventListener("click", (event) => {

                const dateButton = event.target.closest(
                    "[data-calendar-date]"
                );


                if (!dateButton) {
                    return;
                }


                this.selectDate(
                    dateButton.dataset.calendarDate
                );
            });
        }


        // Task completion in calendar
        const selectedDayTasks = document.querySelector(
            VelvetCalendarConfig.selectors.selectedDayTasks
        );


        if (selectedDayTasks) {

            selectedDayTasks.addEventListener("click", (event) => {

                const button = event.target.closest(
                    "[data-calendar-task-action='toggle']"
                );


                if (!button) {
                    return;
                }


                const taskId = button.dataset.taskId;


                if (
                    window.VelvetTasks &&
                    typeof VelvetTasks.toggleTask === "function"
                ) {

                    VelvetTasks.toggleTask(taskId);
                }
            });
        }
    },


    // --------------------------------------------------------
    // Listen for task updates
    // --------------------------------------------------------

    bindTaskEvents: function () {

        document.addEventListener(
            "velvet:tasks-updated",
            () => this.render()
        );


        document.addEventListener(
            "velvet:task-statistics-updated",
            () => this.render()
        );


        document.addEventListener(
            "velvet:data-reloaded",
            () => this.render()
        );
    },


    // --------------------------------------------------------
    // Helpers
    // --------------------------------------------------------


    // Normalize date to midnight
    normalizeDate: function (date) {

        return new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );
    },


    // Get first date of month
    getStartOfMonth: function (date) {

        return new Date(
            date.getFullYear(),
            date.getMonth(),
            1
        );
    },


    // Get date key YYYY-MM-DD
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


    // Parse date key safely using local date
    parseDateKey: function (dateString) {

        const parts = String(dateString || "")
            .split("-")
            .map(Number);


        if (parts.length !== 3) {
            return null;
        }


        const [year, month, day] = parts;


        if (
            !year ||
            !month ||
            !day ||
            month < 1 ||
            month > 12 ||
            day < 1 ||
            day > 31
        ) {
            return null;
        }


        return new Date(
            year,
            month - 1,
            day
        );
    },


    // Escape HTML
    escapeHTML: function (value) {

        const div = document.createElement("div");

        div.textContent = String(value ?? "");

        return div.innerHTML;
    },


    // Refresh Lucide icons
    refreshIcons: function () {

        if (
            window.lucide &&
            typeof window.lucide.createIcons === "function"
        ) {

            window.lucide.createIcons();
        }
    },


    // Show message
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


    // Dispatch custom event
    dispatchEvent: function (eventName, detail = {}) {

        document.dispatchEvent(
            new CustomEvent(eventName, {
                detail: detail
            })
        );
    }

};


// ============================================================
// 3. EXPOSE CALENDAR MANAGER
// ============================================================

window.VelvetCalendar = VelvetCalendar;


// ============================================================
// 4. INITIALIZE WHEN DOM IS READY
// ============================================================

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        () => VelvetCalendar.initialize(),
        { once: true }
    );

} else {

    VelvetCalendar.initialize();
}
