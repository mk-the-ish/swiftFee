const { app, BrowserWindow, protocol } = require('electron');
const path = require('path');
const url = require('url');

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // The custom protocol is secure, but we keep these for the SQLite wrapper.
      nodeIntegration: true, 
      contextIsolation: false,
    },
  });

  if (isDev) {
    console.log('Running in Development Mode (Localhost)');
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    console.log('Running in Production Mode (Custom Protocol)');
    // Serve the app from the 'out' directory using our custom protocol.
    win.loadURL('app://./index.html');
  }
}

if (require('electron-squirrel-startup')) {
  app.quit();
}

app.whenReady().then(() => {
  // Register the custom 'app://' protocol.
  if (!isDev) {
    protocol.handle('app', (request) => {
      const filePath = request.url.slice('app://./'.length);
      const fullPath = path.join(__dirname, 'out', filePath);
      
      // Use url.pathToFileURL to get a file URL and then fetch it.
      return fetch(url.pathToFileURL(fullPath).toString());
    });
  }

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
