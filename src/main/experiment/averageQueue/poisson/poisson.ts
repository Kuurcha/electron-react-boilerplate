type Arrival = {
  id: number;
  time: number;
  serviceTime: number;
};

// Генерация случайного экспоненциального значения
function exponential(meanRate: number): number {
  const u = Math.random();
  return -Math.log(1 - u) / meanRate;
}

/**
 * Генерация пуассоновского потока
 * @param lambda — интенсивность потока (среднее число заявок в секунду)
 * @param mu — параметр экспоненциального обслуживания (1 / среднее время обслуживания)
 * @param totalTime — длительность моделирования
 */
export function generatePoissonArrivals(
  lambda: number,
  mu: number,
  totalTime: number,
): Arrival[] {
  const arrivals: Arrival[] = [];
  let currentTime = 0;
  let id = 1;

  while (currentTime < totalTime) {
    const interArrival = exponential(lambda);
    currentTime += interArrival;
    if (currentTime > totalTime) break;

    const serviceTime = exponential(mu);

    arrivals.push({
      id: id++,
      time: currentTime,
      serviceTime: serviceTime,
    });
  }

  return arrivals;
}
