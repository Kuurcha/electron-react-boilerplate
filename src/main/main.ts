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
import fs from "fs";
import os from "os";


class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

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


function startPacketSniffer(ipAddress: string) {
  const logPath = path.join(process.cwd(), "sniffer_log.txt");

  // helper to append lines to file
  const writeLog = (...messages: any[]) => {
    const line = messages.map(String).join(" ") + "\n";
    fs.appendFileSync(logPath, line);
  };

  try {
    const pcap = new NodeWinPcap(ipAddress, { /* options */ });
    writeLog("APP IS READY");

    pcap.on("packet", (packet) => {
      writeLog("--- New Packet ---");
      writeLog("Packet Length:", packet.length);

      const ipHeader = packet.ipHeader;
      if (ipHeader) {
        writeLog(`Source IP: ${ipHeader.sourceIP}`);
        writeLog(`Destination IP: ${ipHeader.destIP}`);
        writeLog(`Protocol: ${ipHeader.protocol}`);

        if (ipHeader.protocol === NodeWinPcap.Protocol.TCP) {
          writeLog("  (TCP Protocol)");
        } else if (ipHeader.protocol === NodeWinPcap.Protocol.UDP) {
          writeLog("  (UDP Protocol)");
        }

        writeLog(`Source Port: ${ipHeader.sourcePort}`);
        writeLog(`Destination Port: ${ipHeader.destPort}`);
      }
      writeLog(""); // blank line for readability
    });

    pcap.on("error", (error) => {
      writeLog("An error occurred:", error);
    });

    pcap.start();
    writeLog(`Packet sniffing started on ${pcap.ipAddress}...`);

    setTimeout(() => {
      pcap.stop();
      writeLog("Packet sniffing stopped.");
    }, 40000);
  } catch (e: any) {
    writeLog(`Failed to start sniffing: ${e.message}`);
  }
}

function printNetworkInterfacesPretty() {
  const interfaces = os.networkInterfaces();

  console.log('\n==============================');
  console.log('🌐  Available Network Interfaces');
  console.log('==============================');

  for (const [name, addrs] of Object.entries(interfaces)) {
    console.log(`\n Interface: ${name}`);
    console.log('--------------------------------');

    if (!addrs || addrs.length === 0) {
      console.log('  (No addresses found)');
      continue;
    }

    for (const addr of addrs) {
      console.log(`    Address:  ${addr.address}`);
      console.log(`    Family:   ${addr.family}`);
      console.log(`    MAC:      ${addr.mac}`);
      console.log(`    Internal: ${addr.internal ? 'Yes' : 'No'}`);
      console.log('');
    }
  }

  console.log('==============================\n');
}

app
  .whenReady()
  .then(() => {
    createWindow();
    printNetworkInterfacesPretty();
    // startPacketSniffer('192.168.1.57');

    app.on('activate', () => {

      if (mainWindow === null) createWindow();
    });
  })
.catch(console.log);

