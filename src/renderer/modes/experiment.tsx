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

export default function Experiment() {
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  const [poissonParams, setPoissonParams] = useState<PoissonParams>({
    lambda: 10, // 10 заявки в секунду
    mu: 2, // среднее время обслуживание 1/mu - 0.5 секунды
    totalTime: 10, // время моделирования
  });

  const options: ChartProps<'line'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Chart.js Line Chart',
      },
    },
    scales: {
      x: {
        // type: 'time',
        // time: {
        //   tooltipFormat: 'DD T',
        // },

        type: 'time',
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        title: {
          display: true,
          text: 'value',
        },
      },
    },
  };

  const data: ChartProps<'line'>['data'] = {
    datasets: [
      {
        label: 'Dataset 1',
        data: arrivals.map<Point>((arrival: Arrival) => ({
          x: arrival.time,
          y: arrival.serviceTime,
        })),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

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
      <div className="bg-white p-8 flex-1">
        {' '}
        <Line options={options} data={data} />
      </div>
    </div>
  );
}
