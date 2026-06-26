const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  printHTML: (html) => ipcRenderer.invoke('print-html', html),
  isElectron: true,
});

contextBridge.exposeInMainWorld('api', {
  launchApp: () => ipcRenderer.invoke('splash-launch'),
  getAutoStart: () => ipcRenderer.invoke('get-autostart'),
  setAutoStart: (enabled) => ipcRenderer.invoke('set-autostart', enabled),
  getHealth: () => ipcRenderer.invoke('get-health'),
  getCachedData: (endpoint) => ipcRenderer.invoke('get-cached-data', endpoint),
  syncNow: () => ipcRenderer.invoke('sync-now'),
  minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
  navigate: (callback) => ipcRenderer.on('navigate', (event, route) => callback(route)),
  onHealthUpdate: (callback) => ipcRenderer.on('health-update', (event, data) => callback(data)),
  onSyncComplete: (callback) => ipcRenderer.on('sync-complete', (event, data) => callback(data)),
});
