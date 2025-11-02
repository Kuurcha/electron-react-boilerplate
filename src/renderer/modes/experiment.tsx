/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';

import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Point,
  TimeScale,
  TimeSeriesScale,
} from 'chart.js';
import { Line, ChartProps } from 'react-chartjs-2';

import { Arrival } from '../../main/experiment/averageQueue/poisson/poisson';
import { PoissonParams } from '../../main/networkCapturer/type';
import CustomInput from '../components/input';
import 'chartjs-adapter-moment';
import Dropdown from '../components/dropdown';

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  TimeSeriesScale,
  Title,
  Tooltip,
  Legend,
);

type GraphConfig = {
  id: string;
  name: string;
  getData: () => any;
  getConfig: () => any;
};

/**
 * Рассчитывает коэффициент загрузки ρ для односерверной очереди
 */
function calculateRho(params: PoissonParams): number {
  // среднее время обслуживания
  const meanServiceTime = 1 / params.mu;

  // коэффициент загрузки
  const rho = params.lambda / meanServiceTime;
  return rho;
}

/**
 * Условное среднее число заявок q(ρ)
 * @param rho - коэффициент загрузки ρ (0 < ρ < 1)
 * @returns условное среднее число заявок
 */
function qOfRho(rho: number): number {
  if (rho <= 0 || rho >= 1) {
    throw new Error('Коэффициент загрузки ρ должен быть в диапазоне (0, 1)');
  }
  return (rho * rho) / (2 * (1 - rho));
}

