const { app, BrowserWindow } = require('electron');
const path = require('path');

// 1. Change how we determine dev mode. 
// We default to FALSE (Production/File loading) unless explicitly set to 'development'.
// This allows "electron ." to load your built files by default.
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true, 
      contextIsolation: false, 
      // Security warning: In a real production app, you should enable contextIsolation
      // and use a preload script to expose specific APIs.
    },
  });

  if (isDev) {
    console.log('Running in Development Mode (Localhost)');
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    console.log('Running in Production Mode (Static Files)');
    // Load the index.html from the 'out' directory created by 'next export'
    win.loadFile(path.join(__dirname, 'out/index.html'));
  }
}

if (require('electron-squirrel-startup')) {
  app.quit();
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