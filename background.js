// Background script for MindTab Chrome Extension
const MINDTAB_API_URL = "http://localhost:3000/api/reading-lists/sync";

// Initialize when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
    // Open the onboarding page
    chrome.tabs.create({ url: "https://mindtab.in" });

    // Set up automatic hourly sync
    setupSyncAlarm();
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "sync_now") {
        // Manually trigger sync
        syncReadingList().then((result) => {
            sendResponse(result);
        });
        return true; // Keep the message channel open for async response
    } else if (message.action === "get_sync_status") {
        // Return last sync info
        chrome.storage.sync.get(["lastSynced", "lastSyncResult"], (result) => {
            sendResponse({
                lastSynced: result.lastSynced,
                lastSyncResult: result.lastSyncResult,
            });
        });
        return true; // Keep the message channel open for async response
    }
});

// Handle alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "reading-list-sync") {
        syncReadingList();
    }
});

// Set up the sync alarm for hourly sync
function setupSyncAlarm() {
    // Clear any existing alarms
    chrome.alarms.clear("reading-list-sync");

    // Create new alarm for hourly sync
    chrome.alarms.create("reading-list-sync", {
        periodInMinutes: 60, // Sync every hour
    });
}

// Function to sync the reading list
async function syncReadingList() {
    try {
        // Updated endpoint URL to match the CURL command
        const endpointUrl = "http://localhost:3000/api/reading-lists/sync";

        // Get reading list data from Chrome - SIMPLIFIED
        const bothSources = await fetchBothDataSources();

        // Send data to the mindtab endpoint
        try {
            // const response = await fetch(endpointUrl, {
            //     method: "POST",
            //     headers: {
            //         "Content-Type": "application/json",
            //         "x-api-key": "1234567890", // Added API key from CURL command
            //     },
            //     body: JSON.stringify({
            //         userId: "user123", // Added userId from CURL example
            //         bothSources,
            //     }),
            // });

            // if (!response.ok) {
            //     const error = `Server responded with ${response.status}: ${response.statusText}`;
            //     await updateSyncStatus(false, error);
            //     return { success: false, error };
            // }

            // Update sync status on success
            await updateSyncStatus(true);
            return { success: true };
        } catch (fetchError) {
            const error = `Network error: ${fetchError.message}`;
            await updateSyncStatus(false, error);
            return { success: false, error };
        }
    } catch (error) {
        const errorMsg = error.message || "Unknown error during sync";
        await updateSyncStatus(false, errorMsg);
        return { success: false, error: errorMsg };
    }
}

// SIMPLIFIED: Just fetch and print both data sources
async function fetchBothDataSources() {
    // 1. Fetch data from Reading List API
    let readingListData = null;
    try {
        if (typeof chrome.readingList !== "undefined") {
            const entries = await chrome.readingList.query({});

            readingListData = {
                items: entries.map((entry) => ({
                    title: entry.title,
                    url: entry.url,
                    hasBeenRead: entry.hasBeenRead,
                    lastUpdateTime: entry.lastUpdateTime,
                    creationTime: entry.creationTime,
                })),
                metadata: {
                    count: entries.length,
                    source: "chrome-reading-list-api",
                },
            };

            // get session token from mindtab cookie
            const cookies = await chrome.cookies.getAll({
                domain: "mindtab.in",
            });

            const sessionToken = cookies.find(
                (cookie) => cookie.name === "__Secure-next-auth.session-token"
            )?.value;

            // send data to mindtab
            const response = await fetch(
                "http://localhost:3000/api/reading-lists/sync",
                {
                    method: "POST",
                    body: JSON.stringify(readingListData),
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": "1234567890",
                        "x-session-token": sessionToken,
                    },
                    credentials: "include",
                }
            );

            if (!response.ok) {
                const error = `Server responded with ${response.status}: ${response.statusText}`;
                await updateSyncStatus(false, error);
                return { success: false, error };
            }
        } else {
            console.log("=== READING LIST API IS NOT AVAILABLE ===");
        }
    } catch (e) {
        console.error("=== ERROR FETCHING READING LIST API ===", e);
    }

    // 2. Fetch data from Bookmarks API
    let bookmarksData = null;
    try {
        const tree = await chrome.bookmarks.getTree();

        // Just extract all bookmarks without any filtering
        const allBookmarks = [];
        function collectAllBookmarks(nodes) {
            for (const node of nodes) {
                if (node.url) {
                    // Safe date conversion with fallback
                    let dateAdded = null;
                    try {
                        if (node.dateAdded) {
                            dateAdded = new Date(node.dateAdded).toISOString();
                        }
                    } catch (dateError) {
                        console.log(
                            "Date conversion error for dateAdded:",
                            node.dateAdded
                        );
                        dateAdded = null;
                    }

                    allBookmarks.push({
                        id: node.id,
                        title: node.title || "",
                        url: node.url || "",
                        // Keep original timestamp for debugging
                        rawDateAdded: node.dateAdded,
                        // Only include processed date if valid
                        ...(dateAdded && { dateAdded }),
                    });
                }
                if (node.children) {
                    collectAllBookmarks(node.children);
                }
            }
        }

        collectAllBookmarks(tree);
        bookmarksData = {
            items: allBookmarks,
            count: allBookmarks.length,
            source: "chrome-bookmarks-api",
        };

        console.log("=== COLLECTED ALL BOOKMARKS ===");
        console.log(bookmarksData);
    } catch (e) {
        console.error("=== ERROR FETCHING BOOKMARKS API ===", e);
    }

    // Return both data sources for comparison
    return {
        readingList: readingListData,
        bookmarks: bookmarksData,
        timestamp: new Date().toISOString(),
    };
}

// Update the sync status in storage
async function updateSyncStatus(success, errorMessage = null) {
    await chrome.storage.sync.set({
        lastSynced: new Date().toISOString(),
        lastSyncResult: {
            success,
            errorMessage,
            timestamp: new Date().toISOString(),
        },
    });
}
