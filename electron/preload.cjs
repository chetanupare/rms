const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  printHTML: (html) => ipcRenderer.invoke('print-html', html),
  isElectron: true,
});

contextBridge.exposeInMainWorld('api', {
  launchApp: () => ipcRenderer.invoke('splash-launch'),
});
