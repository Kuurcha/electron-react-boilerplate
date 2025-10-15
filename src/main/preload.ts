// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { CaptureStatus, NetworkInterfaceInfo } from './networkCapturer/type';
import { CaptureSettings } from '../bus/types';
export type Channels =
  | 'ipc-example'
  | 'getNetworkInterfaces'
  | 'startCapture'
  | 'stopCapture';

console.log('✅ Preload loaded, sandbox:', process.sandboxed);

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
  getNetworkInterfaces: async (): Promise<NetworkInterfaceInfo[]> => {
    return ipcRenderer.invoke('getNetworkInterfaces');
  },

  startCapture: (captureSettings: CaptureSettings) =>
    ipcRenderer.send('startCapture', captureSettings),

  stopCapture: () => ipcRenderer.send('stopCapture'),

  saveFileDialogue: async (): Promise<string | null> => {
    return await ipcRenderer.invoke('dialog:save-file');
  },

  writeFile: async (path: string, content: string) => {
    return await ipcRenderer.invoke('file:write', path, content);
  },

  onCaptureStatus: (callback: (status: CaptureStatus) => void) => {
    ipcRenderer.on('capture-status', (_event, status: CaptureStatus) => {
      callback(status);
    });
  },

  fileExists: async (path: string): Promise<boolean> => {
    return await ipcRenderer.invoke('file:exists', path);
  },

  fileGetDefaultPath: async (): Promise<string> => {
    return await ipcRenderer.invoke('file:getDefaultPath');
  },
};

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: electronHandler.ipcRenderer,
  getNetworkInterfaces: electronHandler.getNetworkInterfaces,
  startCapture: electronHandler.startCapture,
  stopCapture: electronHandler.stopCapture,
  saveFileDialogue: electronHandler.saveFileDialogue,
  writeFile: electronHandler.writeFile,
  fileExists: electronHandler.fileExists,
  fileGetDefaultPath: electronHandler.fileGetDefaultPath,
  onCaptureStatus: electronHandler.onCaptureStatus,
});

export type ElectronHandler = typeof electronHandler;
