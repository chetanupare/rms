const { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage, globalShortcut } = require('electron');
const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');

let mainWindow;
let splashWindow;
let tray;
let dbStatus = false;
let serverStatus = false;
let syncInterval;

const isDev = !app.isPackaged;
const API_BASE = 'https://rms-api-psi.vercel.app';
const SYNC_INTERVAL_MS = 5 * 60 * 1000;
const HEALTH_CHECK_MS = 30 * 1000;
const USER_DATA_PATH = app.getPath('userData');
const CACHE_PATH = path.join(USER_DATA_PATH, 'cache');

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_PATH)) fs.mkdirSync(CACHE_PATH, { recursive: true });
}

function getLogoPath() {
  if (isDev) return path.join(__dirname, '..', 'public', 'logo.png');
  return path.join(__dirname, '..', 'dist', 'logo.png');
}

function getSplashHtmlPath() {
  return path.join(__dirname, 'splash.html');
}

// ── Health Check ──
function checkHealth() {
  return new Promise((resolve) => {
    const req = https.get(`${API_BASE}/api/health`, { timeout: 8000 }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          serverStatus = true;
          dbStatus = !!json.db;
        } catch {
          serverStatus = false;
          dbStatus = false;
        }
        resolve({ server: serverStatus, db: dbStatus });
      });
    });
    req.on('error', () => {
      serverStatus = false;
      dbStatus = false;
      resolve({ server: false, db: false });
    });
    req.on('timeout', () => { req.destroy(); resolve({ server: false, db: false }); });
  });
}

// ── Auto Sync ──
async function syncData() {
  if (!dbStatus) return;
  ensureCacheDir();
  const endpoints = ['customers', 'job-cards', 'repairs', 'billing', 'brands', 'device-models', 'dashboard'];
  for (const ep of endpoints) {
    try {
      const data = await new Promise((resolve, reject) => {
        const req = https.get(`${API_BASE}/api/${ep}`, { timeout: 15000 }, (res) => {
          let body = '';
          res.on('data', (c) => { body += c; });
          res.on('end', () => resolve(body));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
      });
      fs.writeFileSync(path.join(CACHE_PATH, `${ep.replace('/', '_')}.json`), data);
    } catch {
      // skip failed sync
    }
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('sync-complete', { timestamp: Date.now() });
  }
}

function getCachedData(endpoint) {
  const file = path.join(CACHE_PATH, `${endpoint.replace('/', '_')}.json`);
  if (fs.existsSync(file)) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
  }
  return null;
}

// ── System Tray ──
function createTray() {
  const iconPath = getLogoPath();
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  } catch {
    trayIcon = nativeImage.createEmpty();
  }
  tray = new Tray(trayIcon);
  tray.setToolTip('Sai Laptop RMS');
  updateTrayMenu();

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function updateTrayMenu() {
  if (!tray || tray.isDestroyed()) return;
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Sai Laptop RMS', enabled: false },
    { type: 'separator' },
    { label: `Server: ${serverStatus ? '● Active' : '○ Inactive'}`, enabled: false },
    { label: `Database: ${dbStatus ? '● Active' : '○ Inactive'}`, enabled: false },
    { type: 'separator' },
    {
      label: 'New Service Job', click: () => {
        showMainWindow();
        mainWindow.webContents.send('navigate', '/repairs');
      }
    },
    {
      label: 'Daily Registrar', click: () => {
        showMainWindow();
        mainWindow.webContents.send('navigate', '/register');
      }
    },
    {
      label: 'Dashboard', click: () => {
        showMainWindow();
        mainWindow.webContents.send('navigate', '/dashboard');
      }
    },
    { type: 'separator' },
    {
      label: 'Auto Start', type: 'checkbox', checked: app.getLoginItemSettings().openAtLogin,
      click: (menuItem) => {
        app.setLoginItemSettings({ openAtLogin: menuItem.checked });
      }
    },
    { type: 'separator' },
    {
      label: 'Sync Now', click: async () => {
        await syncData();
        updateTrayMenu();
      }
    },
    { type: 'separator' },
    { label: 'Show App', click: () => showMainWindow() },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } },
  ]);
  tray.setContextMenu(contextMenu);
}

function showMainWindow() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

// ── Splash Screen ──
function createSplash() {
  splashWindow = new BrowserWindow({
    width: 460, height: 520, frame: false, resizable: false,
    transparent: false, backgroundColor: '#0a0b10',
    center: true, skipTaskbar: true, alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false, contextIsolation: true,
    },
  });
  splashWindow.loadFile(getSplashHtmlPath());
  splashWindow.on('closed', () => { splashWindow = null; });
}

// ── Main Window ──
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1366, height: 900, minWidth: 1024, minHeight: 700,
    title: 'Sai Laptop RMS', icon: getLogoPath(), show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false, contextIsolation: true,
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
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
    mainWindow.show();
    mainWindow.focus();
    startBackgroundTasks();
  });

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── Background Tasks ──
function startBackgroundTasks() {
  if (syncInterval) clearInterval(syncInterval);
  checkHealth().then(() => updateTrayMenu());
  syncData();
  setInterval(async () => {
    await checkHealth();
    updateTrayMenu();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('health-update', { server: serverStatus, db: dbStatus });
    }
  }, HEALTH_CHECK_MS);
  syncInterval = setInterval(syncData, SYNC_INTERVAL_MS);
}

// ── IPC Handlers ──
ipcMain.handle('splash-launch', async () => { createMainWindow(); });

ipcMain.handle('print-html', async (event, htmlContent) => {
  const win = new BrowserWindow({
    width: 800, height: 600, show: false, webPreferences: { offscreen: true },
  });
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
  await new Promise((r) => setTimeout(r, 500));
  win.webContents.print({ silent: false, printBackground: true }, () => win.close());
  return true;
});

ipcMain.handle('print-native', async (event) => {
  if (mainWindow) {
    mainWindow.webContents.print({
      silent: false,
      printBackground: true,
      margins: { marginType: 'none' },
      scaleFactor: 100
    });
  }
  return true;
});

ipcMain.handle('get-autostart', () => app.getLoginItemSettings().openAtLogin);
ipcMain.handle('set-autostart', (event, enabled) => { app.setLoginItemSettings({ openAtLogin: enabled }); });
ipcMain.handle('get-health', () => ({ server: serverStatus, db: dbStatus }));
ipcMain.handle('get-cached-data', (event, endpoint) => getCachedData(endpoint));
ipcMain.handle('sync-now', async () => { await syncData(); return { server: serverStatus, db: dbStatus }; });
ipcMain.handle('minimize-to-tray', () => { if (mainWindow) mainWindow.hide(); });

// ── App Lifecycle ──
app.whenReady().then(() => {
  createTray();
  createSplash();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createMainWindow();
});

app.on('before-quit', () => {
  app.isQuitting = true;
  if (syncInterval) clearInterval(syncInterval);
  globalShortcut.unregisterAll();
});
