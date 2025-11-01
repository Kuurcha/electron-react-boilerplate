import { dialog, ipcMain } from 'electron';
import { getNetworkInterfaces } from '../networkCapturer/functions';
import { CaptureSettings } from '../../bus/types';
import { Sniffer } from '../networkCapturer/sniffer';
import { NetworkInterfaceInfo } from '../networkCapturer/type';
import { getAppRootFilePath } from '../helpers/fileHelper';
import fs from 'fs';
export default class NetworkCapturerIpcHandler {
  constructor(sniffer: Sniffer | null) {
    this.registerExample();
    this.registerGetNetworkInterfaces();
    this.registerStartCapture(sniffer);
    this.registerStopCapture(sniffer);
    this.registerFileOperations();
  }

  private registerExample() {
    ipcMain.on('ipc-example', async (event, arg) => {
      const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
      console.log(msgTemplate(arg));
      event.reply('ipc-example', msgTemplate('pong'));
    });
  }

  private registerGetNetworkInterfaces() {
    ipcMain.handle('getNetworkInterfaces', async () => {
      return getNetworkInterfaces();
    });
  }

  private registerStartCapture(sniffer: Sniffer | null) {
    ipcMain.on('startCapture', (event, settings: CaptureSettings) => {
      sniffer?.stopPacketSniffer();

      const currentInterfaces: NetworkInterfaceInfo[] = getNetworkInterfaces();
      const currentInterface = currentInterfaces.find(
        (networkInterface) => networkInterface.name == settings.interfaceName,
      );
      const currentInterfaceIp = currentInterface?.addresses[0].address ?? '';

      console.log(`Starting capture on ${currentInterfaceIp}`);

      sniffer?.startPacketSniffer(
        currentInterfaceIp,
        settings.duration,
        settings.maxPackets,
        settings.filePath,
      );
    });
  }

  private registerStopCapture(sniffer: Sniffer | null) {
    ipcMain.on('stopCapture', () => {
      console.log('Stopping capture...');
      sniffer?.sendCaptureStatus({
        state: 'stopped',
        message: `Захват остановлен вручную`,
        filePath: '',
      });
      sniffer?.stopPacketSniffer();
    });
  }

  private registerFileOperations() {
    ipcMain.handle('dialog:save-file', async (_) => {
      console.log('saving file file');
      const defaultPath = getAppRootFilePath();
      const { filePath, canceled } = await dialog.showSaveDialog({
        title: 'Save As',
        defaultPath,
        filters: [{ name: 'Text Files', extensions: ['txt'] }],
      });

      if (canceled || !filePath) return null;
      return filePath;
    });

    ipcMain.handle('file:write', async (_, filePath, content) => {
      console.log('writing file');
      filePath = filePath == '' ? getAppRootFilePath() : filePath;
      fs.writeFileSync(filePath, content, 'utf-8');
      return true;
    });

    ipcMain.handle(
      'file:exists',
      async (_, filePath: string): Promise<boolean> => {
        return fs.existsSync(filePath);
      },
    );

    ipcMain.handle('file:getDefaultPath', () => {
      return getAppRootFilePath();
    });
  }


}
