
// Method: monitorIframeLoad
function monitorIframeLoad() {
    const iframe = document.getElementById('app-iframe');
    const overlay = document.getElementById('overlay');

    if (!iframe) {
        return;
    }

    if (!overlay) {
        return;
    }

    // Initially show the loader and overlay
    overlay.style.display = 'block';

    // Listen for the load event
    iframe.addEventListener('load', () => {
        // Hide the loader and overlay
        overlay.style.display = 'none';
        // Perform additional actions here if needed
    });

    // Listen for the error event (optional)
    iframe.addEventListener('error', () => {
        // Optionally hide the loader or display an error message
        overlay.style.display = 'none';
    });

    // Log the initial loading state
    console.log('loading...');
}


// Method: initializeIframeMonitoring
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the iframe load monitoring
    monitorIframeLoad();
});