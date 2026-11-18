

// ============================================================
// VELVET DAY - NOTES MANAGER
// File: js/notes.js
//
// Features:
// - Create notes
// - Edit notes
// - Delete notes
// - Search notes
// - Pin / unpin notes
// - Color variations
// - Local storage persistence
// ============================================================


// ============================================================
// 1. NOTES CONFIGURATION
// ============================================================

const VelvetNotesConfig = {

    storageKey: "notes",

    selectors: {
        container: "#notesContainer",
        search: "#notesSearch",
        modal: "#noteModal",
        form: "#noteForm",
        title: "#noteTitle",
        content: "#noteContent",
        modalTitle: "#noteModalTitle",
        addButton: "[data-add-note]"
    },

    colors: [
        "lavender",
        "pink",
        "peach",
        "blue",
        "green",
        "yellow"
    ]
};


// ============================================================
// 2. NOTES MANAGER
// ============================================================

const VelvetNotes = {

    // --------------------------------------------------------
    // State
    // --------------------------------------------------------

    notes: [],

    searchText: "",

    editingNoteId: null,

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

        // Load saved notes
        this.loadNotes();

        // Bind events
        this.bindEvents();

        // Render notes
        this.render();

        console.log("Velvet Notes initialized ♡");
    },


    // --------------------------------------------------------
    // Load notes from storage
    // --------------------------------------------------------

    loadNotes: function () {

        try {

            const savedNotes = VelvetStorage.get(
                VelvetNotesConfig.storageKey
            );

            this.notes = Array.isArray(savedNotes)
                ? savedNotes
                : [];

        } catch (error) {

            console.error("Unable to load notes:", error);

            this.notes = [];
        }
    },


    // --------------------------------------------------------
    // Save notes to storage
    // --------------------------------------------------------

    saveNotes: function () {

        try {

            VelvetStorage.set(
                VelvetNotesConfig.storageKey,
                this.notes
            );

            return true;

        } catch (error) {

            console.error("Unable to save notes:", error);

            this.showMessage(
                "Unable to save your note.",
                "error"
            );

            return false;
        }
    },


    // --------------------------------------------------------
    // Create note
    // --------------------------------------------------------

    addNote: function (noteData) {

        noteData = noteData || {};


        const title = String(noteData.title || "").trim();

        const content = String(noteData.content || "").trim();


        // Don't create empty notes
        if (!title && !content) {

            this.showMessage(
                "Write something before saving your note ♡",
                "warning"
            );

            return null;
        }


        const now = new Date().toISOString();


        // Create note object
        const note = {

            id: this.generateId(),

            title: title || "Untitled Note",

            content: content,

            color: noteData.color || this.getRandomColor(),

            pinned: Boolean(noteData.pinned),

            createdAt: now,

            updatedAt: now
        };


        // Add to collection
        this.notes.unshift(note);


        // Save
        if (!this.saveNotes()) {

            this.notes.shift();

            return null;
        }


        // Update UI
        this.render();


        // Dispatch event
        this.dispatchEvent("velvet:notes-updated", {
            notes: this.notes
        });


        this.showMessage(
            "Your note has been saved ♡",
            "success"
        );


        return note;
    },


    // --------------------------------------------------------
    // Update note
    // --------------------------------------------------------

    updateNote: function (noteId, updatedData) {

        const note = this.getNoteById(noteId);


        if (!note) {
            return null;
        }


        // Backup note in case saving fails
        const originalNote = { ...note };


        // Update fields
        note.title = String(
            updatedData.title ?? note.title
        ).trim() || "Untitled Note";


        note.content = String(
            updatedData.content ?? note.content
        ).trim();


        note.color = updatedData.color || note.color;


        note.updatedAt = new Date().toISOString();


        // Save
        if (!this.saveNotes()) {

            // Restore original data
            Object.assign(note, originalNote);

            return null;
        }


        this.render();


        this.dispatchEvent("velvet:notes-updated", {
            notes: this.notes
        });


        this.showMessage(
            "Note updated successfully ♡",
            "success"
        );


        return note;
    },


    // --------------------------------------------------------
    // Delete note
    // --------------------------------------------------------

    deleteNote: function (noteId) {

        const index = this.notes.findIndex(
            note => String(note.id) === String(noteId)
        );


        if (index === -1) {
            return false;
        }


        const deletedNote = this.notes[index];


        const confirmed = window.confirm(
            "Are you sure you want to delete this note?"
        );


        if (!confirmed) {
            return false;
        }


        // Remove note
        this.notes.splice(index, 1);


        // Save
        if (!this.saveNotes()) {

            // Restore note if saving failed
            this.notes.splice(index, 0, deletedNote);

            return false;
        }


        this.render();


        this.dispatchEvent("velvet:notes-updated", {
            notes: this.notes
        });


        this.showMessage(
            "Note deleted.",
            "success"
        );


        return true;
    },


    // --------------------------------------------------------
    // Pin / unpin note
    // --------------------------------------------------------

    togglePin: function (noteId) {

        const note = this.getNoteById(noteId);


        if (!note) {
            return false;
        }


        const previousPinned = Boolean(note.pinned);


        // Toggle pin state
        note.pinned = !previousPinned;

        note.updatedAt = new Date().toISOString();


        // Save
        if (!this.saveNotes()) {

            note.pinned = previousPinned;

            return false;
        }


        this.render();


        this.dispatchEvent("velvet:notes-updated", {
            notes: this.notes
        });


        this.showMessage(
            note.pinned
                ? "Note pinned 📌"
                : "Note unpinned.",
            "success"
        );


        return true;
    },


    // --------------------------------------------------------
    // Search notes
    // --------------------------------------------------------

    setSearch: function (searchText) {

        this.searchText = String(searchText || "")
            .trim()
            .toLowerCase();


        this.render();
    },


    // --------------------------------------------------------
    // Get filtered notes
    // Pinned notes appear first
    // --------------------------------------------------------

    getFilteredNotes: function () {

        let filteredNotes = [...this.notes];


        // Search by title or content
        if (this.searchText) {

            filteredNotes = filteredNotes.filter(note => {

                const title = String(note.title || "")
                    .toLowerCase();

                const content = String(note.content || "")
                    .toLowerCase();


                return title.includes(this.searchText) ||
                       content.includes(this.searchText);
            });
        }


        // Pinned notes first
        filteredNotes.sort((a, b) => {

            if (Boolean(a.pinned) !== Boolean(b.pinned)) {

                return a.pinned ? -1 : 1;
            }


            // Newest updated note first
            return new Date(b.updatedAt || b.createdAt) -
                   new Date(a.updatedAt || a.createdAt);
        });


        return filteredNotes;
    },


    // --------------------------------------------------------
    // Render notes
    // --------------------------------------------------------

    render: function () {

        const container = document.querySelector(
            VelvetNotesConfig.selectors.container
        );


        if (!container) {
            return;
        }


        const filteredNotes = this.getFilteredNotes();


        // Empty state
        if (filteredNotes.length === 0) {

            if (this.searchText) {

                container.innerHTML = `
                    <div class="empty-state">

                        <div class="empty-state-icon">
                            <i data-lucide="search"></i>
                        </div>

                        <h3>No notes found</h3>

                        <p>
                            Try a different search.
                        </p>

                    </div>
                `;

            } else {

                container.innerHTML = `
                    <div class="empty-state">

                        <div class="empty-state-icon">
                            <i data-lucide="notebook-pen"></i>
                        </div>

                        <h3>Your notebook is waiting</h3>

                        <p>
                            Create your first note and save
                            whatever you want to remember.
                        </p>

                        <button
                            type="button"
                            class="primary-button"
                            data-add-note
                        >
                            <i data-lucide="plus"></i>
                            Create Your First Note
                        </button>

                    </div>
                `;
            }


            this.refreshIcons();

            return;
        }


        // Render note cards
        container.innerHTML = filteredNotes
            .map(note => this.createNoteCard(note))
            .join("");


        this.refreshIcons();
    },


    // --------------------------------------------------------
    // Generate note card HTML
    // --------------------------------------------------------

    createNoteCard: function (note) {

        const title = this.escapeHTML(note.title || "Untitled Note");

        const content = this.escapeHTML(note.content || "");

        const color = this.escapeHTML(note.color || "lavender");

        const date = this.formatDate(note.updatedAt || note.createdAt);

        const noteId = this.escapeHTML(String(note.id));


        return `
            <article
                class="note-card note-${color}"
                data-note-id="${noteId}"
            >

                <!-- Card top -->
                <div class="note-card-header">

                    <span class="note-date">
                        ${this.escapeHTML(date)}
                    </span>


                    <div class="note-card-header-actions">

                        <!-- Pin -->
                        <button
                            type="button"
                            class="icon-button note-pin-button ${note.pinned ? "pinned" : ""}"
                            data-note-action="pin"
                            data-note-id="${noteId}"
                            title="${note.pinned ? "Unpin note" : "Pin note"}"
                            aria-label="${note.pinned ? "Unpin note" : "Pin note"}"
                        >
                            <i data-lucide="pin"></i>
                        </button>

                    </div>

                </div>


                <!-- Note content -->
                <div
                    class="note-card-content"
                    data-note-action="edit"
                    data-note-id="${noteId}"
                    role="button"
                    tabindex="0"
                    aria-label="Edit ${title}"
                >

                    <h3 class="note-card-title">
                        ${title}
                    </h3>

                    <p class="note-card-text">
                        ${content.replace(/\n/g, "<br>")}
                    </p>

                </div>


                <!-- Card footer -->
                <div class="note-card-footer">

                    <button
                        type="button"
                        class="task-action-button"
                        data-note-action="edit"
                        data-note-id="${noteId}"
                    >
                        <i data-lucide="pencil"></i>
                        <span>Edit</span>
                    </button>


                    <button
                        type="button"
                        class="task-action-button delete-action"
                        data-note-action="delete"
                        data-note-id="${noteId}"
                    >
                        <i data-lucide="trash-2"></i>
                        <span>Delete</span>
                    </button>

                </div>

            </article>
        `;
    },


    // --------------------------------------------------------
    // Open modal for creating note
    // --------------------------------------------------------

    openModal: function () {

        this.editingNoteId = null;


        const form = document.querySelector(
            VelvetNotesConfig.selectors.form
        );

        const titleInput = document.querySelector(
            VelvetNotesConfig.selectors.title
        );

        const contentInput = document.querySelector(
            VelvetNotesConfig.selectors.content
        );

        const modalTitle = document.querySelector(
            VelvetNotesConfig.selectors.modalTitle
        );


        if (form) {
            form.reset();
        }


        if (modalTitle) {
            modalTitle.textContent = "Create a Note";
        }


        if (titleInput) {
            titleInput.value = "";
        }


        if (contentInput) {
            contentInput.value = "";
        }


        this.showModal();


        // Focus title input
        if (titleInput) {

            setTimeout(() => titleInput.focus(), 100);
        }
    },


    // --------------------------------------------------------
    // Open modal for editing
    // --------------------------------------------------------

    openEditModal: function (noteId) {

        const note = this.getNoteById(noteId);


        if (!note) {
            return;
        }


        this.editingNoteId = note.id;


        const titleInput = document.querySelector(
            VelvetNotesConfig.selectors.title
        );

        const contentInput = document.querySelector(
            VelvetNotesConfig.selectors.content
        );

        const modalTitle = document.querySelector(
            VelvetNotesConfig.selectors.modalTitle
        );


        if (titleInput) {
            titleInput.value = note.title || "";
        }


        if (contentInput) {
            contentInput.value = note.content || "";
        }


        if (modalTitle) {
            modalTitle.textContent = "Edit Note";
        }


        this.showModal();


        if (titleInput) {

            setTimeout(() => titleInput.focus(), 100);
        }
    },


    // --------------------------------------------------------
    // Show modal
    // --------------------------------------------------------

    showModal: function () {

        const modal = document.querySelector(
            VelvetNotesConfig.selectors.modal
        );


        if (!modal) {
            return;
        }


        modal.classList.add("active");

        document.body.classList.add("modal-open");
    },


    // --------------------------------------------------------
    // Close modal
    // --------------------------------------------------------

    closeModal: function () {

        const modal = document.querySelector(
            VelvetNotesConfig.selectors.modal
        );


        if (!modal) {
            return;
        }


        modal.classList.remove("active");

        document.body.classList.remove("modal-open");

        this.editingNoteId = null;
    },


    // --------------------------------------------------------
    // Handle form submission
    // --------------------------------------------------------

    handleFormSubmit: function (event) {

        event.preventDefault();


        const titleInput = document.querySelector(
            VelvetNotesConfig.selectors.title
        );

        const contentInput = document.querySelector(
            VelvetNotesConfig.selectors.content
        );


        if (!titleInput || !contentInput) {
            return;
        }


        const noteData = {

            title: titleInput.value.trim(),

            content: contentInput.value.trim()
        };


        // Prevent empty notes
        if (!noteData.title && !noteData.content) {

            this.showMessage(
                "Write something before saving ♡",
                "warning"
            );

            contentInput.focus();

            return;
        }


        let savedNote;


        // Edit existing note
        if (this.editingNoteId !== null) {

            savedNote = this.updateNote(
                this.editingNoteId,
                noteData
            );
        }

        // Create new note
        else {

            savedNote = this.addNote(noteData);
        }


        // Close only after successfully saving
        if (savedNote) {

            this.closeModal();
        }
    },


    // --------------------------------------------------------
    // Bind events
    // --------------------------------------------------------

    bindEvents: function () {

        // Add note buttons
        document.addEventListener("click", (event) => {

            const addButton = event.target.closest(
                VelvetNotesConfig.selectors.addButton
            );


            if (addButton) {

                this.openModal();
            }
        });


        // Note form submission
        const form = document.querySelector(
            VelvetNotesConfig.selectors.form
        );


        if (form) {

            form.addEventListener("submit", (event) => {

                this.handleFormSubmit(event);
            });
        }


        // Search
        const searchInput = document.querySelector(
            VelvetNotesConfig.selectors.search
        );


        if (searchInput) {

            searchInput.addEventListener("input", (event) => {

                this.setSearch(event.target.value);
            });
        }


        // Note card actions
        const container = document.querySelector(
            VelvetNotesConfig.selectors.container
        );


        if (container) {

            container.addEventListener("click", (event) => {

                const actionElement = event.target.closest(
                    "[data-note-action]"
                );


                if (!actionElement) {
                    return;
                }


                const action = actionElement.dataset.noteAction;

                const noteId = actionElement.dataset.noteId;


                if (action === "edit") {

                    this.openEditModal(noteId);
                }


                if (action === "delete") {

                    this.deleteNote(noteId);
                }


                if (action === "pin") {

                    this.togglePin(noteId);
                }
            });


            // Allow keyboard activation of note card content
            container.addEventListener("keydown", (event) => {

                const editElement = event.target.closest(
                    '[data-note-action="edit"][role="button"]'
                );


                if (!editElement) {
                    return;
                }


                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {

                    event.preventDefault();

                    this.openEditModal(
                        editElement.dataset.noteId
                    );
                }
            });
        }


        // Close modal buttons
        document.addEventListener("click", (event) => {

            const closeButton = event.target.closest(
                '[data-note-action="close"]'
            );


            if (closeButton) {

                this.closeModal();
            }
        });


        // Click outside modal closes it
        const modal = document.querySelector(
            VelvetNotesConfig.selectors.modal
        );


        if (modal) {

            modal.addEventListener("click", (event) => {

                if (event.target === modal) {

                    this.closeModal();
                }
            });
        }


        // Escape key closes modal
        document.addEventListener("keydown", (event) => {

            if (event.key === "Escape") {

                const modal = document.querySelector(
                    VelvetNotesConfig.selectors.modal
                );


                if (modal && modal.classList.contains("active")) {

                    this.closeModal();
                }
            }
        });
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


        return "note-" +
            Date.now() +
            "-" +
            Math.random().toString(36).substring(2, 9);
    },


    // --------------------------------------------------------
    // Get random note color
    // --------------------------------------------------------

    getRandomColor: function () {

        const colors = VelvetNotesConfig.colors;

        const randomIndex = Math.floor(
            Math.random() * colors.length
        );


        return colors[randomIndex];
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
    // Format date
    // --------------------------------------------------------

    formatDate: function (dateString) {

        if (!dateString) {
            return "";
        }


        const date = new Date(dateString);


        if (Number.isNaN(date.getTime())) {
            return "";
        }


        const now = new Date();


        // Today
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
    // Get note by ID
    // --------------------------------------------------------

    getNoteById: function (noteId) {

        return this.notes.find(
            note => String(note.id) === String(noteId)
        ) || null;
    },


    // --------------------------------------------------------
    // Get all notes
    // --------------------------------------------------------

    getNotes: function () {

        return [...this.notes];
    },


    // --------------------------------------------------------
    // Get note count
    // --------------------------------------------------------

    getCount: function () {

        return this.notes.length;
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
// 3. EXPOSE NOTES MANAGER
// ============================================================

window.VelvetNotes = VelvetNotes;


// ============================================================
// 4. INITIALIZE WHEN DOM IS READY
// ============================================================

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        () => VelvetNotes.initialize(),
        { once: true }
    );

} else {

    VelvetNotes.initialize();
}
