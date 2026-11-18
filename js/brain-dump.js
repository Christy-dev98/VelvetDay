
// ============================================================
// VELVET DAY - BRAIN DUMP
// File: js/brain-dump.js
//
// Purpose:
// - Capture thoughts quickly
// - Save thoughts in local storage
// - Display saved thoughts
// - Search thoughts
// - Delete individual thoughts
// - Clear all thoughts
// - Convert thoughts into tasks
// ============================================================


// ============================================================
// 1. BRAIN DUMP CONFIGURATION
// ============================================================

const VelvetBrainDumpConfig = {

    storageKey: "brainDump",

    selectors: {
        form: "#brainDumpForm",
        input: "#brainDumpInput",
        container: "#brainDumpContainer",
        search: "#brainDumpSearch",
        clearButton: "#clearBrainDump",

        quickForm: "#quickBrainDumpForm",
        quickInput: "#quickBrainDumpInput"
    }
};


// ============================================================
// 2. BRAIN DUMP MANAGER
// ============================================================

const VelvetBrainDump = {

    // --------------------------------------------------------
    // State
    // --------------------------------------------------------

    entries: [],
    searchText: "",

    initialized: false,


    // --------------------------------------------------------
    // Initialize
    // --------------------------------------------------------

    initialize: function () {

        // Prevent duplicate initialization
        if (this.initialized) {
            return;
        }

        this.initialized = true;

        // Load saved thoughts
        this.loadEntries();

        // Connect HTML events
        this.bindEvents();

        // Render thoughts
        this.render();

        console.log("Velvet Brain Dump initialized ♡");
    },


    // --------------------------------------------------------
    // Load thoughts from local storage
    // --------------------------------------------------------

    loadEntries: function () {

        try {

            const savedEntries = VelvetStorage.get(
                VelvetBrainDumpConfig.storageKey
            );

            this.entries = Array.isArray(savedEntries)
                ? savedEntries
                : [];

        } catch (error) {

            console.error("Unable to load brain dump entries:", error);

            this.entries = [];
        }
    },


    // --------------------------------------------------------
    // Save thoughts to local storage
    // --------------------------------------------------------

    saveEntries: function () {

        try {

            VelvetStorage.set(
                VelvetBrainDumpConfig.storageKey,
                this.entries
            );

            return true;

        } catch (error) {

            console.error("Unable to save brain dump entries:", error);

            this.showMessage(
                "Unable to save your thought.",
                "error"
            );

            return false;
        }
    },


    // --------------------------------------------------------
    // Create a new thought
    // --------------------------------------------------------

    addEntry: function (content) {

        // Remove unnecessary whitespace
        content = String(content || "").trim();

        // Empty thoughts are not allowed
        if (!content) {
            return null;
        }

        // Create thought object
        const entry = {

            id: this.generateId(),

            content: content,

            createdAt: new Date().toISOString(),

            updatedAt: new Date().toISOString()
        };


        // Add newest thought at the beginning
        this.entries.unshift(entry);


        // Save
        if (!this.saveEntries()) {

            // Roll back if saving failed
            this.entries.shift();

            return null;
        }


        // Update UI
        this.render();


        // Notify other modules
        this.dispatchEvent("velvet:brain-dump-updated", {
            entries: this.entries
        });


        this.showMessage(
            "Thought saved. Your mind can breathe now ♡",
            "success"
        );

        return entry;
    },


    // --------------------------------------------------------
    // Delete an individual thought
    // --------------------------------------------------------

    deleteEntry: function (entryId) {

        const entryIndex = this.entries.findIndex(
            entry => String(entry.id) === String(entryId)
        );

        if (entryIndex === -1) {
            return false;
        }


        // Keep deleted entry in case saving fails
        const deletedEntry = this.entries[entryIndex];


        // Remove thought
        this.entries.splice(entryIndex, 1);


        // Save
        if (!this.saveEntries()) {

            // Restore if save failed
            this.entries.splice(entryIndex, 0, deletedEntry);

            return false;
        }


        this.render();


        this.dispatchEvent("velvet:brain-dump-updated", {
            entries: this.entries
        });


        this.showMessage(
            "Thought deleted.",
            "success"
        );

        return true;
    },


    // --------------------------------------------------------
    // Clear all thoughts
    // --------------------------------------------------------

    clearAll: function () {

        if (this.entries.length === 0) {

            this.showMessage(
                "Your brain dump is already empty.",
                "info"
            );

            return;
        }


        // Ask for confirmation
        const confirmed = window.confirm(
            "Are you sure you want to delete all your thoughts? This cannot be undone."
        );

        if (!confirmed) {
            return;
        }


        // Backup current entries
        const previousEntries = [...this.entries];


        // Clear
        this.entries = [];


        // Save
        if (!this.saveEntries()) {

            // Restore if saving failed
            this.entries = previousEntries;

            return;
        }


        this.render();


        this.dispatchEvent("velvet:brain-dump-updated", {
            entries: this.entries
        });


        this.showMessage(
            "Your brain dump is cleared ♡",
            "success"
        );
    },


    // --------------------------------------------------------
    // Convert a thought into a task
    // --------------------------------------------------------

    convertToTask: function (entryId) {

        // Find thought
        const entry = this.entries.find(
            item => String(item.id) === String(entryId)
        );

        if (!entry) {
            return;
        }


        // Check task manager availability
        if (
            !window.VelvetTasks ||
            typeof window.VelvetTasks.addTask !== "function"
        ) {

            this.showMessage(
                "Task manager is not available yet.",
                "error"
            );

            return;
        }


        // Convert thought into task
        const newTask = window.VelvetTasks.addTask({

            title: entry.content.length > 150
                ? entry.content.substring(0, 150)
                : entry.content,

            description: entry.content,

            category: "Personal",

            priority: "medium",

            dueDate: ""
        });


        // Remove thought only if task creation succeeds
        if (newTask) {

            this.deleteEntryWithoutMessage(entryId);

            this.showMessage(
                "Thought turned into a task ✨",
                "success"
            );

        }
    },


    // --------------------------------------------------------
    // Delete thought without displaying another message
    // Used during conversion to task
    // --------------------------------------------------------

    deleteEntryWithoutMessage: function (entryId) {

        const entryIndex = this.entries.findIndex(
            entry => String(entry.id) === String(entryId)
        );

        if (entryIndex === -1) {
            return false;
        }


        const deletedEntry = this.entries[entryIndex];


        this.entries.splice(entryIndex, 1);


        if (!this.saveEntries()) {

            // Restore if storage failed
            this.entries.splice(entryIndex, 0, deletedEntry);

            return false;
        }


        this.render();


        this.dispatchEvent("velvet:brain-dump-updated", {
            entries: this.entries
        });


        return true;
    },


    // --------------------------------------------------------
    // Search thoughts
    // --------------------------------------------------------

    setSearch: function (searchText) {

        this.searchText = String(searchText || "")
            .trim()
            .toLowerCase();

        this.render();
    },


    // --------------------------------------------------------
    // Get filtered entries
    // --------------------------------------------------------

    getFilteredEntries: function () {

        if (!this.searchText) {
            return [...this.entries];
        }


        return this.entries.filter(entry => {

            return entry.content
                .toLowerCase()
                .includes(this.searchText);

        });
    },


    // --------------------------------------------------------
    // Render thoughts
    // --------------------------------------------------------

    render: function () {

        const container = document.querySelector(
            VelvetBrainDumpConfig.selectors.container
        );

        if (!container) {
            return;
        }


        const filteredEntries = this.getFilteredEntries();


        // Empty state
        if (filteredEntries.length === 0) {

            if (this.searchText) {

                container.innerHTML = `
                    <div class="empty-state">

                        <div class="empty-state-icon">
                            <i data-lucide="search"></i>
                        </div>

                        <h3>No thoughts found</h3>

                        <p>
                            Try searching for something else.
                        </p>

                    </div>
                `;

            } else {

                container.innerHTML = `
                    <div class="empty-state">

                        <div class="empty-state-icon">
                            <i data-lucide="brain"></i>
                        </div>

                        <h3>Your mind is wonderfully quiet</h3>

                        <p>
                            Whenever a thought pops up, write it down here.
                            You don't need to organize it.
                        </p>

                    </div>
                `;
            }


            this.refreshIcons();

            return;
        }


        // Render entries
        container.innerHTML = filteredEntries
            .map(entry => this.createEntryHTML(entry))
            .join("");


        // Refresh icons after dynamic HTML rendering
        this.refreshIcons();
    },


    // --------------------------------------------------------
    // Create HTML for a single thought
    // --------------------------------------------------------

    createEntryHTML: function (entry) {

        const content = this.escapeHTML(entry.content);

        const dateLabel = this.formatDate(entry.createdAt);


        return `
            <article class="brain-dump-card" data-entry-id="${this.escapeHTML(String(entry.id))}">

                <div class="brain-dump-card-header">

                    <div class="brain-dump-card-icon">
                        <i data-lucide="brain"></i>
                    </div>

                    <span class="brain-dump-date">
                        ${this.escapeHTML(dateLabel)}
                    </span>

                </div>


                <div class="brain-dump-card-content">
                    <p>${content.replace(/\n/g, "<br>")}</p>
                </div>


                <div class="brain-dump-card-actions">

                    <button
                        type="button"
                        class="task-action-button"
                        data-brain-action="convert"
                        data-entry-id="${this.escapeHTML(String(entry.id))}"
                        title="Convert into task"
                        aria-label="Convert into task"
                    >
                        <i data-lucide="list-plus"></i>
                        <span>Make Task</span>
                    </button>


                    <button
                        type="button"
                        class="task-action-button delete-action"
                        data-brain-action="delete"
                        data-entry-id="${this.escapeHTML(String(entry.id))}"
                        title="Delete thought"
                        aria-label="Delete thought"
                    >
                        <i data-lucide="trash-2"></i>
                    </button>

                </div>

            </article>
        `;
    },


    // --------------------------------------------------------
    // Bind HTML events
    // --------------------------------------------------------

    bindEvents: function () {

        // Full brain dump form
        const form = document.querySelector(
            VelvetBrainDumpConfig.selectors.form
        );


        if (form) {

            form.addEventListener("submit", (event) => {

                event.preventDefault();


                const input = document.querySelector(
                    VelvetBrainDumpConfig.selectors.input
                );


                if (!input) {
                    return;
                }


                const content = input.value.trim();


                if (!content) {

                    this.showMessage(
                        "Write something first ♡",
                        "warning"
                    );

                    input.focus();

                    return;
                }


                const entry = this.addEntry(content);


                if (entry) {

                    input.value = "";

                    input.focus();
                }

            });
        }


        // Dashboard quick brain dump
        const quickForm = document.querySelector(
            VelvetBrainDumpConfig.selectors.quickForm
        );


        if (quickForm) {

            quickForm.addEventListener("submit", (event) => {

                event.preventDefault();


                const quickInput = document.querySelector(
                    VelvetBrainDumpConfig.selectors.quickInput
                );


                if (!quickInput) {
                    return;
                }


                const content = quickInput.value.trim();


                if (!content) {
                    return;
                }


                const entry = this.addEntry(content);


                if (entry) {

                    quickInput.value = "";

                }

            });
        }


        // Search thoughts
        const searchInput = document.querySelector(
            VelvetBrainDumpConfig.selectors.search
        );


        if (searchInput) {

            searchInput.addEventListener("input", (event) => {

                this.setSearch(event.target.value);

            });
        }


        // Clear all thoughts
        const clearButton = document.querySelector(
            VelvetBrainDumpConfig.selectors.clearButton
        );


        if (clearButton) {

            clearButton.addEventListener("click", () => {

                this.clearAll();

            });
        }


        // Handle actions on dynamically rendered thoughts
        const container = document.querySelector(
            VelvetBrainDumpConfig.selectors.container
        );


        if (container) {

            container.addEventListener("click", (event) => {

                const button = event.target.closest(
                    "[data-brain-action]"
                );


                if (!button) {
                    return;
                }


                const action = button.dataset.brainAction;

                const entryId = button.dataset.entryId;


                if (action === "delete") {

                    this.deleteEntry(entryId);

                }


                if (action === "convert") {

                    this.convertToTask(entryId);

                }

            });
        }
    },


    // --------------------------------------------------------
    // Generate unique ID
    // --------------------------------------------------------

    generateId: function () {

        // Use crypto when available
        if (
            window.crypto &&
            typeof window.crypto.randomUUID === "function"
        ) {

            return window.crypto.randomUUID();
        }


        // Fallback ID
        return "brain-" +
            Date.now() +
            "-" +
            Math.random().toString(36).substring(2, 9);
    },


    // --------------------------------------------------------
    // Escape HTML to prevent HTML injection
    // --------------------------------------------------------

    escapeHTML: function (value) {

        const div = document.createElement("div");

        div.textContent = String(value ?? "");

        return div.innerHTML;
    },


    // --------------------------------------------------------
    // Format saved date
    // --------------------------------------------------------

    formatDate: function (dateString) {

        if (!dateString) {
            return "Just now";
        }


        const date = new Date(dateString);


        if (Number.isNaN(date.getTime())) {
            return "Recently";
        }


        const now = new Date();


        // Same day
        if (
            date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
        ) {

            return "Today";
        }


        // Yesterday
        const yesterday = new Date();

        yesterday.setDate(yesterday.getDate() - 1);


        if (
            date.getDate() === yesterday.getDate() &&
            date.getMonth() === yesterday.getMonth() &&
            date.getFullYear() === yesterday.getFullYear()
        ) {

            return "Yesterday";
        }


        // Other dates
        return date.toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
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

        // Use the app's toast system if available
        if (
            window.VelvetToast &&
            typeof window.VelvetToast.show === "function"
        ) {

            window.VelvetToast.show(message, type);

            return;
        }


        // Fallback
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
    },


    // --------------------------------------------------------
    // Public getter
    // --------------------------------------------------------

    getEntries: function () {

        return [...this.entries];
    },


    getEntryById: function (entryId) {

        return this.entries.find(
            entry => String(entry.id) === String(entryId)
        ) || null;
    },


    getCount: function () {

        return this.entries.length;
    }

};


// ============================================================
// 3. MAKE BRAIN DUMP AVAILABLE GLOBALLY
// ============================================================

window.VelvetBrainDump = VelvetBrainDump;


// ============================================================
// 4. INITIALIZE WHEN THE PAGE IS READY
// ============================================================

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        () => VelvetBrainDump.initialize(),
        { once: true }
    );

} else {

    VelvetBrainDump.initialize();
}
