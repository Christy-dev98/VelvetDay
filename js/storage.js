
/* ==========================================================
   VELVET DAY - LOCAL STORAGE
   File: js/storage.js

   This file handles saving and loading app data using
   the browser's LocalStorage.

   No database or backend is required.

   Data stored:
   - Tasks
   - Brain dumps
   - Notes
   - Checklists
   - Recurring tasks
   - Reminders
   - Calendar events
   - User settings
   ========================================================== */

(function () {
    "use strict";

    // ----------------------------------------------------------
    // 1. STORAGE CONFIGURATION
    // ----------------------------------------------------------

    const STORAGE_KEY = "velvetDayData";
    const STORAGE_VERSION = 1;

    // ----------------------------------------------------------
    // 2. DEFAULT DATA
    // ----------------------------------------------------------
    // This is the structure used when the app is opened for
    // the first time or when no saved data exists.
    // ----------------------------------------------------------

    const defaultData = {
        version: STORAGE_VERSION,

        // Main tasks
        tasks: [],

        // Quick thoughts, ideas, and brain dumps
        brainDump: [],

        // Personal notes
        notes: [],

        // Checklists and checklist templates
        checklists: [],

        // Recurring task definitions
        recurringTasks: [],

        // Reminders
        reminders: [],

        // Calendar events
        calendarEvents: [],

        // App preferences
        settings: {
            theme: "dark",
            notificationsEnabled: false,
            startWeekOn: "monday",
            completedTasksVisible: true
        },

        // Track daily activity for progress charts
        activity: {}
    };

    // ----------------------------------------------------------
    // 3. MEMORY FALLBACK
    // ----------------------------------------------------------
    // If browser storage is unavailable, the app can still work
    // temporarily using memory.
    //
    // Note: memory data will disappear when the page is refreshed.
    // ----------------------------------------------------------

    let memoryData = null;

    // ----------------------------------------------------------
    // 4. HELPER - CREATE A SAFE COPY
    // ----------------------------------------------------------
    // Prevents accidental changes to the original object when
    // returning data to another script.
    // ----------------------------------------------------------

    function cloneData(data) {
        return JSON.parse(JSON.stringify(data));
    }

    // ----------------------------------------------------------
    // 5. HELPER - CREATE DEFAULT DATA
    // ----------------------------------------------------------

    function createDefaultData() {
        return cloneData(defaultData);
    }

    // ----------------------------------------------------------
    // 6. HELPER - CHECK STORAGE AVAILABILITY
    // ----------------------------------------------------------

    function isStorageAvailable() {
        try {
            const testKey = "__velvet_day_storage_test__";

            localStorage.setItem(testKey, "test");
            localStorage.removeItem(testKey);

            return true;
        } catch (error) {
            console.warn("Velvet Day: LocalStorage is unavailable.", error);
            return false;
        }
    }

    // ----------------------------------------------------------
    // 7. LOAD DATA
    // ----------------------------------------------------------
    // Reads the saved data from LocalStorage.
    //
    // If no saved data exists:
    // - Creates default data
    // - Saves it
    // - Returns it
    //
    // If saved data exists:
    // - Parses it
    // - Adds any newly introduced default properties
    //   that might be missing from an older saved version
    // ----------------------------------------------------------

    function loadData() {
        try {
            if (!isStorageAvailable()) {
                if (!memoryData) {
                    memoryData = createDefaultData();
                }

                return cloneData(memoryData);
            }

            const savedData = localStorage.getItem(STORAGE_KEY);

            // First-time app installation
            if (!savedData) {
                const freshData = createDefaultData();

                saveData(freshData);

                return freshData;
            }

            // Convert saved JSON text back into a JavaScript object
            const parsedData = JSON.parse(savedData);

            // Ensure the stored data is an object
            if (
                !parsedData ||
                typeof parsedData !== "object" ||
                Array.isArray(parsedData)
            ) {
                console.warn("Velvet Day: Invalid saved data. Using defaults.");

                const freshData = createDefaultData();
                saveData(freshData);

                return freshData;
            }

            // Merge default structure with saved structure.
            // This helps when new app features are added later.
            const mergedData = {
                ...createDefaultData(),
                ...parsedData,

                settings: {
                    ...defaultData.settings,
                    ...(parsedData.settings || {})
                }
            };

            // Make sure collection properties are arrays
            const collectionKeys = [
                "tasks",
                "brainDump",
                "notes",
                "checklists",
                "recurringTasks",
                "reminders",
                "calendarEvents"
            ];

            collectionKeys.forEach(function (key) {
                if (!Array.isArray(mergedData[key])) {
                    mergedData[key] = [];
                }
            });

            // Ensure activity is an object
            if (
                !mergedData.activity ||
                typeof mergedData.activity !== "object" ||
                Array.isArray(mergedData.activity)
            ) {
                mergedData.activity = {};
            }

            // Update the version
            mergedData.version = STORAGE_VERSION;

            // Save the upgraded structure
            saveData(mergedData);

            return cloneData(mergedData);

        } catch (error) {
            console.error("Velvet Day: Failed to load data.", error);

            // Do not automatically overwrite potentially recoverable
            // saved data if JSON parsing fails.
            if (!memoryData) {
                memoryData = createDefaultData();
            }

            return cloneData(memoryData);
        }
    }

    // ----------------------------------------------------------
    // 8. SAVE DATA
    // ----------------------------------------------------------
    // Saves the complete app data object.
    //
    // Example:
    // VelvetStorage.saveData(data);
    // ----------------------------------------------------------

    function saveData(data) {
        if (!data || typeof data !== "object" || Array.isArray(data)) {
            console.error("Velvet Day: Invalid data supplied to saveData().");
            return false;
        }

        try {
            data.version = STORAGE_VERSION;

            const serializedData = JSON.stringify(data);

            if (!isStorageAvailable()) {
                memoryData = cloneData(data);
                return false;
            }

            localStorage.setItem(STORAGE_KEY, serializedData);

            // Keep an in-memory copy as well
            memoryData = cloneData(data);

            return true;

        } catch (error) {
            console.error("Velvet Day: Failed to save data.", error);

            // Fall back to memory storage
            memoryData = cloneData(data);

            return false;
        }
    }

    // ----------------------------------------------------------
    // 9. UPDATE DATA
    // ----------------------------------------------------------
    // Updates specific properties without manually rebuilding
    // the entire data object.
    //
    // Example:
    // VelvetStorage.updateData({
    //     tasks: updatedTasks
    // });
    // ----------------------------------------------------------

    function updateData(updates) {
        if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
            console.error("Velvet Day: Invalid update object.");
            return false;
        }

        const currentData = loadData();

        const updatedData = {
            ...currentData,
            ...updates,

            settings: {
                ...currentData.settings,
                ...(updates.settings || {})
            }
        };

        return saveData(updatedData);
    }

    // ----------------------------------------------------------
    // 10. GET A SPECIFIC DATA PROPERTY
    // ----------------------------------------------------------
    // Example:
    // const tasks = VelvetStorage.get("tasks");
    // ----------------------------------------------------------

    function get(key) {
        const data = loadData();

        if (!Object.prototype.hasOwnProperty.call(data, key)) {
            return undefined;
        }

        return cloneData(data[key]);
    }

    // ----------------------------------------------------------
    // 11. SET A SPECIFIC DATA PROPERTY
    // ----------------------------------------------------------
    // Example:
    // VelvetStorage.set("notes", updatedNotes);
    // ----------------------------------------------------------

    function set(key, value) {
        const currentData = loadData();

        currentData[key] = value;

        return saveData(currentData);
    }

    // ----------------------------------------------------------
    // 12. RESET APP DATA
    // ----------------------------------------------------------
    // Deletes all saved Velvet Day data and restores defaults.
    //
    // IMPORTANT:
    // This function should only be called when the user
    // intentionally chooses Reset App Data.
    // ----------------------------------------------------------

    function resetData() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.warn("Velvet Day: Could not clear local storage.", error);
        }

        memoryData = createDefaultData();

        saveData(memoryData);

        return cloneData(memoryData);
    }

    // ----------------------------------------------------------
    // 13. EXPORT DATA
    // ----------------------------------------------------------
    // Returns all app data as JSON.
    // Later, this can be used to implement a backup feature.
    // ----------------------------------------------------------

    function exportData() {
        const data = loadData();

        return JSON.stringify(data, null, 2);
    }

    // ----------------------------------------------------------
    // 14. IMPORT DATA
    // ----------------------------------------------------------
    // Allows backup data to be restored later.
    //
    // Returns true if the data is valid and saved successfully.
    // ----------------------------------------------------------

    function importData(jsonString) {
        try {
            const importedData = JSON.parse(jsonString);

            if (
                !importedData ||
                typeof importedData !== "object" ||
                Array.isArray(importedData)
            ) {
                console.error("Velvet Day: Invalid import format.");
                return false;
            }

            // Merge imported data with defaults
            const restoredData = {
                ...createDefaultData(),
                ...importedData,

                settings: {
                    ...defaultData.settings,
                    ...(importedData.settings || {})
                }
            };

            // Validate collection properties
            const collectionKeys = [
                "tasks",
                "brainDump",
                "notes",
                "checklists",
                "recurringTasks",
                "reminders",
                "calendarEvents"
            ];

            collectionKeys.forEach(function (key) {
                if (!Array.isArray(restoredData[key])) {
                    restoredData[key] = [];
                }
            });

            return saveData(restoredData);

        } catch (error) {
            console.error("Velvet Day: Import failed.", error);
            return false;
        }
    }

    // ----------------------------------------------------------
    // 15. PUBLIC API
    // ----------------------------------------------------------
    // Other JavaScript files can access these functions using:
    //
    // VelvetStorage.loadData()
    // VelvetStorage.saveData(data)
    // VelvetStorage.get("tasks")
    // VelvetStorage.set("tasks", tasks)
    // VelvetStorage.updateData({ notes: notes })
    // ----------------------------------------------------------

    window.VelvetStorage = {
        loadData,
        saveData,
        updateData,
        get,
        set,
        resetData,
        exportData,
        importData
    };

    // ----------------------------------------------------------
    // 16. INITIALIZE STORAGE
    // ----------------------------------------------------------
    // Load or create the data structure when the script is loaded.
    // ----------------------------------------------------------

    loadData();

    console.log("💜 Velvet Day storage initialized.");

})();
