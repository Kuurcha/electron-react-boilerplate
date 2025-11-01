import path from 'path';
import fs from 'fs';

import { NodeWinPcap } from 'node-win-pcap';
import { CaptureStatus } from './type';
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
/**
 * Logs messages with a timestamp and SNIFFER INFO tag.
 */

export class Sniffer {
  activePcap: NodeWinPcap | null = null;
  mainWindow: BrowserWindow | null = null;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  sendCaptureStatus(status: CaptureStatus) {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('capture-status', status);
    }
  }

  endCaptureStatus(status: CaptureStatus) {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('capture-status', status);
    }
  }

  snifferLog(...messages: any[]) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] SNIFFER INFO:`, ...messages);
  }

  stopPacketSniffer() {
    const logPath = path.join(process.cwd(), 'sniffer_log.txt');
    const writeLog = (...messages: any[]) => {
      const line = messages.map(String).join(' ') + '\n';
      fs.appendFileSync(logPath, line);
    };
  }

  /**
   * Starts a packet sniffer and logs only the moments of packet arrivals.
   * @param ipAddress - IP of the interface to capture on
   * @param durationSecStr - Duration in seconds (as string)
   */
  startPacketSniffer(
    ipAddress: string,
    durationSecStr: string,
    maxPackets: string,
    logPath: string,
  ) {
    const durationSec = parseInt(durationSecStr, 10);
    const maxPacketsInt = parseInt(maxPackets);
    let currentPackets = 0;

    if (Number.isNaN(durationSec) || durationSec <= 0) {
      console.error('Invalid duration:', durationSecStr);
      return;
    }

    logPath = logPath ?? path.join(process.cwd(), 'sniffer_log.txt');

    // Clear existing log
    fs.writeFileSync(logPath, '');

    const startTime = process.hrtime.bigint(); // high-res start time

    const writeLog = (timeSec: number) => {
      const line = timeSec.toFixed(10).replace('.', ',') + '\n';
      fs.appendFileSync(logPath, line);
    };

    try {
      // Stop any previous capture
      if (this.activePcap) {
        this.activePcap.stop();
        this.activePcap.removeAllListeners();
        this.activePcap = null;
      }

      this.sendCaptureStatus({
        state: 'running',
        message: 'Захват начен',
        filePath: logPath,
      });

      const pcap = new NodeWinPcap(ipAddress);
      this.activePcap = pcap;

      // Stop after duration
      const timeoutId = setTimeout(() => {
        this.stopPacketCapture(this.activePcap, logPath);
      }, durationSec * 1000);

      pcap.on('packet', () => {
        currentPackets++;

        console.log(currentPackets);
        if (currentPackets >= maxPacketsInt) {
          this.stopPacketCapture(this.activePcap, logPath);
        }

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
    } catch (e: any) {
      console.error('Failed to start sniffing:', e.message);
    }
  }

  // TO DO: Убрать ANY
  stopPacketCapture(activePcapRef: any, logPathRef: any) {
    if (activePcapRef) {
      activePcapRef.stop();
      activePcapRef.removeAllListeners();
      activePcapRef = null;
      console.log('Packet sniffing stopped.');
      this.sendCaptureStatus({
        state: 'stopped',
        message:
          'Захват остановлен ввиду истечения длительности захвата или достижения лимита пакетов',
        filePath: logPathRef,
      });
    }
  }
}
