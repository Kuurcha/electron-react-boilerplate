/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { NodeWinPcap } from 'node-win-pcap';
import fs from 'fs';
import os from 'os';
import { getNetworkInterfaces } from './networkCapturer/functions';
import { CaptureSettings } from '../bus/types';
import { NetworkInterfaceInfo } from './networkCapturer/type';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
let activePcap: NodeWinPcap | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Logs messages with a timestamp and SNIFFER INFO tag.
 */
function snifferLog(...messages: any[]) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] SNIFFER INFO:`, ...messages);
}

function stopPacketSniffer() {
  const logPath = path.join(process.cwd(), 'sniffer_log.txt');
  const writeLog = (...messages: any[]) => {
    const line = messages.map(String).join(' ') + '\n';
    fs.appendFileSync(logPath, line);
  };

  if (activePcap) {
    try {
      activePcap.stop();
      writeLog('Packet sniffing manually stopped.');
    } catch (e: any) {
      writeLog(`Error while stopping sniffer: ${e.message}`);
    } finally {
      activePcap = null;
    }
  } else {
    writeLog('No active sniffer to stop.');
  }
}

app.on('before-quit', () => {
  console.log('App is quitting — stopping sniffer if running...');
  stopPacketSniffer();
});

/**
 * Starts a packet sniffer and logs only the moments of packet arrivals.
 * @param ipAddress - IP of the interface to capture on
 * @param durationSecStr - Duration in seconds (as string)
 */
function startPacketSniffer(ipAddress: string, durationSecStr: string) {
  const durationSec = parseInt(durationSecStr, 10);

  if (Number.isNaN(durationSec) || durationSec <= 0) {
    console.error('Invalid duration:', durationSecStr);
    return;
  }

  const logPath = path.join(process.cwd(), 'sniffer_log.txt');

  // Clear existing log
  fs.writeFileSync(logPath, '');

  const startTime = process.hrtime.bigint(); // high-res start time

  const writeLog = (timeSec: number) => {
    const line = timeSec.toFixed(10).replace('.', ',') + '\n';
    fs.appendFileSync(logPath, line);
  };

  try {
    // Stop any previous capture
    if (activePcap) {
      activePcap.stop();
      activePcap.removeAllListeners();
      activePcap = null;
    }

    const pcap = new NodeWinPcap(ipAddress);
    activePcap = pcap;

    pcap.on('packet', () => {
      const now = process.hrtime.bigint();
      const deltaNs = Number(now - startTime); // nanoseconds
      const deltaSec = deltaNs / 1_000_000_000; // convert to seconds
      writeLog(deltaSec);
    });

    pcap.on('error', (err) => {
      console.error('Sniffer error:', err);
    });

    pcap.start();
    console.log(
      `Packet sniffing started on ${ipAddress} for ${durationSec} seconds`,
    );

    // Stop after duration
    setTimeout(() => {
      if (activePcap) {
        activePcap.stop();
        activePcap.removeAllListeners();
        activePcap = null;
        console.log('Packet sniffing stopped.');
      }
    }, durationSec * 1000);
  } catch (e: any) {
    console.error('Failed to start sniffing:', e.message);
  }
}

ipcMain.handle('getNetworkInterfaces', async () => {
  return getNetworkInterfaces();
});

ipcMain.on('startCapture', (event, settings: CaptureSettings) => {
  stopPacketSniffer();
  const currentInterfaces: NetworkInterfaceInfo[] = getNetworkInterfaces();
  const currentInterface = currentInterfaces.find(
    (networkInterface) => networkInterface.name == settings.interfaceName,
  );
  const currentInterfaceIp = currentInterface?.addresses[0].address ?? '';

  console.log(`Starting capture on ${currentInterfaceIp}`);
  startPacketSniffer(currentInterfaceIp, settings.duration);
});

ipcMain.on('stopCapture', () => {
  console.log('Stopping capture...');
  stopPacketSniffer();
});

app
  .whenReady()
  .then(() => {
    createWindow();
    printNetworkInterfacesPretty();
    startPacketSniffer('192.168.1.57', '10');
    app.on('activate', () => {
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
