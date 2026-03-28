const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('lifelink', {
  platform: process.platform,
  version: '1.0.0'
});
