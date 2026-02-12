
const WASTED_DOMAINS = ['youtube.com', 'twitter.com', 'x.com', 'reddit.com', 'facebook.com', 'instagram.com', 'netflix.com', 'tiktok.com'];
const PRODUCTIVE_DOMAINS = ['github.com', 'stackoverflow.com', 'docs.google.com', 'notion.so', 'figma.com', 'linkedin.com'];

let currentSession = {
  domain: '',
  startTime: Date.now()
};

// Listen for external messages from the Muriell App
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStatus') {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        const domain = new URL(tabs[0].url).hostname.replace('www.', '');
        sendResponse({ domain, status: 'active' });
      }
    });
    return true; // Keep channel open for async
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    handleUrlChange(changeInfo.url);
  }
});

chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) handleUrlChange(tab.url);
  });
});

function handleUrlChange(url) {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    if (domain !== currentSession.domain) {
      currentSession = { domain, startTime: Date.now() };
      checkDiscipline(domain);
      
      // Notify App via storage sync
      chrome.storage.local.set({ activeDomain: domain });
    }
  } catch (e) {}
}

function checkDiscipline(domain) {
  if (WASTED_DOMAINS.some(d => domain.includes(d))) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '../logo.png',
      title: 'MURIELL DETECTED SLACKING',
      message: `I see you on ${domain}. This session has been logged and Muriell's rage has increased.`,
      priority: 2
    });
    
    chrome.storage.local.set({ lastViolation: { domain, time: Date.now(), type: 'wasted' } });
  }
}

chrome.alarms.create('heartbeat', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'heartbeat') {
    chrome.storage.local.get(['stats'], (result) => {
      const stats = result.stats || { productive: 0, wasted: 0 };
      if (WASTED_DOMAINS.some(d => currentSession.domain.includes(d))) {
        stats.wasted += 1;
      } else if (PRODUCTIVE_DOMAINS.some(d => currentSession.domain.includes(d))) {
        stats.productive += 1;
      }
      chrome.storage.local.set({ stats });
    });
  }
});
