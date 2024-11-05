const { app, BrowserWindow, ipcMain, crashReporter } = require('electron');

const path = require('path');
const $ = require('jquery');


let win;
let splashWindow;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 200,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
  });

  splashWindow.loadURL(`file://${__dirname}/splash.html`);
}

// Create window
function createWindow() {
  win = new BrowserWindow({
    icon: 'assets/icons/compass_logo_256px.ico',
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: false,
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://code.jquery.com"],
        styleSrc: ["'self'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'", "https://fonts.googleapis.com"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: true,
        childSrc: ["'self'"],
        workerSrc: ["'self'"]
      }
    } 
    }
  );

  console.log('Loading index.html');
  win.loadURL(`file://${__dirname}/index.html`);
  win.webContents.on('did-finish-load', () => {
    if (win && !win.isDestroyed()) {
      console.log('Content loaded');
      setTimeout(() => {
      }, 2000); // Adjust timeout as needed
    }
  }); 

  // Close splash window when main window is ready
  win.once('ready-to-show', () => {
    splashWindow.close();
    win.show();
  });

  // Handle window close
  win.on('closed', () => {
    win = null;
  });
}

// Create window when Electron is ready
app.on('ready', () => {
  createSplashWindow();
  setTimeout(() => {
    createWindow();
  }, 1500);
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Activate when icon is clicked in dock (macOS)
app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});