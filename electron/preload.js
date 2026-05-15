const { contextBridge, ipcRenderer } = require('electron');

// Exponer API segura al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: (filters) => ipcRenderer.invoke('dialog:openFile', filters),
  saveFileDialog: (defaultPath) => ipcRenderer.invoke('dialog:saveFile', defaultPath),
  writeFile: (filePath, buffer) => ipcRenderer.invoke('file:write', filePath, buffer),
});
