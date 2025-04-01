// Popup functionality
document.addEventListener("DOMContentLoaded", () => {
    const syncNowButton = document.getElementById("sync-now");
    const lastSyncElement = document.getElementById("last-sync");
    const syncResultElement = document.getElementById("sync-result");

    // Add click event listener for sync button
    syncNowButton.addEventListener("click", syncNow);

    // Load and display sync status when popup opens
    loadSyncStatus();

    // Function to trigger sync
    function syncNow() {
        // Disable the button while syncing
        syncNowButton.disabled = true;
        syncNowButton.textContent = "Syncing...";
        lastSyncElement.textContent = "Sync in progress...";
        lastSyncElement.className = "syncing";
        syncResultElement.textContent = "";

        // Send message to background script to start sync
        chrome.runtime.sendMessage({ action: "sync_now" }, (response) => {
            syncNowButton.disabled = false;
            syncNowButton.textContent = "Sync Now";

            // Update status based on result
            if (response && response.success) {
                lastSyncElement.textContent = "Last synced: Just now";
                syncResultElement.textContent = "Sync completed successfully!";
                syncResultElement.className = "success";
            } else {
                const errorMsg = response?.error || "Unknown error occurred";
                lastSyncElement.textContent = "Last sync attempt: Just now";
                syncResultElement.textContent = `Error: ${errorMsg}`;
                syncResultElement.className = "error";
            }

            // Refresh the sync status
            setTimeout(loadSyncStatus, 1000);
        });
    }

    // Function to load and display sync status
    function loadSyncStatus() {
        chrome.runtime.sendMessage(
            { action: "get_sync_status" },
            (response) => {
                if (response && response.lastSynced) {
                    // Format the date
                    const lastSyncDate = new Date(response.lastSynced);
                    const formattedDate = formatDate(lastSyncDate);

                    lastSyncElement.textContent = `Last synced: ${formattedDate}`;

                    // Show result if available
                    if (response.lastSyncResult) {
                        if (response.lastSyncResult.success) {
                            syncResultElement.textContent =
                                "Sync completed successfully!";
                            syncResultElement.className = "success";
                        } else {
                            syncResultElement.textContent = `Error: ${
                                response.lastSyncResult.errorMessage ||
                                "Unknown error"
                            }`;
                            syncResultElement.className = "error";
                        }
                    }
                } else {
                    lastSyncElement.textContent = "Not synced yet";
                    syncResultElement.textContent = "";
                }
            }
        );
    }

    // Helper function to format date
    function formatDate(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) {
            return "Just now";
        } else if (diffMin < 60) {
            return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
        } else if (diffHour < 24) {
            return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
        } else if (diffDay < 7) {
            return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
});
