const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // En desarrollo, carga desde Vite dev server
  // En producción, carga el build
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handler para abrir diálogo de archivo
ipcMain.handle('dialog:openFile', async (event, filters) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: filters || [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// IPC handler para guardar archivo
ipcMain.handle('dialog:saveFile', async (event, defaultPath) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultPath || 'SKY_con_Provincia.xlsx',
    filters: [{ name: 'Excel Files', extensions: ['xlsx'] }],
  });

  if (!result.canceled) {
    return result.filePath;
  }
  return null;
});

// IPC handler para escribir archivo
ipcMain.handle('file:write', async (event, filePath, buffer) => {
  try {
    fs.writeFileSync(filePath, Buffer.from(buffer));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
