
/* ==========================================================
   VELVET DAY - TASK MANAGER
   File: js/tasks.js

   Features:
   - Create tasks
   - Edit tasks
   - Delete tasks
   - Complete / uncomplete tasks
   - Priorities
   - Categories
   - Due dates
   - Search
   - Filters
   - Sorting
   - Progress tracking
   - Local storage persistence

   Dependencies:
   - storage.js
   - utils.js
   - app.js

   ========================================================== */

(function () {
    "use strict";

    // ----------------------------------------------------------
    // 1. CONFIGURATION
    // ----------------------------------------------------------

    const config = {
        taskContainer: "#tasksContainer",
        taskForm: "#taskForm",
        taskModal: "#taskModal",
        searchInput: "#taskSearch",
        filterButtons: "[data-task-filter]",
        sortSelect: "#taskSort",

        categories: [
            "Personal",
            "Work",
            "Study",
            "Health",
            "Career",
            "Shopping",
            "Other"
        ],

        priorities: ["low", "medium", "high"]
    };

    // ----------------------------------------------------------
    // 2. STATE
    // ----------------------------------------------------------

    const state = {
        tasks: [],
        filter: "all",
        search: "",
        sort: "date-created",
        editingTaskId: null,
        initialized: false
    };

    // ----------------------------------------------------------
    // 3. HELPER - GET ELEMENT
    // ----------------------------------------------------------

    function getElement(selector) {
        return document.querySelector(selector);
    }

    // ----------------------------------------------------------
    // 4. HELPER - GET ALL ELEMENTS
    // ----------------------------------------------------------

    function getAllElements(selector) {
        return document.querySelectorAll(selector);
    }

    // ----------------------------------------------------------
    // 5. LOAD TASKS
    // ----------------------------------------------------------
    // Loads tasks from the app's LocalStorage data.
    // ----------------------------------------------------------

    function loadTasks() {
        if (window.VelvetDay) {
            state.tasks = VelvetDay.get("tasks") || [];
        } else {
            state.tasks = VelvetStorage.get("tasks") || [];
        }

        if (!Array.isArray(state.tasks)) {
            state.tasks = [];
        }

        return state.tasks;
    }

    // ----------------------------------------------------------
    // 6. SAVE TASKS
    // ----------------------------------------------------------
    // Saves the task collection and updates app state.
    // ----------------------------------------------------------

    function saveTasks() {
        if (window.VelvetDay) {
            VelvetDay.set("tasks", state.tasks);
        } else {
            VelvetStorage.set("tasks", state.tasks);
        }

        // Notify other features that tasks have changed
        document.dispatchEvent(
            new CustomEvent("velvet:tasks-updated", {
                detail: {
                    tasks: state.tasks
                }
            })
        );
    }

    // ----------------------------------------------------------
    // 7. CREATE TASK OBJECT
    // ----------------------------------------------------------
    // Builds a new task using form data.
    // ----------------------------------------------------------

    function createTaskObject(taskData) {
        const now = new Date().toISOString();

        return {
            id: VelvetUtils.generateId("task"),
            title: String(taskData.title || "").trim(),
            description: String(taskData.description || "").trim(),
            category: taskData.category || "Personal",
            priority: taskData.priority || "medium",
            dueDate: taskData.dueDate || "",
            completed: false,
            createdAt: now,
            completedAt: null
        };
    }

    // ----------------------------------------------------------
    // 8. ADD TASK
    // ----------------------------------------------------------
    // Adds a task to the task collection.
    //
    // Example:
    // addTask({
    //     title: "Study C#",
    //     priority: "high"
    // });
    // ----------------------------------------------------------

    function addTask(taskData) {
        if (!taskData || !taskData.title || !taskData.title.trim()) {
            showMessage("Please enter a task title.", "warning");
            return null;
        }

        const newTask = createTaskObject(taskData);

        state.tasks.unshift(newTask);

        saveTasks();
        renderTasks();
        updateTaskStatistics();

        showMessage("Task added successfully 💜", "success");

        return newTask;
    }

    // ----------------------------------------------------------
    // 9. GET TASK BY ID
    // ----------------------------------------------------------

    function getTaskById(taskId) {
        return state.tasks.find(function (task) {
            return task.id === taskId;
        }) || null;
    }

    // ----------------------------------------------------------
    // 10. UPDATE TASK
    // ----------------------------------------------------------
    // Updates an existing task.
    // ----------------------------------------------------------

    function updateTask(taskId, updates) {
        const task = getTaskById(taskId);

        if (!task) {
            return false;
        }

        Object.assign(task, updates);

        // Prevent empty titles
        if (!task.title || !task.title.trim()) {
            showMessage("Task title cannot be empty.", "warning");
            return false;
        }

        task.title = task.title.trim();
        task.updatedAt = new Date().toISOString();

        saveTasks();
        renderTasks();
        updateTaskStatistics();

        showMessage("Task updated ✨", "success");

        return true;
    }

    // ----------------------------------------------------------
    // 11. DELETE TASK
    // ----------------------------------------------------------

    function deleteTask(taskId) {
        const task = getTaskById(taskId);

        if (!task) {
            return false;
        }

        const shouldDelete = window.confirm(
            `Delete "${task.title}"?`
        );

        if (!shouldDelete) {
            return false;
        }

        state.tasks = state.tasks.filter(function (item) {
            return item.id !== taskId;
        });

        saveTasks();
        renderTasks();
        updateTaskStatistics();

        showMessage("Task deleted.", "info");

        return true;
    }

    // ----------------------------------------------------------
    // 12. TOGGLE TASK COMPLETION
    // ----------------------------------------------------------
    // Marks a task complete or incomplete.
    // ----------------------------------------------------------

    function toggleTask(taskId) {
        const task = getTaskById(taskId);

        if (!task) {
            return false;
        }

        task.completed = !task.completed;

        task.completedAt = task.completed
            ? new Date().toISOString()
            : null;

        saveTasks();
        renderTasks();
        updateTaskStatistics();

        if (task.completed) {
            showMessage("Task completed! You're doing amazing ✨", "success");
        }

        return true;
    }

    // ----------------------------------------------------------
    // 13. GET TASK STATUS
    // ----------------------------------------------------------

    function getTaskStatus(task) {
        if (task.completed) {
            return "completed";
        }

        if (task.dueDate && VelvetUtils.isPastDate(task.dueDate)) {
            return "overdue";
        }

        if (task.dueDate && VelvetUtils.isToday(task.dueDate)) {
            return "today";
        }

        return "pending";
    }

    // ----------------------------------------------------------
    // 14. GET TASKS FOR TODAY
    // ----------------------------------------------------------

    function getTodayTasks() {
        return state.tasks.filter(function (task) {
            return !task.completed &&
                task.dueDate &&
                VelvetUtils.isToday(task.dueDate);
        });
    }

    // ----------------------------------------------------------
    // 15. GET OVERDUE TASKS
    // ----------------------------------------------------------

    function getOverdueTasks() {
        return state.tasks.filter(function (task) {
            return !task.completed &&
                task.dueDate &&
                VelvetUtils.isPastDate(task.dueDate);
        });
    }

    // ----------------------------------------------------------
    // 16. GET COMPLETED TASKS
    // ----------------------------------------------------------

    function getCompletedTasks() {
        return state.tasks.filter(function (task) {
            return task.completed;
        });
    }

    // ----------------------------------------------------------
    // 17. GET PENDING TASKS
    // ----------------------------------------------------------

    function getPendingTasks() {
        return state.tasks.filter(function (task) {
            return !task.completed;
        });
    }

    // ----------------------------------------------------------
    // 18. GET TASK STATISTICS
    // ----------------------------------------------------------
    // Calculates totals and completion percentages.
    // ----------------------------------------------------------

    function getStatistics() {
        const total = state.tasks.length;

        const completed = state.tasks.filter(function (task) {
            return task.completed;
        }).length;

        const pending = total - completed;

        const overdue = getOverdueTasks().length;

        const today = getTodayTasks().length;

        const percentage = total === 0
            ? 0
            : Math.round((completed / total) * 100);

        return {
            total,
            completed,
            pending,
            overdue,
            today,
            percentage
        };
    }

    // ----------------------------------------------------------
    // 19. FILTER TASKS
    // ----------------------------------------------------------
    // Supported filters:
    // all
    // today
    // pending
    // completed
    // overdue
    // high
    // ----------------------------------------------------------

    function filterTasks(tasks) {
        switch (state.filter) {
            case "today":
                return tasks.filter(function (task) {
                    return !task.completed &&
                        task.dueDate &&
                        VelvetUtils.isToday(task.dueDate);
                });

            case "pending":
                return tasks.filter(function (task) {
                    return !task.completed;
                });

            case "completed":
                return tasks.filter(function (task) {
                    return task.completed;
                });

            case "overdue":
                return tasks.filter(function (task) {
                    return !task.completed &&
                        task.dueDate &&
                        VelvetUtils.isPastDate(task.dueDate);
                });

            case "high":
                return tasks.filter(function (task) {
                    return !task.completed &&
                        task.priority === "high";
                });

            default:
                return tasks;
        }
    }

    // ----------------------------------------------------------
    // 20. SEARCH TASKS
    // ----------------------------------------------------------
    // Searches task title, description and category.
    // ----------------------------------------------------------

    function searchTasks(tasks) {
        if (!state.search.trim()) {
            return tasks;
        }

        const searchTerm = state.search.toLowerCase().trim();

        return tasks.filter(function (task) {
            const title = (task.title || "").toLowerCase();
            const description = (task.description || "").toLowerCase();
            const category = (task.category || "").toLowerCase();

            return (
                title.includes(searchTerm) ||
                description.includes(searchTerm) ||
                category.includes(searchTerm)
            );
        });
    }

    // ----------------------------------------------------------
    // 21. SORT TASKS
    // ----------------------------------------------------------

    function sortTasks(tasks) {
        const sortedTasks = [...tasks];

        switch (state.sort) {
            case "due-date":
                sortedTasks.sort(function (a, b) {
                    // Tasks without dates go to the end
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;

                    return a.dueDate.localeCompare(b.dueDate);
                });
                break;

            case "priority":
                const priorityOrder = {
                    high: 1,
                    medium: 2,
                    low: 3
                };

                sortedTasks.sort(function (a, b) {
                    return (
                        (priorityOrder[a.priority] || 4) -
                        (priorityOrder[b.priority] || 4)
                    );
                });
                break;

            case "alphabetical":
                sortedTasks.sort(function (a, b) {
                    return a.title.localeCompare(b.title);
                });
                break;

            case "date-created":
            default:
                sortedTasks.sort(function (a, b) {
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
                break;
        }

        return sortedTasks;
    }

    // ----------------------------------------------------------
    // 22. GET VISIBLE TASKS
    // ----------------------------------------------------------
    // Combines filtering, searching and sorting.
    // ----------------------------------------------------------

    function getVisibleTasks() {
        let tasks = [...state.tasks];

        tasks = filterTasks(tasks);
        tasks = searchTasks(tasks);
        tasks = sortTasks(tasks);

        return tasks;
    }

    // ----------------------------------------------------------
    // 23. FORMAT DUE DATE LABEL
    // ----------------------------------------------------------
    // Produces friendly labels for task cards.
    // ----------------------------------------------------------

    function getDueDateLabel(task) {
        if (!task.dueDate) {
            return "No due date";
        }

        if (task.completed) {
            return "Completed";
        }

        const relativeLabel =
            VelvetUtils.getRelativeDateLabel(task.dueDate);

        if (getTaskStatus(task) === "overdue") {
            return `Overdue · ${VelvetUtils.formatShortDate(task.dueDate)}`;
        }

        return relativeLabel;
    }

    // ----------------------------------------------------------
    // 24. GET PRIORITY LABEL
    // ----------------------------------------------------------

    function getPriorityLabel(priority) {
        const labels = {
            low: "Low",
            medium: "Medium",
            high: "High"
        };

        return labels[priority] || "Medium";
    }

    // ----------------------------------------------------------
    // 25. CREATE TASK HTML
    // ----------------------------------------------------------
    // Generates the HTML for a single task card.
    //
    // User-entered text is escaped before inserting it into HTML.
    // ----------------------------------------------------------

    function createTaskHTML(task) {
        const title = VelvetUtils.escapeHTML(task.title);
        const description = VelvetUtils.escapeHTML(task.description);
        const category = VelvetUtils.escapeHTML(task.category);
        const priority = VelvetUtils.escapeHTML(task.priority);

        const completedClass = task.completed ? "completed" : "";
        const status = getTaskStatus(task);
        const dueLabel = VelvetUtils.escapeHTML(getDueDateLabel(task));

        return `
            <article class="task-item ${completedClass}"
                     data-task-id="${VelvetUtils.escapeHTML(task.id)}"
                     data-status="${status}">

                <button class="task-checkbox"
                        type="button"
                        data-task-action="toggle"
                        data-task-id="${VelvetUtils.escapeHTML(task.id)}"
                        aria-label="${task.completed ? "Mark incomplete" : "Mark complete"}"
                        aria-pressed="${task.completed}">
                    ${task.completed ? "✓" : ""}
                </button>

                <div class="task-content">

                    <div class="task-main-content">

                        <h3 class="task-title">${title}</h3>

                        ${description ? `
                            <p class="task-description">${description}</p>
                        ` : ""}

                        <div class="task-meta">

                            <span class="task-tag category-tag">
                                ${category}
                            </span>

                            <span class="priority-badge priority-${priority}">
                                ${getPriorityLabel(task.priority)}
                            </span>

                            <span class="task-due-date ${status}">
                                ${dueLabel}
                            </span>

                        </div>

                    </div>

                    <div class="task-actions">

                        <button class="task-action-button"
                                type="button"
                                data-task-action="edit"
                                data-task-id="${VelvetUtils.escapeHTML(task.id)}"
                                aria-label="Edit task">
                            ✎
                        </button>

                        <button class="task-action-button delete-task-button"
                                type="button"
                                data-task-action="delete"
                                data-task-id="${VelvetUtils.escapeHTML(task.id)}"
                                aria-label="Delete task">
                            ×
                        </button>

                    </div>

                </div>

            </article>
        `;
    }

    // ----------------------------------------------------------
    // 26. RENDER EMPTY STATE
    // ----------------------------------------------------------
    // Displays a friendly message when there are no tasks.
    // ----------------------------------------------------------

    function renderEmptyState() {
        const container = getElement(config.taskContainer);

        if (!container) {
            return;
        }

        const messages = {
            all: {
                icon: "♡",
                title: "Your mind is clear",
                description: "Add a task whenever something comes to mind."
            },

            today: {
                icon: "☀",
                title: "Nothing planned for today",
                description: "Enjoy the breathing room or add something new."
            },

            pending: {
                icon: "✨",
                title: "You're all caught up",
                description: "There are no pending tasks right now."
            },

            completed: {
                icon: "🌷",
                title: "Nothing completed yet",
                description: "Your accomplishments will appear here."
            },

            overdue: {
                icon: "🌙",
                title: "No overdue tasks",
                description: "You're right on track."
            },

            high: {
                icon: "♡",
                title: "No high-priority tasks",
                description: "Your urgent tasks will appear here."
            }
        };

        const message = messages[state.filter] || messages.all;

        container.innerHTML = `
            <div class="empty-state task-empty-state">

                <div class="empty-state-icon">
                    ${message.icon}
                </div>

                <h3>${message.title}</h3>

                <p>${message.description}</p>

                <button type="button"
                        class="primary-button"
                        data-task-action="add">
                    + Add a task
                </button>

            </div>
        `;
    }

    // ----------------------------------------------------------
    // 27. RENDER TASKS
    // ----------------------------------------------------------
    // Displays all filtered tasks in the task container.
    // ----------------------------------------------------------

    function renderTasks() {
        const container = getElement(config.taskContainer);

        if (!container) {
            return;
        }

        const visibleTasks = getVisibleTasks();

        // If there are no visible tasks, show empty state
        if (visibleTasks.length === 0) {
            renderEmptyState();
            updateTaskStatistics();
            return;
        }

        container.innerHTML = visibleTasks
            .map(createTaskHTML)
            .join("");

        updateTaskStatistics();
    }

    // ----------------------------------------------------------
    // 28. UPDATE TASK STATISTICS
    // ----------------------------------------------------------
    // Updates elements displaying task totals.
    //
    // Optional HTML elements:
    // [data-task-total]
    // [data-task-completed]
    // [data-task-pending]
    // [data-task-overdue]
    // [data-task-today]
    // [data-task-progress]
    // ----------------------------------------------------------

    function updateTaskStatistics() {
        const stats = getStatistics();

        updateText("[data-task-total]", stats.total);
        updateText("[data-task-completed]", stats.completed);
        updateText("[data-task-pending]", stats.pending);
        updateText("[data-task-overdue]", stats.overdue);
        updateText("[data-task-today]", stats.today);
        updateText("[data-task-progress]", `${stats.percentage}%`);

        // Update progress bars
        const progressBars = getAllElements("[data-task-progress-bar]");

        progressBars.forEach(function (bar) {
            bar.style.width = `${stats.percentage}%`;
            bar.setAttribute("aria-valuenow", stats.percentage);
        });

        // Update progress text
        const progressLabels = getAllElements("[data-task-progress-label]");

        progressLabels.forEach(function (label) {
            label.textContent = `${stats.completed} of ${stats.total} tasks completed`;
        });

        // Notify dashboard
        document.dispatchEvent(
            new CustomEvent("velvet:task-statistics-updated", {
                detail: stats
            })
        );
    }

    // ----------------------------------------------------------
    // 29. UPDATE TEXT HELPER
    // ----------------------------------------------------------

    function updateText(selector, value) {
        const element = getElement(selector);

        if (element) {
            element.textContent = value;
        }
    }

    // ----------------------------------------------------------
    // 30. SHOW MESSAGE
    // ----------------------------------------------------------
    // Uses the app's toast system if available.
    // Falls back to console messages.
    // ----------------------------------------------------------

    function showMessage(message, type = "info") {
        if (
            window.VelvetToast &&
            typeof VelvetToast.show === "function"
        ) {
            VelvetToast.show(message, type);
            return;
        }

        console.log(`[Velvet Day ${type}] ${message}`);
    }

    // ----------------------------------------------------------
    // 31. OPEN TASK MODAL
    // ----------------------------------------------------------
    // Opens the task creation/edit modal.
    //
    // Expected HTML:
    // #taskModal
    // #taskForm
    // ----------------------------------------------------------

    function openTaskModal(taskId = null) {
        const modal = getElement(config.taskModal);
        const form = getElement(config.taskForm);

        if (!modal || !form) {
            console.warn(
                "Velvet Day: Task modal or form was not found."
            );
            return;
        }

        state.editingTaskId = taskId;

        form.reset();

        const task = taskId ? getTaskById(taskId) : null;

        // Update modal title
        const modalTitle = modal.querySelector("[data-task-modal-title]");

        if (modalTitle) {
            modalTitle.textContent = task
                ? "Edit Task"
                : "Create a Task";
        }

        // Populate the form when editing
        if (task) {
            setFormValue(form, "title", task.title);
            setFormValue(form, "description", task.description);
            setFormValue(form, "category", task.category);
            setFormValue(form, "priority", task.priority);
            setFormValue(form, "dueDate", task.dueDate);
        } else {
            setFormValue(form, "priority", "medium");
            setFormValue(form, "category", "Personal");
        }

        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");

        document.body.classList.add("modal-open");

        // Focus task title
        const titleInput = form.querySelector('[name="title"]');

        if (titleInput) {
            setTimeout(function () {
                titleInput.focus();
            }, 100);
        }
    }

    // ----------------------------------------------------------
    // 32. SET FORM VALUE
    // ----------------------------------------------------------
    // Helper for populating form inputs.
    // ----------------------------------------------------------

    function setFormValue(form, name, value) {
        const field = form.elements[name];

        if (field) {
            field.value = value ?? "";
        }
    }

    // ----------------------------------------------------------
    // 33. CLOSE TASK MODAL
    // ----------------------------------------------------------

    function closeTaskModal() {
        const modal = getElement(config.taskModal);

        if (!modal) {
            return;
        }

        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");

        document.body.classList.remove("modal-open");

        state.editingTaskId = null;
    }

    // ----------------------------------------------------------
    // 34. HANDLE TASK FORM SUBMISSION
    // ----------------------------------------------------------
    // Creates a new task or updates an existing task.
    // ----------------------------------------------------------

    function handleTaskFormSubmit(event) {
        event.preventDefault();

        const form = event.target;

        const formData = new FormData(form);

        const taskData = {
            title: formData.get("title"),
            description: formData.get("description"),
            category: formData.get("category"),
            priority: formData.get("priority"),
            dueDate: formData.get("dueDate")
        };

        if (!taskData.title || !taskData.title.trim()) {
            showMessage("Task title is required.", "warning");
            return;
        }

        // Update existing task
        if (state.editingTaskId) {
            const updated = updateTask(
                state.editingTaskId,
                taskData
            );

            if (updated) {
                closeTaskModal();
            }

            return;
        }

        // Create new task
        const createdTask = addTask(taskData);

        if (createdTask) {
            form.reset();
            closeTaskModal();
        }
    }

    // ----------------------------------------------------------
    // 35. HANDLE TASK ACTIONS
    // ----------------------------------------------------------
    // Handles dynamically generated task buttons.
    // ----------------------------------------------------------

    function handleTaskAction(event) {
        const actionButton = event.target.closest("[data-task-action]");

        if (!actionButton) {
            return;
        }

        const action = actionButton.dataset.taskAction;
        const taskId = actionButton.dataset.taskId;

        switch (action) {
            case "toggle":
                toggleTask(taskId);
                break;

            case "edit":
                openTaskModal(taskId);
                break;

            case "delete":
                deleteTask(taskId);
                break;

            case "add":
                openTaskModal();
                break;
        }
    }

    // ----------------------------------------------------------
    // 36. HANDLE TASK FILTER
    // ----------------------------------------------------------
    // Buttons should use:
    // data-task-filter="all"
    // data-task-filter="today"
    // data-task-filter="pending"
    // data-task-filter="completed"
    // data-task-filter="overdue"
    // data-task-filter="high"
    // ----------------------------------------------------------

    function handleFilterClick(event) {
        const filterButton = event.target.closest("[data-task-filter]");

        if (!filterButton) {
            return;
        }

        state.filter = filterButton.dataset.taskFilter;

        // Update active filter button
        getAllElements(config.filterButtons).forEach(function (button) {
            button.classList.toggle(
                "active",
                button.dataset.taskFilter === state.filter
            );
        });

        renderTasks();
    }

    // ----------------------------------------------------------
    // 37. HANDLE SEARCH
    // ----------------------------------------------------------
    // Searches tasks as the user types.
    // ----------------------------------------------------------

    function handleSearchInput(event) {
        state.search = event.target.value || "";

        renderTasks();
    }

    // ----------------------------------------------------------
    // 38. HANDLE SORT
    // ----------------------------------------------------------

    function handleSortChange(event) {
        state.sort = event.target.value || "date-created";

        renderTasks();
    }

    // ----------------------------------------------------------
    // 39. HANDLE MODAL CLOSING
    // ----------------------------------------------------------
    // Close modal by clicking:
    // - Close button
    // - Cancel button
    // - Modal background
    // ----------------------------------------------------------

    function handleModalClick(event) {
        const modal = getElement(config.taskModal);

        if (!modal) {
            return;
        }

        // Close when clicking the backdrop
        if (event.target === modal) {
            closeTaskModal();
            return;
        }

        // Close button
        if (event.target.closest("[data-task-modal-close]")) {
            closeTaskModal();
        }
    }

    // ----------------------------------------------------------
    // 40. REGISTER EVENT LISTENERS
    // ----------------------------------------------------------

    function setupEventListeners() {

        // Task actions
        document.addEventListener("click", handleTaskAction);

        // Task filters
        document.addEventListener("click", handleFilterClick);

        // Task form
        const taskForm = getElement(config.taskForm);

        if (taskForm) {
            taskForm.addEventListener(
                "submit",
                handleTaskFormSubmit
            );
        }

        // Search
        const searchInput = getElement(config.searchInput);

        if (searchInput) {
            searchInput.addEventListener(
                "input",
                handleSearchInput
            );
        }

        // Sort
        const sortSelect = getElement(config.sortSelect);

        if (sortSelect) {
            sortSelect.addEventListener(
                "change",
                handleSortChange
            );
        }

        // Modal
        const modal = getElement(config.taskModal);

        if (modal) {
            modal.addEventListener("click", handleModalClick);
        }

        // Add task buttons anywhere in the app
        getAllElements("[data-add-task]").forEach(function (button) {
            button.addEventListener("click", function () {
                openTaskModal();
            });
        });

        // React to app data being reloaded
        document.addEventListener("velvet:data-reloaded", function () {
            loadTasks();
            renderTasks();
        });
    }

    // ----------------------------------------------------------
    // 41. INITIALIZE TASK MANAGER
    // ----------------------------------------------------------

    function initialize() {
        if (state.initialized) {
            return;
        }

        loadTasks();

        setupEventListeners();

        renderTasks();

        state.initialized = true;

        console.log("✨ Velvet Day task manager initialized.");
    }

    // ----------------------------------------------------------
    // 42. PUBLIC API
    // ----------------------------------------------------------
    // Other scripts can access tasks using VelvetTasks.
    // ----------------------------------------------------------

    window.VelvetTasks = {
        initialize: initialize,

        // CRUD operations
        addTask: addTask,
        updateTask: updateTask,
        deleteTask: deleteTask,
        toggleTask: toggleTask,

        // Task retrieval
        getTasks: function () {
            return [...state.tasks];
        },

        getTaskById: getTaskById,
        getTodayTasks: getTodayTasks,
        getOverdueTasks: getOverdueTasks,
        getCompletedTasks: getCompletedTasks,
        getPendingTasks: getPendingTasks,

        // Statistics
        getStatistics: getStatistics,
        getTaskStatus: getTaskStatus,

        // Filtering
        getVisibleTasks: getVisibleTasks,

        // Rendering
        renderTasks: renderTasks,
        updateTaskStatistics: updateTaskStatistics,

        // UI
        openTaskModal: openTaskModal,
        closeTaskModal: closeTaskModal,

        // State
        state: state
    };

    // ----------------------------------------------------------
    // 43. INITIALIZE AFTER DOM IS READY
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
