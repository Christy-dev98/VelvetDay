
// ============================================================
// VELVET DAY - CHECKLIST MANAGER
// File: js/checklist.js
//
// Features:
// - Create multiple checklists
// - Add checklist items
// - Complete / uncomplete items
// - Rename checklists
// - Delete checklist items
// - Delete complete checklists
// - Checklist templates
// - Progress tracking
// - Local storage persistence
// ============================================================


// ============================================================
// 1. CONFIGURATION
// ============================================================

const VelvetChecklistConfig = {

    storageKey: "checklists",

    selectors: {
        container: "#checklistsContainer",
        form: "#checklistForm",
        titleInput: "#checklistTitle",
        modal: "#checklistModal",
        modalTitle: "#checklistModalTitle",
        addButton: "[data-add-checklist]",
        templateButton: "[data-checklist-template]"
    },

    // Built-in checklist templates
    templates: {

        packing: {
            title: "Packing Checklist",
            icon: "luggage",
            items: [
                "Clothes",
                "Nightwear",
                "Underwear",
                "Toiletries",
                "Skincare",
                "Medicines",
                "Phone charger",
                "Power bank",
                "Wallet",
                "Travel documents"
            ]
        },

        shopping: {
            title: "Shopping List",
            icon: "shopping-basket",
            items: [
                "Groceries",
                "Fruits",
                "Vegetables",
                "Milk",
                "Snacks",
                "Household essentials"
            ]
        },

        morning: {
            title: "Morning Routine",
            icon: "sunrise",
            items: [
                "Wake up",
                "Drink water",
                "Make my bed",
                "Brush teeth",
                "Skincare",
                "Get dressed",
                "Eat breakfast"
            ]
        },

        study: {
            title: "Study Checklist",
            icon: "book-open",
            items: [
                "Review today's topics",
                "Read study material",
                "Make notes",
                "Practice questions",
                "Revise difficult topics",
                "Review what I learned"
            ]
        },

        selfcare: {
            title: "Self Care Checklist",
            icon: "heart",
            items: [
                "Drink enough water",
                "Take a proper break",
                "Eat nourishing meals",
                "Go for a walk",
                "Do skincare",
                "Get enough sleep"
            ]
        },

        cleaning: {
            title: "Cleaning Checklist",
            icon: "sparkles",
            items: [
                "Make the bed",
                "Organize the desk",
                "Clean surfaces",
                "Put clothes away",
                "Empty trash",
                "Organize things back in place"
            ]
        }
    }
};


// ============================================================
// 2. CHECKLIST MANAGER
// ============================================================

