const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');

let mainWindow;
let splashWindow;

const isDev = !app.isPackaged;

function getLogoPath() {
  if (isDev) return path.join(__dirname, '..', 'public', 'logo.png');
  return path.join(__dirname, '..', 'dist', 'logo.png');
}

function getSplashHtmlPath() {
  return path.join(__dirname, 'splash.html');
}

function createSplash() {
  splashWindow = new BrowserWindow({
    width: 460,
    height: 520,
    frame: false,
    resizable: false,
    transparent: false,
    backgroundColor: '#0a0b10',
    center: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splashWindow.loadFile(getSplashHtmlPath());
  splashWindow.on('closed', () => { splashWindow = null; });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Sai Laptop RMS',
    icon: getLogoPath(),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://wa.me') || url.startsWith('http')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
    }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

ipcMain.handle('splash-launch', async () => {
  createMainWindow();
});

ipcMain.handle('print-html', async (event, htmlContent) => {
  const win = new BrowserWindow({
    width: 800, height: 600, show: false, webPreferences: { offscreen: true },
  });
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
  await new Promise((r) => setTimeout(r, 500));
  win.webContents.print({ silent: false, printBackground: true }, () => win.close());
  return true;
});

app.whenReady().then(() => {
  createSplash();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createMainWindow();
});
