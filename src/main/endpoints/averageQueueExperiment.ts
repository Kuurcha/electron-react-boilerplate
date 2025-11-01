import { dialog, ipcMain } from 'electron';
import fs from 'fs';
import {
  Arrival,
  generatePoissonArrivals,
} from '../experiment/averageQueue/poisson/poisson';
import { getNetworkInterfaces } from '../networkCapturer/functions';
import { PoissonParams } from '../networkCapturer/type';

export default class AverageQueueExperimentIpcHandler {
  registerGetPoissonStream() {
    ipcMain.handle(
      'getPoissonStream',
      async (_event, params: PoissonParams): Promise<Arrival[]> => {
        const { lambda, mu, totalTime } = params;
        const arrivals = generatePoissonArrivals(lambda, 1 / mu, totalTime);
        return arrivals;
      },
    );
  }

  constructor() {
    this.registerGetPoissonStream();
  }
}
