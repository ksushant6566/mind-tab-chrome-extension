
// Method: monitorIframeLoad
function monitorIframeLoad() {
    const iframe = document.getElementById('app-iframe');
    const overlay = document.getElementById('overlay');

    if (!iframe || !overlay) {
        return;
    }

    // Initially show the loader and overlay
    overlay.style.display = 'block';

    // Function to hide the overlay
    const hideOverlay = () => {
        overlay.style.display = 'none';
    };

    // Listen for the load event
    iframe.addEventListener('load', hideOverlay);

    iframe.addEventListener('error', hideOverlay);

    // Set a timeout to hide the overlay after 2 seconds
    setTimeout(hideOverlay, 2000);

    // Log the initial loading state
    console.log('loading...');   
}

// Method: initializeIframeMonitoring
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the iframe load monitoring
    monitorIframeLoad();
});