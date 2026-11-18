

// ============================================================
// VELVET DAY - PROGRESS & PRODUCTIVITY TRACKER
// File: js/progress.js
//
// Features:
// - Daily task completion statistics
// - Weekly activity overview
// - Completion percentage
// - Productivity streak
// - Best productivity day
// - Completed vs pending tasks
// - Daily activity history
// - Local storage persistence
// - Automatically refreshes when tasks change
//
// Requires:
// - storage.js
// - utils.js
// - tasks.js
// ============================================================


// ============================================================
// 1. CONFIGURATION
// ============================================================

const VelvetProgressConfig = {

    storageKey: "productivityHistory",

    selectors: {

        completed: "[data-progress-completed]",

        total: "[data-progress-total]",

        pending: "[data-progress-pending]",

        percentage: "[data-progress-percentage]",

        progressBar: "[data-progress-bar]",

        streak: "[data-progress-streak]",

        bestDay: "[data-progress-best-day]",

        weeklyContainer: "#weeklyProgressContainer",

        chartContainer: "#weeklyChart",

        summaryContainer: "#progressSummary"
    },

    weekStartsOnMonday: true,

    historyLimit: 365
};


// ============================================================
// 2. PROGRESS MANAGER
// ============================================================

const VelvetProgress = {

    // --------------------------------------------------------
    // State
    // --------------------------------------------------------

    history: [],

    initialized: false,


    // --------------------------------------------------------
    // Initialize
    // --------------------------------------------------------

    initialize: function () {

        if (this.initialized) {
            return;
        }

        this.initialized = true;

        // Load saved productivity history
        this.loadHistory();

        // Record today's activity
        this.recordToday();

        // Bind events
        this.bindEvents();

        // Render dashboard
        this.render();

        console.log("Velvet Progress initialized ♡");
    },


    // --------------------------------------------------------
    // Load history
    // --------------------------------------------------------

    loadHistory: function () {

        try {

            const saved = VelvetStorage.get(
                VelvetProgressConfig.storageKey
            );

            this.history = Array.isArray(saved)
                ? saved
                : [];

        } catch (error) {

            console.error(
                "Unable to load progress history:",
                error
            );

            this.history = [];
        }
    },


    // --------------------------------------------------------
    // Save history
    // --------------------------------------------------------

    saveHistory: function () {

        try {

            VelvetStorage.set(
                VelvetProgressConfig.storageKey,
                this.history
            );

            return true;

        } catch (error) {

            console.error(
                "Unable to save progress history:",
                error
            );

            return false;
        }
    },


    // --------------------------------------------------------
    // Get all tasks
    // --------------------------------------------------------

    getTasks: function () {

        if (
            window.VelvetTasks &&
            typeof VelvetTasks.getTasks === "function"
        ) {

            return VelvetTasks.getTasks();
        }

        return [];
    },


    // --------------------------------------------------------
    // Get today's date key
    // --------------------------------------------------------

    getTodayKey: function () {

        return this.getDateKey(new Date());
    },


    // --------------------------------------------------------
    // Convert date to YYYY-MM-DD
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
    // Parse date key
    // --------------------------------------------------------

    parseDate: function (dateKey) {

        if (!dateKey) {
            return null;
        }


        const parts = String(dateKey)
            .split("-")
            .map(Number);


        if (parts.length !== 3) {
            return null;
        }


        const [year, month, day] = parts;


        const date = new Date(
            year,
            month - 1,
            day
        );


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
    // Get statistics for all tasks
    // --------------------------------------------------------

    getTaskStatistics: function () {

        const tasks = this.getTasks();

        const total = tasks.length;


        const completed = tasks.filter(
            task => task.completed
        ).length;


        const pending = total - completed;


        const percentage = total > 0
            ? Math.round((completed / total) * 100)
            : 0;


        const today = this.getTodayKey();


        const todayTasks = tasks.filter(
            task => task.dueDate === today
        );


        const todayCompleted = todayTasks.filter(
            task => task.completed
        ).length;


        const todayTotal = todayTasks.length;


        const todayPercentage = todayTotal > 0
            ? Math.round(
                (todayCompleted / todayTotal) * 100
            )
            : 0;


        return {

            total,

            completed,

            pending,

            percentage,

            todayTotal,

            todayCompleted,

            todayPercentage
        };
    },


    // --------------------------------------------------------
    // Record today's task activity
    // --------------------------------------------------------

    recordToday: function () {

        const today = this.getTodayKey();

        const tasks = this.getTasks();


        const completed = tasks.filter(
            task => task.completed
        ).length;


        const total = tasks.length;


        const existing = this.history.find(
            item => item.date === today
        );


        const entry = {

            date: today,

            total: total,

            completed: completed,

            pending: total - completed,

            percentage: total > 0
                ? Math.round((completed / total) * 100)
                : 0,

            updatedAt: new Date().toISOString()
        };


        if (existing) {

            Object.assign(
                existing,
                entry
            );

        } else {

            this.history.push(entry);
        }


        // Sort history by date
        this.history.sort(
            (a, b) => a.date.localeCompare(b.date)
        );


        // Limit history
        if (
            this.history.length >
            VelvetProgressConfig.historyLimit
        ) {

            this.history = this.history.slice(
                -VelvetProgressConfig.historyLimit
            );
        }


        this.saveHistory();


        return entry;
    },


    // --------------------------------------------------------
    // Get history for a specific day
    // --------------------------------------------------------

    getHistoryForDate: function (dateKey) {

        return this.history.find(
            item => item.date === dateKey
        ) || null;
    },


    // --------------------------------------------------------
    // Get activity for the last 7 days
    // --------------------------------------------------------

    getWeeklyActivity: function () {

        const days = [];

        const today = new Date();


        // Normalize today's date to midnight
        today.setHours(0, 0, 0, 0);


        for (let i = 6; i >= 0; i--) {

            const date = new Date(today);

            date.setDate(
                today.getDate() - i
            );


            const dateKey = this.getDateKey(date);


            const historyEntry =
                this.getHistoryForDate(dateKey);


            days.push({

                date: dateKey,

                dayName: date.toLocaleDateString(
                    undefined,
                    {
                        weekday: "short"
                    }
                ),

                dayNumber: date.getDate(),

                completed: historyEntry
                    ? historyEntry.completed
                    : 0,

                total: historyEntry
                    ? historyEntry.total
                    : 0,

                percentage: historyEntry
                    ? historyEntry.percentage
                    : 0,

                isToday: dateKey === this.getTodayKey()
            });
        }


        return days;
    },


    // --------------------------------------------------------
    // Weekly statistics
    // --------------------------------------------------------

    getWeeklyStatistics: function () {

        const days = this.getWeeklyActivity();


        const completed = days.reduce(
            (sum, day) => sum + day.completed,
            0
        );


        const total = days.reduce(
            (sum, day) => sum + day.total,
            0
        );


        const activeDays = days.filter(
            day => day.completed > 0
        ).length;


        const average = days.length > 0
            ? Math.round(
                days.reduce(
                    (sum, day) => sum + day.percentage,
                    0
                ) / days.length
            )
            : 0;


        const bestDay = days.reduce(
            (best, day) => {

                return day.completed > best.completed
                    ? day
                    : best;

            },
            {
                dayName: "-",
                completed: 0,
                date: null
            }
        );


        return {

            days,

            completed,

            total,

            activeDays,

            average,

            bestDay
        };
    },


    // --------------------------------------------------------
    // Calculate streak
    // --------------------------------------------------------

    getStreak: function () {

        const completedDates = this.history
            .filter(entry => entry.completed > 0)
            .map(entry => entry.date)
            .sort();


        const completedSet = new Set(
            completedDates
        );


        let streak = 0;

        const date = new Date();


        date.setHours(0, 0, 0, 0);


        // If today has no completions, allow yesterday's streak
        if (
            !completedSet.has(
                this.getDateKey(date)
            )
        ) {

            date.setDate(
                date.getDate() - 1
            );
        }


        while (
            completedSet.has(
                this.getDateKey(date)
            )
        ) {

            streak++;


            date.setDate(
                date.getDate() - 1
            );
        }


        return streak;
    },


    // --------------------------------------------------------
    // Get best productivity day
    // --------------------------------------------------------

    getBestDay: function () {

        if (this.history.length === 0) {

            return {
                date: null,
                completed: 0,
                percentage: 0
            };
        }


        return this.history.reduce(
            (best, current) => {

                if (
                    current.completed > best.completed
                ) {

                    return current;
                }


                return best;

            },
            this.history[0]
        );
    },


    // --------------------------------------------------------
    // Get monthly statistics
    // --------------------------------------------------------

    getMonthlyStatistics: function (
        year = new Date().getFullYear(),
        month = new Date().getMonth()
    ) {

        const prefix =
            `${year}-${String(month + 1).padStart(2, "0")}`;


        const monthHistory = this.history.filter(
            item => item.date.startsWith(prefix)
        );


        const completed = monthHistory.reduce(
            (sum, item) => sum + item.completed,
            0
        );


        const activeDays = monthHistory.filter(
            item => item.completed > 0
        ).length;


        return {

            year,

            month,

            completed,

            activeDays,

            daysTracked: monthHistory.length,

            history: monthHistory
        };
    },


    // --------------------------------------------------------
    // Render all progress sections
    // --------------------------------------------------------

    render: function () {

        // Update today's history before rendering
        this.recordToday();


        const stats = this.getTaskStatistics();

        const weekly = this.getWeeklyStatistics();

        const streak = this.getStreak();

        const bestDay = this.getBestDay();


        this.renderSummary(
            stats,
            weekly,
            streak,
            bestDay
        );


        this.renderWeeklyChart(
            weekly.days
        );


        this.renderWeeklyActivity(
            weekly
        );


        this.updateProgressElements(
            stats,
            streak,
            bestDay
        );


        this.refreshIcons();
    },


    // --------------------------------------------------------
    // Render progress summary
    // --------------------------------------------------------

    renderSummary: function (
        stats,
        weekly,
        streak,
        bestDay
    ) {

        const container = document.querySelector(
            VelvetProgressConfig.selectors.summaryContainer
        );


        if (!container) {
            return;
        }


        container.innerHTML = `

            <div class="stats-grid">

                <div class="stat-card">

                    <div class="stat-icon">
                        <i data-lucide="check-circle-2"></i>
                    </div>

                    <div class="stat-content">

                        <span class="stat-label">
                            Completed Tasks
                        </span>

                        <h3>
                            ${stats.completed}
                        </h3>

                    </div>

                </div>


                <div class="stat-card">

                    <div class="stat-icon">
                        <i data-lucide="target"></i>
                    </div>

                    <div class="stat-content">

                        <span class="stat-label">
                            Completion Rate
                        </span>

                        <h3>
                            ${stats.percentage}%
                        </h3>

                    </div>

                </div>


                <div class="stat-card">

                    <div class="stat-icon">
                        <i data-lucide="flame"></i>
                    </div>

                    <div class="stat-content">

                        <span class="stat-label">
                            Current Streak
                        </span>

                        <h3>
                            ${streak} day${streak !== 1 ? "s" : ""}
                        </h3>

                    </div>

                </div>


                <div class="stat-card">

                    <div class="stat-icon">
                        <i data-lucide="calendar-check"></i>
                    </div>

                    <div class="stat-content">

                        <span class="stat-label">
                            Active Days This Week
                        </span>

                        <h3>
                            ${weekly.activeDays}/7
                        </h3>

                    </div>

                </div>

            </div>


            <div class="progress-summary-card dashboard-card">

                <div class="card-header">

                    <h3>Your Overall Progress ♡</h3>

                    <span class="badge">
                        ${stats.percentage}%
                    </span>

                </div>


                <div class="progress-bar">

                    <div
                        class="progress-bar-fill"
                        style="width: ${stats.percentage}%"
                    ></div>

                </div>


                <p>
                    ${stats.completed} completed out of
                    ${stats.total} total tasks.
                </p>

            </div>


            <div class="progress-summary-card dashboard-card">

                <div class="card-header">

                    <h3>Weekly Overview</h3>

                </div>


                <div class="weekly-stat-row">

                    <span>Tasks completed this week</span>

                    <strong>
                        ${weekly.completed}
                    </strong>

                </div>


                <div class="weekly-stat-row">

                    <span>Tasks recorded this week</span>

                    <strong>
                        ${weekly.total}
                    </strong>

                </div>


                <div class="weekly-stat-row">

                    <span>Average daily completion</span>

                    <strong>
                        ${weekly.average}%
                    </strong>

                </div>


                <div class="weekly-stat-row">

                    <span>Best day this week</span>

                    <strong>
                        ${this.escapeHTML(weekly.bestDay.dayName)}
                        ${weekly.bestDay.completed > 0
                            ? `(${weekly.bestDay.completed})`
                            : ""
                        }
                    </strong>

                </div>

            </div>


            <div class="progress-summary-card dashboard-card">

                <div class="card-header">

                    <h3>Personal Best ♡</h3>

                </div>


                <div class="weekly-stat-row">

                    <span>Most tasks completed in a day</span>

                    <strong>
                        ${bestDay.completed}
                    </strong>

                </div>


                <div class="weekly-stat-row">

                    <span>Date</span>

                    <strong>
                        ${bestDay.date
                            ? this.escapeHTML(this.formatDate(bestDay.date))
                            : "Not yet recorded"
                        }
                    </strong>

                </div>

            </div>

        `;
    },


    // --------------------------------------------------------
    // Render weekly chart
    // --------------------------------------------------------

    renderWeeklyChart: function (days) {

        const container = document.querySelector(
            VelvetProgressConfig.selectors.chartContainer
        );


        if (!container) {
            return;
        }


        const maxCompleted = Math.max(
            ...days.map(day => day.completed),
            1
        );


        container.innerHTML = `

            <div class="weekly-chart">

                ${days.map(day => {

                    const height = day.completed > 0
                        ? Math.max(
                            (day.completed / maxCompleted) * 100,
                            8
                        )
                        : 3;


                    return `

                        <div
                            class="chart-bar-container ${day.isToday ? "today" : ""}"
                            title="${this.escapeHTML(day.date)}: ${day.completed} completed"
                        >

                            <span class="chart-day-count">
                                ${day.completed}
                            </span>

                            <div class="chart-bar-wrapper">

                                <div
                                    class="chart-bar"
                                    style="height: ${height}%"
                                ></div>

                            </div>

                            <span class="chart-day-label">
                                ${this.escapeHTML(day.dayName)}
                            </span>

                        </div>

                    `;

                }).join("")}

            </div>

        `;
    },


    // --------------------------------------------------------
    // Render weekly activity details
    // --------------------------------------------------------

    renderWeeklyActivity: function (weekly) {

        const container = document.querySelector(
            VelvetProgressConfig.selectors.weeklyContainer
        );


        if (!container) {
            return;
        }


        container.innerHTML = `

            <div class="weekly-activity-list">

                ${weekly.days.map(day => `

                    <div class="weekly-activity-row ${day.isToday ? "today" : ""}">

                        <div class="weekly-activity-date">

                            <strong>
                                ${this.escapeHTML(day.dayName)}
                            </strong>

                            <span>
                                ${day.dayNumber}
                            </span>

                        </div>


                        <div class="weekly-activity-progress">

                            <div class="progress-bar">

                                <div
                                    class="progress-bar-fill"
                                    style="width: ${day.percentage}%"
                                ></div>

                            </div>

                        </div>


                        <div class="weekly-activity-count">

                            ${day.completed}/${day.total}

                        </div>

                    </div>

                `).join("")}

            </div>

        `;
    },


    // --------------------------------------------------------
    // Update existing HTML progress elements
    // --------------------------------------------------------

    updateProgressElements: function (
        stats,
        streak,
        bestDay
    ) {

        this.setText(
            VelvetProgressConfig.selectors.completed,
            stats.completed
        );


        this.setText(
            VelvetProgressConfig.selectors.total,
            stats.total
        );


        this.setText(
            VelvetProgressConfig.selectors.pending,
            stats.pending
        );


        this.setText(
            VelvetProgressConfig.selectors.percentage,
            `${stats.percentage}%`
        );


        this.setText(
            VelvetProgressConfig.selectors.streak,
            streak
        );


        this.setText(
            VelvetProgressConfig.selectors.bestDay,
            bestDay.completed
        );


        const progressBar = document.querySelector(
            VelvetProgressConfig.selectors.progressBar
        );


        if (progressBar) {

            progressBar.style.width =
                `${stats.percentage}%`;
        }
    },


    // --------------------------------------------------------
    // Update text content safely
    // --------------------------------------------------------

    setText: function (selector, value) {

        const element = document.querySelector(selector);


        if (element) {

            element.textContent = value;
        }
    },


    // --------------------------------------------------------
    // Bind events
    // --------------------------------------------------------

    bindEvents: function () {

        // Refresh when tasks change
        document.addEventListener(
            "velvet:tasks-updated",
            () => {

                this.recordToday();

                this.render();
            }
        );


        // Refresh after data reload
        document.addEventListener(
            "velvet:data-reloaded",
            () => {

                this.recordToday();

                this.render();
            }
        );


        // Refresh on a new day
        document.addEventListener(
            "visibilitychange",
            () => {

                if (!document.hidden) {

                    this.recordToday();

                    this.render();
                }
            }
        );
    },


    // --------------------------------------------------------
    // Format date
    // --------------------------------------------------------

    formatDate: function (dateKey) {

        const date = this.parseDate(dateKey);


        if (!date) {
            return dateKey || "";
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
    // Export progress history
    // --------------------------------------------------------

    exportHistory: function () {

        return JSON.stringify(
            this.history,
            null,
            2
        );
    },


    // --------------------------------------------------------
    // Reset history
    // --------------------------------------------------------

    resetHistory: function () {

        const confirmed = window.confirm(
            "Are you sure you want to clear your productivity history?"
        );


        if (!confirmed) {
            return false;
        }


        this.history = [];


        this.saveHistory();


        this.recordToday();


        this.render();


        console.log(
            "Progress history reset."
        );


        return true;
    },


    // --------------------------------------------------------
    // Dispatch custom event
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
    }

};


// ============================================================
// 3. EXPOSE PROGRESS MANAGER
// ============================================================

window.VelvetProgress = VelvetProgress;


// ============================================================
// 4. INITIALIZE WHEN DOM IS READY
// ============================================================

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        () => VelvetProgress.initialize(),
        { once: true }
    );

} else {

    VelvetProgress.initialize();
}
