chrome.runtime.onInstalled.addListener(details => {
  if (details.reason == 'update') {
    chrome.storage.sync.clear();
  }
});

const SYNC_INTERVAL = 60;

class SyncService {
  constructor() {
    this.intervalId = null;
    this.start();
  }

  start() {
    chrome.storage.local.get({
      enableSync: false
    }, items => {
      if (items.enableSync) {
        if (this.intervalId) {
          return;
        }
        this.loadClientApi();
        this.intervalId = window.setInterval(() => {
          this.loadClientApi();
        }, SYNC_INTERVAL * 1000);
      } else if (this.intervalId) {
        window.clearInterval(this.intervalId);
        this.intervalId = null;
      }
    });
  }

  loadClientApi() {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/client.js';
    document.body.appendChild(script);
    document.body.removeChild(script);
  }

  loadDriveApi() {
    window.gapi.client.load('drive', 'v3', () => {
      this.authenticate();
    });
  }

  authenticate() {
    chrome.identity.getAuthToken({
      interactive: false
    }, token => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        return;
      }
      window.gapi.auth.setToken({ access_token: token });
      this.sync();
    });
  }

  sync() {
  }
}

const syncService = new SyncService();

window.gapi_onload = () => {
  syncService.loadDriveApi();
};

chrome.runtime.onMessage.addListener(request => {
  if (request == 'restart') {
    syncService.start();
  }
});
