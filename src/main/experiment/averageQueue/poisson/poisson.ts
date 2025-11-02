export type Arrival = {
  id: number;
  time: number; // actual arrival time
  serviceTime: number;
  intervalInfo?: {
    previousEndTime: number; // end of the previous interval
    startTime: number; // max(arrival time, previous end)
    endTime: number;
    duration: number; // service duration
    overlapCount: number; // number of arrivals that arrived during this interval
    queueSizeAtArrival: number;
  };
};

// Генерация случайного экспоненциального значения
function exponential(meanRate: number): number {
  const u = Math.random();
  return -Math.log(1 - u) / meanRate;
}

export function enrichArrivals(arrivals: Arrival[]): Arrival[] {
  if (arrivals.length === 0) return [];

  const sorted = [...arrivals].sort((a, b) => a.time - b.time);

  let previousEnd = 0;
  const activeEndTimes: number[] = [];

  const result = sorted.map((a, i) => {
    // Remove finished services (their endTime <= current arrival)
    for (let k = activeEndTimes.length - 1; k >= 0; k--) {
      if (activeEndTimes[k] <= a.time) {
        activeEndTimes.splice(k, 1);
      }
    }

    const queueSizeAtArrival = activeEndTimes.length;

    // Start only after last service finishes
    const startTime = Math.max(a.time, previousEnd);
    const endTime = startTime + a.serviceTime;

    const intervalInfo = {
      previousEndTime: previousEnd,
      startTime,
      endTime,
      duration: a.serviceTime,
      overlapCount: 0,
      queueSizeAtArrival,
    };

    // Update for next iteration
    previousEnd = endTime;
    activeEndTimes.push(endTime);

    return { ...a, intervalInfo };
  });

  // Compute overlap counts (arrivals during service)
  for (let i = 0; i < result.length; i++) {
    const current = result[i].intervalInfo!;
    const start = current.startTime;
    const end = current.endTime;

    let count = 0;
    for (let j = 0; j < result.length; j++) {
      if (i === j) continue;
      const other = result[j];
      if (other.time >= start && other.time <= end) {
        count++;
      }
    }

    current.overlapCount = count;
  }

  return result;
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

  let calculatedArrivals = enrichArrivals(arrivals);

  return calculatedArrivals;
}
