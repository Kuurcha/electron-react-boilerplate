// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { NetworkInterfaceInfo } from './networkCapturer/type';
import { CaptureSettings } from '../bus/types';
export type Channels =
  | 'ipc-example'
  | 'getNetworkInterfaces'
  | 'startCapture'
  | 'stopCapture';

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
};

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: electronHandler.ipcRenderer,
  getNetworkInterfaces: electronHandler.getNetworkInterfaces,
  startCapture: electronHandler.startCapture,
  stopCapture: electronHandler.stopCapture,
});

export type ElectronHandler = typeof electronHandler;
