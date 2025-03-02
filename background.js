chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.create({ url: "https://mindtab.in" });
});
