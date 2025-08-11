const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendFiles: (files) => ipcRenderer.send('files-dropped', files),
  onProgress: (callback) => ipcRenderer.on('progress-update', (event, percent) => callback(percent)),
  selectFiles: () => ipcRenderer.send('select-files')
});
