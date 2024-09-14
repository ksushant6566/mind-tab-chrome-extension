   chrome.runtime.onStartup.addListener(() => {
     chrome.tabs.create({ url: "https://mindtab.in" });
   });

   chrome.runtime.onInstalled.addListener(() => {
     chrome.tabs.create({ url: "https://mindtab.in" });
   });
