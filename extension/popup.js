
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['stats'], (result) => {
    if (result.stats) {
      document.getElementById('prod-time').textContent = result.stats.productive + 'm';
      document.getElementById('waste-time').textContent = result.stats.wasted + 'm';
    }
  });

  document.getElementById('open-app').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://muriell.app' }); // Replace with actual URL
  });
});
