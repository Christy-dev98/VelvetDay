
/* =========================================================
   VELVET DAY - GLOBAL SEARCH
   ---------------------------------------------------------
   Searches across:
   - Tasks
   - Notes
   - Checklists
   - Brain Dump

   This file is designed to work with the existing modules
   without directly modifying their stored data.
   ========================================================= */

window.VelvetSearch = (() => {
    "use strict";

    // -----------------------------------------------------
    // Configuration
    // -----------------------------------------------------

    const config = {
        searchInputSelector: "#globalSearch",
        searchResultsSelector: "#searchResults",
        searchOverlaySelector: "#searchOverlay",
        minimumCharacters: 1
    };

    // -----------------------------------------------------
    // Internal State
    // -----------------------------------------------------

    let initialized = false;
    let currentQuery = "";

    // -----------------------------------------------------
    // Utility: Safely get an element
    // -----------------------------------------------------

    function getElement(selector) {
        return document.querySelector(selector);
    }

    // -----------------------------------------------------
    // Utility: Safely convert an object into searchable text
    // -----------------------------------------------------

    function getSearchText(item) {
        if (!item) return "";

        return Object.values(item)
            .filter(value => value !== null && value !== undefined)
            .map(value => {
                if (typeof value === "object") {
                    return JSON.stringify(value);
                }

                return String(value);
            })
            .join(" ")
            .toLowerCase();
    }

    // -----------------------------------------------------
    // Utility: Get a readable title from an object
    // -----------------------------------------------------

    function getTitle(item, fallback = "Untitled") {
        return (
            item?.title ||
            item?.name ||
            item?.text ||
            item?.content ||
            fallback
        );
    }

    // -----------------------------------------------------
    // Utility: Get a readable description
    // -----------------------------------------------------

    function getDescription(item) {
        return (
            item?.description ||
            item?.content ||
            item?.body ||
            item?.text ||
            ""
        );
    }

    // -----------------------------------------------------
    // Utility: Safely get module data
    // -----------------------------------------------------

    function getModuleItems(module, getterNames) {
        if (!module) return [];

        for (const getterName of getterNames) {
            if (typeof module[getterName] === "function") {
                try {
                    const result = module[getterName]();

                    if (Array.isArray(result)) {
                        return result;
                    }
                    if (result && Array.isArray(result.items)) {
                        return result.items;
                    }
                } catch (error) {
                    console.warn(
                        `VelvetSearch: Could not read ${getterName}`,
                        error
                    );
                }
            }
        }

        return [];
    }

    // -----------------------------------------------------
    // Collect Tasks
    // -----------------------------------------------------

    function getTasks() {
        const tasks = getModuleItems(
            window.VelvetTasks,
            [
                "getTasks",
                "getAllTasks",
                "getFilteredTasks"
            ]
        );

        return tasks.map(task => ({
            ...task,
            _searchType: "task"
        }));
    }

    // -----------------------------------------------------
    // Collect Notes
    // -----------------------------------------------------

    function getNotes() {
        const notes = getModuleItems(
            window.VelvetNotes,
            [
                "getNotes",
                "getAllNotes"
            ]
        );

        return notes.map(note => ({
            ...note,
            _searchType: "note"
        }));
    }

    // -----------------------------------------------------
    // Collect Checklists
    // -----------------------------------------------------

    function getChecklists() {
        const checklists = getModuleItems(
            window.VelvetChecklist,
            [
                "getChecklists",
                "getAllChecklists",
                "getItems",
                "getTemplates"
            ]
        );

        return checklists.map(checklist => ({
            ...checklist,
            _searchType: "checklist"
        }));
    }

    // -----------------------------------------------------
    // Collect Brain Dump Items
    // -----------------------------------------------------

    function getBrainDumpItems() {
        const brainDumpItems = getModuleItems(
            window.VelvetBrainDump,
            [
                "getItems",
                "getEntries",
                "getAllItems",
                "getBrainDumpItems"
            ]
        );

        return brainDumpItems.map(item => ({
            ...item,
            _searchType: "brain"
        }));
    }

    // -----------------------------------------------------
    // Get All Searchable Items
    // -----------------------------------------------------

    function getAllSearchableItems() {
        return [
            ...getTasks(),
            ...getNotes(),
            ...getChecklists(),
            ...getBrainDumpItems()
        ];
    }

    // -----------------------------------------------------
    // Search
    // -----------------------------------------------------

    function search(query) {
        const normalizedQuery = String(query || "")
            .trim()
            .toLowerCase();

        if (normalizedQuery.length < config.minimumCharacters) {
            return [];
        }

        currentQuery = normalizedQuery;

        const allItems = getAllSearchableItems();

        return allItems
            .filter(item => getSearchText(item).includes(normalizedQuery))
            .map(item => ({
                id: item.id,
                type: item._searchType,
                title: getTitle(item),
                description: getDescription(item),
                item
            }));
    }

    // -----------------------------------------------------
    // Search Result Icons
    // -----------------------------------------------------

    function getResultIcon(type) {
        const icons = {
            task: "✓",
            note: "📝",
            checklist: "☑",
            brain: "💭"
        };

        return icons[type] || "🔎";
    }

    // -----------------------------------------------------
    // Search Result Labels
    // -----------------------------------------------------

    function getResultLabel(type) {
        const labels = {
            task: "Task",
            note: "Note",
            checklist: "Checklist",
            brain: "Brain Dump"
        };

        return labels[type] || "Result";
    }

    // -----------------------------------------------------
    // Render Search Results
    // -----------------------------------------------------

    function renderResults(results) {
        const container = getElement(config.searchResultsSelector);

        if (!container) return;

        if (!results.length) {
            container.innerHTML = `
                <div class="search-empty-state">
                    <div class="search-empty-icon">🔎</div>
                    <p>No matching results found.</p>
                </div>
            `;

            container.classList.remove("hidden");
            return;
        }

        container.innerHTML = results.map(result => `
            <button
                type="button"
                class="search-result-item"
                data-search-type="${VelvetUtils.escapeHTML(result.type)}"
                data-search-id="${VelvetUtils.escapeHTML(String(result.id ?? ""))}"
            >
                <span class="search-result-icon">
                    ${getResultIcon(result.type)}
                </span>

                <span class="search-result-content">
                    <span class="search-result-title">
                        ${VelvetUtils.escapeHTML(String(result.title))}
                    </span>

                    <span class="search-result-description">
                        ${VelvetUtils.escapeHTML(String(result.description).slice(0, 100))}
                    </span>
                </span>

                <span class="search-result-type">
                    ${getResultLabel(result.type)}
                </span>
            </button>
        `).join("");

        container.classList.remove("hidden");
    }

    // -----------------------------------------------------
    // Open Search Results
    // -----------------------------------------------------

    function openResult(type, id) {
        const pageMap = {
            task: "tasks",
            note: "notes",
            checklist: "checklist",
            brain: "brain"
        };

        const targetPage = pageMap[type];

        if (!targetPage) return;

        if (window.VelvetDay?.navigate) {
            window.VelvetDay.navigate(targetPage);
        } else if (window.VelvetNavigation?.navigate) {
            window.VelvetNavigation.navigate(targetPage);
        }

        // Dispatch an event so the relevant module can focus
        // or open the selected item later.
        document.dispatchEvent(
            new CustomEvent("velvet:search-result-selected", {
                detail: {
                    type,
                    id
                }
            })
        );

        closeSearch();
    }

    // -----------------------------------------------------
    // Close Search
    // -----------------------------------------------------

    function closeSearch() {
        const results = getElement(config.searchResultsSelector);
        const overlay = getElement(config.searchOverlaySelector);
        const input = getElement(config.searchInputSelector);

        if (results) {
            results.classList.add("hidden");
        }

        if (overlay) {
            overlay.classList.remove("open");
        }

        if (input) {
            input.blur();
        }
    }

    // -----------------------------------------------------
    // Open Search
    // -----------------------------------------------------

    function openSearch() {
        const overlay = getElement(config.searchOverlaySelector);
        const input = getElement(config.searchInputSelector);

        if (overlay) {
            overlay.classList.add("open");
        }

        if (input) {
            input.focus();
        }
    }

    // -----------------------------------------------------
    // Handle Search Input
    // -----------------------------------------------------

    function handleSearchInput(event) {
        const query = event.target.value.trim();

        if (!query) {
            const results = getElement(config.searchResultsSelector);

            if (results) {
                results.classList.add("hidden");
            }

            return;
        }

        const results = search(query);

        renderResults(results);
    }

    // -----------------------------------------------------
    // Bind Events
    // -----------------------------------------------------

    function bindEvents() {
        const input = getElement(config.searchInputSelector);

        if (input) {
            input.addEventListener("input", handleSearchInput);
        }

        const results = getElement(config.searchResultsSelector);

        if (results) {
            results.addEventListener("click", event => {
                const resultButton = event.target.closest(
                    ".search-result-item"
                );

                if (!resultButton) return;

                openResult(
                    resultButton.dataset.searchType,
                    resultButton.dataset.searchId
                );
            });
        }

        document.addEventListener("keydown", event => {
            // Ctrl + K or Cmd + K opens global search.
            if ((event.ctrlKey || event.metaKey) && event.key === "k") {
                event.preventDefault();
                openSearch();
            }

            // Escape closes search.
            if (event.key === "Escape") {
                closeSearch();
            }
        });
    }

    // -----------------------------------------------------
    // Initialize
    // -----------------------------------------------------

    function initialize() {
        if (initialized) return;

        bindEvents();

        initialized = true;

        console.log("VelvetSearch initialized.");
    }

    // -----------------------------------------------------
    // Public API
    // -----------------------------------------------------

    return {
        initialize,
        search,
        getAllSearchableItems,
        openSearch,
        closeSearch,
        openResult,
        getCurrentQuery: () => currentQuery
    };
})();
