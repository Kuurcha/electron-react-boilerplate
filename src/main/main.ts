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

app
  .whenReady()
  .then(() => {
    createWindow();
            const pcap = new NodeWinPcap('192.168.1.57', { /* options */ });
            // const interfacese: any = os.networkInterfaces();
            // console.log(os.networkInterfaces());
            // console.log("test");
          //   console.log("APP IS READY");
          //   pcap.on('packet', (packet) => {
          //     console.log('--- New Packet ---');
          //     console.log('Packet Length:', packet.length);

          //     // Print IP header information
          //     const ipHeader = packet.ipHeader;
          //     if (ipHeader) {
          //       console.log(`Source IP: ${ipHeader.sourceIP}`);
          //       console.log(`Destination IP: ${ipHeader.destIP}`);
          //       console.log(`Protocol: ${ipHeader.protocol}`);
          //       if (ipHeader.protocol === NodeWinPcap.Protocol.TCP) {
          //         console.log('  (TCP Protocol)');
          //       } else if (ipHeader.protocol === NodeWinPcap.Protocol.UDP) {
          //         console.log('  (UDP Protocol)');
          //       }
          //       console.log(`Source Port: ${ipHeader.sourcePort}`);
          //       console.log(`Destination Port: ${ipHeader.destPort}`);
          //     }

          //     // Full packet data (Buffer)
          //     // console.log('Packet Data:', packet.data);
          //   });

          // // Set up 'error' event listener
          // pcap.on('error', (error) => {
          //   console.error('An error occurred:', error);
          // });

          // try {
          //   // Start packet capture (without filters)
          //   pcap.start('1.2.3.4', '5.6.7.8');
          //   console.log(`Packet sniffing started on ${pcap.ipAddress}...`);

          //   // Start capture with specific IP address filters
          //   // pcap.start('1.2.3.4', '5.6.7.8'); // sourceIP: 1.2.3.4, destIP: 5.6.7.8
          //   // console.log('Packet sniffing started with IP filters...');

          // } catch (e: any) {
          //   console.error(`Failed to start sniffing: ${e.message}`);
          // }

          // // Stop capture after 10 seconds
          // setTimeout(() => {
          //   pcap.stop();
          //   console.log('Packet sniffing stopped.');
          // }, 10000);

    app.on('activate', () => {


      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
.catch(console.log);