const VelvetChecklist = {

    // --------------------------------------------------------
    // State
    // --------------------------------------------------------

    checklists: [],

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

        // Load saved checklists
        this.loadChecklists();

        // Bind HTML events
        this.bindEvents();

        // Render checklists
        this.render();

        console.log("Velvet Checklist initialized ♡");
    },


    // --------------------------------------------------------
    // Load checklists
    // --------------------------------------------------------

    loadChecklists: function () {

        try {

            const saved = VelvetStorage.get(
                VelvetChecklistConfig.storageKey
            );

            this.checklists = Array.isArray(saved)
                ? saved
                : [];

        } catch (error) {

            console.error("Unable to load checklists:", error);

            this.checklists = [];
        }
    },


    // --------------------------------------------------------
    // Save checklists
    // --------------------------------------------------------

    saveChecklists: function () {

        try {

            VelvetStorage.set(
                VelvetChecklistConfig.storageKey,
                this.checklists
            );

            return true;

        } catch (error) {

            console.error("Unable to save checklists:", error);

            this.showMessage(
                "Unable to save checklist.",
                "error"
            );

            return false;
        }
    },


    // --------------------------------------------------------
    // Create checklist
    // --------------------------------------------------------

    createChecklist: function (title, items = []) {

        title = String(title || "").trim();


        if (!title) {

            this.showMessage(
                "Please enter a checklist name.",
                "warning"
            );

            return null;
        }


        const now = new Date().toISOString();


        // Create checklist object
        const checklist = {

            id: this.generateId(),

            title: title,

            icon: "list-check",

            items: items.map(item => {

                // Support both strings and objects
                if (typeof item === "string") {

                    return {
                        id: this.generateId(),
                        text: item,
                        completed: false,
                        createdAt: now
                    };
                }


                return {
                    id: item.id || this.generateId(),
                    text: String(item.text || ""),
                    completed: Boolean(item.completed),
                    createdAt: item.createdAt || now
                };
            }),

            createdAt: now,

            updatedAt: now
        };


        // Add checklist
        this.checklists.unshift(checklist);


        // Save
        if (!this.saveChecklists()) {

            this.checklists.shift();

            return null;
        }


        // Render
        this.render();


        // Notify other modules
        this.dispatchEvent("velvet:checklists-updated", {
            checklists: this.checklists
        });


        this.showMessage(
            "Checklist created ♡",
            "success"
        );


        return checklist;
    },


    // --------------------------------------------------------
    // Create checklist from template
    // --------------------------------------------------------

    createFromTemplate: function (templateName) {

        const template =
            VelvetChecklistConfig.templates[templateName];


        if (!template) {

            this.showMessage(
                "Checklist template not found.",
                "error"
            );

            return null;
        }


        // Create a fresh copy of template items
        const items = template.items.map(item => ({
            id: this.generateId(),
            text: item,
            completed: false,
            createdAt: new Date().toISOString()
        }));


        const checklist = this.createChecklist(
            template.title,
            items
        );


        // Set template icon
        if (checklist) {

            checklist.icon = template.icon || "list-check";

            this.saveChecklists();

            this.render();
        }


        return checklist;
    },


    // --------------------------------------------------------
    // Add item to checklist
    // --------------------------------------------------------

    addItem: function (checklistId, text) {

        text = String(text || "").trim();


        if (!text) {

            this.showMessage(
                "Enter an item first.",
                "warning"
            );

            return null;
        }


        const checklist = this.getChecklistById(checklistId);


        if (!checklist) {
            return null;
        }


        const item = {

            id: this.generateId(),

            text: text,

            completed: false,

            createdAt: new Date().toISOString()
        };


        checklist.items.push(item);

        checklist.updatedAt = new Date().toISOString();


        // Save
        if (!this.saveChecklists()) {

            checklist.items.pop();

            return null;
        }


        this.render();


        this.dispatchEvent("velvet:checklists-updated", {
            checklists: this.checklists
        });


        return item;
    },


    // --------------------------------------------------------
    // Toggle item completion
    // --------------------------------------------------------

    toggleItem: function (checklistId, itemId) {

        const checklist = this.getChecklistById(checklistId);


        if (!checklist) {
            return false;
        }


        const item = checklist.items.find(
            item => String(item.id) === String(itemId)
        );


        if (!item) {
            return false;
        }


        const previousValue = item.completed;


        // Toggle completion
        item.completed = !item.completed;

        checklist.updatedAt = new Date().toISOString();


        // Save
        if (!this.saveChecklists()) {

            item.completed = previousValue;

            return false;
        }


        this.render();


        this.dispatchEvent("velvet:checklists-updated", {
            checklists: this.checklists
        });


        return true;
    },


    // --------------------------------------------------------
    // Delete checklist item
    // --------------------------------------------------------

    deleteItem: function (checklistId, itemId) {

        const checklist = this.getChecklistById(checklistId);


        if (!checklist) {
            return false;
        }


        const itemIndex = checklist.items.findIndex(
            item => String(item.id) === String(itemId)
        );


        if (itemIndex === -1) {
            return false;
        }


        const deletedItem = checklist.items[itemIndex];


        // Remove item
        checklist.items.splice(itemIndex, 1);

        checklist.updatedAt = new Date().toISOString();


        // Save
        if (!this.saveChecklists()) {

            checklist.items.splice(itemIndex, 0, deletedItem);

            return false;
        }


        this.render();


        this.dispatchEvent("velvet:checklists-updated", {
            checklists: this.checklists
        });


        return true;
    },


    // --------------------------------------------------------
    // Rename checklist
    // --------------------------------------------------------

    renameChecklist: function (checklistId, newTitle) {

        newTitle = String(newTitle || "").trim();


        if (!newTitle) {

            this.showMessage(
                "Checklist name cannot be empty.",
                "warning"
            );

            return false;
        }


        const checklist = this.getChecklistById(checklistId);


        if (!checklist) {
            return false;
        }


        const previousTitle = checklist.title;


        checklist.title = newTitle;

        checklist.updatedAt = new Date().toISOString();


        // Save
        if (!this.saveChecklists()) {

            checklist.title = previousTitle;

            return false;
        }


        this.render();


        this.dispatchEvent("velvet:checklists-updated", {
            checklists: this.checklists
        });


        this.showMessage(
            "Checklist renamed ♡",
            "success"
        );


        return true;
    },


    // --------------------------------------------------------
    // Delete checklist
    // --------------------------------------------------------

    deleteChecklist: function (checklistId) {

        const index = this.checklists.findIndex(
            checklist =>
                String(checklist.id) === String(checklistId)
        );


        if (index === -1) {
            return false;
        }


        const checklist = this.checklists[index];


        const confirmed = window.confirm(
            `Delete "${checklist.title}" and all its items?`
        );


        if (!confirmed) {
            return false;
        }


        // Remove checklist
        this.checklists.splice(index, 1);


        // Save
        if (!this.saveChecklists()) {

            this.checklists.splice(index, 0, checklist);

            return false;
        }


        this.render();


        this.dispatchEvent("velvet:checklists-updated", {
            checklists: this.checklists
        });


        this.showMessage(
            "Checklist deleted.",
            "success"
        );


        return true;
    },


    // --------------------------------------------------------
    // Clear completed items in a checklist
    // --------------------------------------------------------

    clearCompleted: function (checklistId) {

        const checklist = this.getChecklistById(checklistId);


        if (!checklist) {
            return false;
        }


        const originalItems = [...checklist.items];


        checklist.items = checklist.items.filter(
            item => !item.completed
        );


        checklist.updatedAt = new Date().toISOString();


        if (!this.saveChecklists()) {

            checklist.items = originalItems;

            return false;
        }


        this.render();


        this.dispatchEvent("velvet:checklists-updated", {
            checklists: this.checklists
        });


        this.showMessage(
            "Completed items cleared.",
            "success"
        );


        return true;
    },


    // --------------------------------------------------------
    // Mark all items complete / incomplete
    // --------------------------------------------------------

    toggleAllItems: function (checklistId, completed) {

        const checklist = this.getChecklistById(checklistId);


        if (!checklist) {
            return false;
        }


        const previousItems = checklist.items.map(item => ({
            ...item
        }));


        checklist.items.forEach(item => {

            item.completed = Boolean(completed);

        });


        checklist.updatedAt = new Date().toISOString();


        if (!this.saveChecklists()) {

            checklist.items = previousItems;

            return false;
        }


        this.render();


        this.dispatchEvent("velvet:checklists-updated", {
            checklists: this.checklists
        });


        return true;
    },


    // --------------------------------------------------------
    // Get checklist progress
    // --------------------------------------------------------

    getProgress: function (checklist) {

        const total = checklist.items.length;


        const completed = checklist.items.filter(
            item => item.completed
        ).length;


        const remaining = total - completed;


        const percentage = total === 0
            ? 0
            : Math.round((completed / total) * 100);


        return {

            total: total,

            completed: completed,

            remaining: remaining,

            percentage: percentage
        };
    },


    // --------------------------------------------------------
    // Render all checklists
    // --------------------------------------------------------

    render: function () {

        const container = document.querySelector(
            VelvetChecklistConfig.selectors.container
        );


        if (!container) {
            return;
        }


        // Empty state
        if (this.checklists.length === 0) {

            container.innerHTML = `
                <div class="empty-state">

                    <div class="empty-state-icon">
                        <i data-lucide="list-check"></i>
                    </div>

                    <h3>No checklists yet</h3>

                    <p>
                        Create a checklist to organize little
                        steps into something manageable.
                    </p>

                    <button
                        type="button"
                        class="primary-button"
                        data-add-checklist
                    >
                        <i data-lucide="plus"></i>
                        Create Checklist
                    </button>

                </div>
            `;


            this.refreshIcons();

            return;
        }


        // Render cards
        container.innerHTML = this.checklists
            .map(checklist => this.createChecklistHTML(checklist))
            .join("");


        this.refreshIcons();
    },


    // --------------------------------------------------------
    // Create checklist card HTML
    // --------------------------------------------------------

    createChecklistHTML: function (checklist) {

        const progress = this.getProgress(checklist);


        const title = this.escapeHTML(checklist.title);

        const checklistId = this.escapeHTML(
            String(checklist.id)
        );


        const itemsHTML = checklist.items.length === 0

            ? `
                <div class="checklist-empty-items">
                    <p>No items yet. Add something below ♡</p>
                </div>
            `

            : checklist.items.map(item => {

                const itemId = this.escapeHTML(
                    String(item.id)
                );

                const itemText = this.escapeHTML(
                    item.text
                );


                return `
                    <div
                        class="checklist-item ${item.completed ? "completed" : ""}"
                        data-item-id="${itemId}"
                    >

                        <label class="checklist-item-label">

                            <input
                                type="checkbox"
                                class="checklist-checkbox"
                                data-checklist-action="toggle-item"
                                data-checklist-id="${checklistId}"
                                data-item-id="${itemId}"
                                ${item.completed ? "checked" : ""}
                            >

                            <span class="checklist-item-text">
                                ${itemText}
                            </span>

                        </label>


                        <button
                            type="button"
                            class="icon-button checklist-delete-item"
                            data-checklist-action="delete-item"
                            data-checklist-id="${checklistId}"
                            data-item-id="${itemId}"
                            title="Delete item"
                            aria-label="Delete ${itemText}"
                        >
                            <i data-lucide="x"></i>
                        </button>

                    </div>
                `;

            }).join("");


        return `
            <article
                class="checklist-card"
                data-checklist-id="${checklistId}"
            >

                <!-- Checklist header -->
                <div class="checklist-card-header">

                    <div class="checklist-card-title-area">

                        <div class="checklist-card-icon">
                            <i data-lucide="${this.escapeHTML(checklist.icon || "list-check")}"></i>
                        </div>

                        <div class="checklist-card-heading">

                            <h3 class="checklist-title">
                                ${title}
                            </h3>

                            <span class="checklist-count">
                                ${progress.completed} of ${progress.total} completed
                            </span>

                        </div>

                    </div>


                    <!-- Checklist menu -->
                    <div class="checklist-card-actions">

                        <button
                            type="button"
                            class="icon-button"
                            data-checklist-action="rename"
                            data-checklist-id="${checklistId}"
                            title="Rename checklist"
                            aria-label="Rename checklist"
                        >
                            <i data-lucide="pencil"></i>
                        </button>


                        <button
                            type="button"
                            class="icon-button"
                            data-checklist-action="delete-checklist"
                            data-checklist-id="${checklistId}"
                            title="Delete checklist"
                            aria-label="Delete checklist"
                        >
                            <i data-lucide="trash-2"></i>
                        </button>

                    </div>

                </div>


                <!-- Progress -->
                <div class="checklist-progress-section">

                    <div class="checklist-progress-info">

                        <span>Progress</span>

                        <span class="checklist-progress-percent">
                            ${progress.percentage}%
                        </span>

                    </div>


                    <div class="progress-bar-fill">

                        <div
                            class="progress-fill"
                            style="width: ${progress.percentage}%"
                        ></div>

                    </div>

                </div>


                <!-- Items -->
                <div class="checklist-items">

                    ${itemsHTML}

                </div>


                <!-- Add item -->
                <form
                    class="checklist-add-item-form"
                    data-checklist-form
                    data-checklist-id="${checklistId}"
                >

                    <input
                        type="text"
                        class="checklist-add-item-input"
                        name="item"
                        placeholder="Add another item..."
                        autocomplete="off"
                        maxlength="300"
                    >

                    <button
                        type="submit"
                        class="icon-button checklist-add-item-button"
                        title="Add item"
                        aria-label="Add item"
                    >
                        <i data-lucide="plus"></i>
                    </button>

                </form>


                <!-- Footer actions -->
                <div class="checklist-card-footer">

                    <button
                        type="button"
                        class="task-action-button"
                        data-checklist-action="complete-all"
                        data-checklist-id="${checklistId}"
                    >
                        <i data-lucide="check-check"></i>
                        <span>Complete All</span>
                    </button>


                    <button
                        type="button"
                        class="task-action-button"
                        data-checklist-action="clear-completed"
                        data-checklist-id="${checklistId}"
                    >
                        <i data-lucide="eraser"></i>
                        <span>Clear Completed</span>
                    </button>

                </div>

            </article>
        `;
    },


    // --------------------------------------------------------
    // Bind all events
    // --------------------------------------------------------

    bindEvents: function () {

        // Add checklist button
        document.addEventListener("click", (event) => {

            const addButton = event.target.closest(
                VelvetChecklistConfig.selectors.addButton
            );


            if (addButton) {

                this.openModal();
            }
        });


        // Create checklist form
        const form = document.querySelector(
            VelvetChecklistConfig.selectors.form
        );


        if (form) {

            form.addEventListener("submit", (event) => {

                event.preventDefault();


                const titleInput = document.querySelector(
                    VelvetChecklistConfig.selectors.titleInput
                );


                if (!titleInput) {
                    return;
                }


                const checklist = this.createChecklist(
                    titleInput.value
                );


                if (checklist) {

                    form.reset();

                    this.closeModal();
                }

            });
        }


        // Template buttons
        document.addEventListener("click", (event) => {

            const templateButton = event.target.closest(
                VelvetChecklistConfig.selectors.templateButton
            );


            if (!templateButton) {
                return;
            }


            const templateName =
                templateButton.dataset.checklistTemplate;


            this.createFromTemplate(templateName);
        });


        // Checklist card actions
        const container = document.querySelector(
            VelvetChecklistConfig.selectors.container
        );


        if (container) {

            // Click actions
            container.addEventListener("click", (event) => {

                const button = event.target.closest(
                    "[data-checklist-action]"
                );


                if (!button) {
                    return;
                }


                const action = button.dataset.checklistAction;

                const checklistId =
                    button.dataset.checklistId;

                const itemId = button.dataset.itemId;


                switch (action) {

                    case "delete-item":

                        this.deleteItem(
                            checklistId,
                            itemId
                        );

                        break;


                    case "rename":

                        this.handleRename(checklistId);

                        break;


                    case "delete-checklist":

                        this.deleteChecklist(checklistId);

                        break;


                    case "complete-all":

                        this.toggleAllItems(
                            checklistId,
                            true
                        );

                        break;


                    case "clear-completed":

                        this.clearCompleted(checklistId);

                        break;
                }

            });


            // Checkbox completion
            container.addEventListener("change", (event) => {

                const checkbox = event.target.closest(
                    '[data-checklist-action="toggle-item"]'
                );


                if (!checkbox) {
                    return;
                }


                this.toggleItem(
                    checkbox.dataset.checklistId,
                    checkbox.dataset.itemId
                );
            });


            // Add item forms
            container.addEventListener("submit", (event) => {

                const itemForm = event.target.closest(
                    "[data-checklist-form]"
                );


                if (!itemForm) {
                    return;
                }


                event.preventDefault();


                const input = itemForm.querySelector(
                    'input[name="item"]'
                );


                if (!input) {
                    return;
                }


                const checklistId =
                    itemForm.dataset.checklistId;


                const item = this.addItem(
                    checklistId,
                    input.value
                );


                if (item) {

                    // render() recreates the input
                    // and clears it automatically

                    const newInput = container.querySelector(
                        `[data-checklist-form][data-checklist-id="${this.escapeSelector(checklistId)}"] input[name="item"]`
                    );


                    if (newInput) {
                        newInput.focus();
                    }
                }

            });
        }


        // Modal close buttons
        document.addEventListener("click", (event) => {

            const closeButton = event.target.closest(
                '[data-checklist-action="close"]'
            );


            if (closeButton) {

                this.closeModal();
            }
        });


        // Click outside modal
        const modal = document.querySelector(
            VelvetChecklistConfig.selectors.modal
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
                    VelvetChecklistConfig.selectors.modal
                );


                if (
                    modal &&
                    modal.classList.contains("active")
                ) {

                    this.closeModal();
                }
            }
        });
    },


    // --------------------------------------------------------
    // Rename handler
    // --------------------------------------------------------

    handleRename: function (checklistId) {

        const checklist = this.getChecklistById(checklistId);


        if (!checklist) {
            return;
        }


        const newTitle = window.prompt(
            "Enter a new checklist name:",
            checklist.title
        );


        // Cancel
        if (newTitle === null) {
            return;
        }


        this.renameChecklist(
            checklistId,
            newTitle
        );
    },


    // --------------------------------------------------------
    // Open create checklist modal
    // --------------------------------------------------------

    openModal: function () {

        const modal = document.querySelector(
            VelvetChecklistConfig.selectors.modal
        );

        const titleInput = document.querySelector(
            VelvetChecklistConfig.selectors.titleInput
        );

        const modalTitle = document.querySelector(
            VelvetChecklistConfig.selectors.modalTitle
        );


        if (!modal) {
            return;
        }


        if (modalTitle) {
            modalTitle.textContent = "Create a Checklist";
        }


        if (titleInput) {

            titleInput.value = "";

            titleInput.focus();
        }


        modal.classList.add("active");

        document.body.classList.add("modal-open");
    },


    // --------------------------------------------------------
    // Close create checklist modal
    // --------------------------------------------------------

    closeModal: function () {

        const modal = document.querySelector(
            VelvetChecklistConfig.selectors.modal
        );


        if (!modal) {
            return;
        }


        modal.classList.remove("active");

        document.body.classList.remove("modal-open");
    },


    // --------------------------------------------------------
    // Get checklist by ID
    // --------------------------------------------------------

    getChecklistById: function (checklistId) {

        return this.checklists.find(
            checklist =>
                String(checklist.id) === String(checklistId)
        ) || null;
    },


    // --------------------------------------------------------
    // Get all checklists
    // --------------------------------------------------------

    getChecklists: function () {

        return [...this.checklists];
    },


    // --------------------------------------------------------
    // Get total checklist count
    // --------------------------------------------------------

    getCount: function () {

        return this.checklists.length;
    },


    // --------------------------------------------------------
    // Get global checklist statistics
    // --------------------------------------------------------

    getStatistics: function () {

        let totalItems = 0;

        let completedItems = 0;


        this.checklists.forEach(checklist => {

            totalItems += checklist.items.length;

            completedItems += checklist.items.filter(
                item => item.completed
            ).length;
        });


        const remainingItems =
            totalItems - completedItems;


        const percentage = totalItems === 0
            ? 0
            : Math.round(
                (completedItems / totalItems) * 100
            );


        return {

            totalChecklists: this.checklists.length,

            totalItems: totalItems,

            completedItems: completedItems,

            remainingItems: remainingItems,

            percentage: percentage
        };
    },


    // --------------------------------------------------------
    // Generate unique ID
    // --------------------------------------------------------

    generateId: function () {

        if (
            window.crypto &&
            typeof window.crypto.randomUUID === "function"
        ) {

            return window.crypto.randomUUID();
        }


        return "checklist-" +
            Date.now() +
            "-" +
            Math.random().toString(36).substring(2, 9);
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
    // Escape selector special characters
    // --------------------------------------------------------

    escapeSelector: function (value) {

        if (window.CSS && typeof CSS.escape === "function") {

            return CSS.escape(String(value));
        }


        return String(value).replace(
            /["\\]/g,
            "\\$&"
        );
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
    // Display message
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
    // Dispatch event
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
// 3. EXPOSE CHECKLIST MANAGER
// ============================================================

window.VelvetChecklist = VelvetChecklist;


// ============================================================
// 4. INITIALIZE WHEN DOM IS READY
// ============================================================

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        () => VelvetChecklist.initialize(),
        { once: true }
    );

} else {

    VelvetChecklist.initialize();
}