export default function Experiment() {
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  const [poissonParams, setPoissonParams] = useState<PoissonParams>({
    lambda: 100, // 10 заявки в секунду
    mu: 0.007, // среднее время обслуживание (1/mu)
    totalTime: 10, // время моделирования
  });

  const [selectedGraph, setSelectedGraph] = useState<null | {
    id: string;
    name: string;
    getData: () => any;
    getConfig: () => any;
  }>(null);

  function getArrivalsGraphData() {
    const sortedArrivals = [...arrivals].sort((a, b) => a.time - b.time);

    const labels = sortedArrivals.map((a) => a.time.toFixed(2));
    const dataValues = sortedArrivals.map(
      (a) => a.intervalInfo?.overlapCount ?? 0,
    );

    return {
      labels,
      datasets: [
        {
          label: 'Overlaps / queue size',
          data: dataValues,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.3,
          pointRadius: 3,
        },
      ],
    };
  }
  function getArrivalsGraphOptions() {
    return {
      responsive: true,
      plugins: {
        legend: { position: 'top' as const },
        title: { display: true, text: 'Arrivals Over Time' },
      },
      scales: {
        x: { title: { display: true, text: 'Time' } },
        y: {
          title: { display: true, text: 'Overlap Count' },
          beginAtZero: true,
        },
      },
    };
  }

  function getArrivalsGraphOptions2() {
    return {
      responsive: true,
      plugins: {
        legend: { position: 'top' as const },
        title: { display: true, text: 'Arrivals Over Time2' },
      },
      scales: {
        x: { title: { display: true, text: 'Time' } },
        y: {
          title: { display: true, text: 'Overlap Count2' },
          beginAtZero: true,
        },
      },
    };
  }

  function getRandomGraphData() {
    return {
      labels: ['A', 'B', 'C', 'D'],
      datasets: [
        {
          label: 'Random Data',
          data: [10, 5, 8, 12],
          fill: false,
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.3,
          pointRadius: 3,
        },
      ],
    };
  }

  function getRandomGraphOptions() {
    return {
      responsive: true,
      plugins: {
        legend: { position: 'top' as const },
        title: { display: true, text: 'Random Data Graph' },
      },
      scales: {
        x: { title: { display: true, text: 'Category' } },
        y: { title: { display: true, text: 'Value' }, beginAtZero: true },
      },
    };
  }

  const graphs = [
    {
      id: '1',
      name: 'Arrivals Over Time',
      getData: getArrivalsGraphData,
      getConfig: getArrivalsGraphOptions,
    },
    {
      id: '2',
      name: 'Arrivals Over Meow',
      getData: getArrivalsGraphData,
      getConfig: getArrivalsGraphOptions2,
    },
    {
      id: '3',
      name: 'Random Graph',
      getData: getRandomGraphData,
      getConfig: getRandomGraphOptions,
    },
  ];

  // const options: ChartProps<'line'>['options'] = {
  //   responsive: true,
  //   plugins: {
  //     legend: {
  //       position: 'top' as const,
  //     },
  //     title: {
  //       display: true,
  //       text: 'Chart.js Line Chart',
  //     },
  //   },
  //   scales: {
  //     x: {
  //       // type: 'time',
  //       // time: {
  //       //   tooltipFormat: 'DD T',
  //       // },
  //       // type: 'time',
  //       // title: {
  //       //   display: true,
  //       //   text: 'Date',
  //       // },
  //     },
  //     y: {
  //       title: {
  //         display: true,
  //         text: 'value',
  //       },
  //     },
  //   },
  // };

  // const data: ChartProps<'line'>['data'] = {
  //   datasets: [
  //     {
  //       label: 'Dataset 1',
  //       data: arrivals.map<Point>((arrival: Arrival) => ({
  //         x: arrival.time,
  //         y: arrival.serviceTime,
  //       })),
  //       borderColor: 'rgb(255, 99, 132)',
  //       backgroundColor: 'rgba(255, 99, 132, 0.5)',
  //     },
  //   ],
  // };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newValue = Number(value) < 1 ? '1' : value;
    setPoissonParams((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleGetPoissonStream = async () => {
    try {
      console.log('test');
      const result = await window.electron.getPoissonStream(poissonParams);

      if (result && result.length > 0) {
        // если структура такая, как в enrichArrivals()
        const overlapSum = result.reduce((sum, item) => {
          return sum + (item.intervalInfo?.overlapCount ?? 0);
        }, 0);

        const avgQueueSize = overlapSum / result.length;

        console.log('Average queue size (mean overlap):', avgQueueSize);
      }

      const coefficientOfLoad = calculateRho(poissonParams);
      console.log('calculateRho: ', calculateRho(poissonParams));
      console.log('Average size by formula:  ', qOfRho(coefficientOfLoad));
      console.log(result);
      setArrivals(result);
    } catch (error) {
      console.error('Error fetching Poisson stream:', error);
    }
  };

  useEffect(() => {
    handleGetPoissonStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = graphs.map((g) => ({
    id: g.id,
    label: g.name,
    onClick: () => setSelectedGraph(g),
  }));

  return (
    <div className="flex flex-col flex-1">
      {' '}
      <div className="h-1/2 self-center my-auto mx-auto">
        <div className="flex justify-center items-center">
          <div className="w-1/2">
            <CustomInput
              label="Среднее время обработки"
              name="mu"
              value={poissonParams.mu}
              onChange={handleInputChange}
              min={0}
              placeholder="Максимум пакетов"
            />
          </div>
        </div>
        <div className="flex flex-row space-x-2">
          <div className="flex-1">
            <CustomInput
              label="Интенсивность (лямбда)"
              name="lambda"
              value={poissonParams.lambda}
              onChange={handleInputChange}
              min={0}
              placeholder="Максимум пакетов"
            />
          </div>

          <div className="flex-1">
            <CustomInput
              label="Время моделирования"
              name="totalTime"
              value={poissonParams.totalTime}
              onChange={handleInputChange}
              min={1}
              placeholder="Максимум пакетов"
            />
          </div>
        </div>
        <Dropdown
          label={selectedGraph ? selectedGraph.name : 'Выберите график'}
          items={items}
        />
        {/* <div className="flex justify-center mt-4">
        <button
          onClick={handleGetPoissonStream}
          type="button"
          className="focus:outline-none text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-900"
        >
          Создать поток
        </button>
      </div> */}
      </div>
      {selectedGraph && (
        <div className="bg-white p-8 flex-1 mt-4">
          <Line
            options={selectedGraph.getConfig()}
            data={selectedGraph.getData()}
          />
        </div>
      )}
    </div>
  );
}
