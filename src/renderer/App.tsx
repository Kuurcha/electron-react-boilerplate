import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import icon from '../../assets/icon.svg';
import './App.css';
import Dropdown from './components/dropdown';
import { NetworkInterfaceInfo } from '../main/networkCapturer/type';
import { CaptureParams, CaptureSettings } from '../bus/types';

function Hello() {
  const [interfaces, setInterfaces] = useState<NetworkInterfaceInfo[]>([]);
  const [selectedInterface, setSelectedInterface] =
    useState<NetworkInterfaceInfo | null>(null);
  const [captureParams, setCaptureParams] = useState<CaptureParams>({
    maxPackets: '999',
    duration: '10',
  });

  // eslint-disable-next-line no-undef
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    const newValue = Number(value) < 1 ? '1' : value;

    setCaptureParams((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleStartCapture = () => {
    if (!selectedInterface) {
      alert('Please select a network interface first!');
      return;
    }

    const maxPacketsNum = parseInt(captureParams.maxPackets, 10);
    const durationNum = parseInt(captureParams.duration, 10);

    if (Number.isNaN(durationNum) || durationNum <= 0) {
      alert('Duration must be a positive number');
      return;
    }

    if (Number.isNaN(maxPacketsNum) || maxPacketsNum <= 0) {
      alert('Max packets must be a positive number');
      return;
    }

    const captureSettings: CaptureSettings = {
      maxPackets: maxPacketsNum.toString(),
      duration: durationNum.toString(),
      interfaceName: selectedInterface.name,
    };

    window.electron.startCapture(captureSettings);
    console.log(`Started capture on ${selectedInterface}`);
  };

  const handleStopCapture = () => {
    window.electron.stopCapture();
    console.log('Stopped capture');
  };

  useEffect(() => {
    window.electron
      .getNetworkInterfaces()
      .then(setInterfaces)
      .catch(() => {});
  }, []);

  const items = interfaces.map((iface) => ({
    id: iface.name + iface.addresses[0].address,
    label: `${iface.name} - ${iface.addresses[0].address}`,
    onClick: () => setSelectedInterface(iface),
  }));

  return (
    <div>
      <div className="Hello">
        <img width="200" alt="icon" src={icon} />
      </div>

      <div className="relative max-w-sm">
        <div className="flex justify-center">
          <div className="flex flex-col space-y-4 p-4 max-w-3xs">
            <div className="flex justify-center items-center ">
              <Dropdown
                label={
                  selectedInterface ? selectedInterface.name : 'Select Network'
                }
                items={items}
              />
            </div>

            <input
              // eslint-disable-next-line react/no-unknown-property
              id="default-datepicker"
              type="number"
              name="maxPackets"
              min="1"
              value={captureParams.maxPackets}
              onChange={handleInputChange}
              onInput={(e: any) => {
                if (e.target.value < 1) e.target.value = '1';
              }}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg
             focus:ring-blue-500 focus:border-blue-500
             ps-5 p-1.5 w-full
             dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400
             dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Максимум пакетов"
            />
            <input
              // eslint-disable-next-line react/no-unknown-property
              id="default-datepicker"
              name="duration"
              type="number"
              min="1"
              value={captureParams.duration}
              onChange={handleInputChange}
              onInput={(e: any) => {
                if (e.target.value < 1) e.target.value = '1';
              }}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg
             focus:ring-blue-500 focus:border-blue-500
             ps-5 p-1.5 w-full
             dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400
             dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Длительность (сек)"
            />
          </div>
        </div>
      </div>

      <div className="Hello">
        <button
          onClick={handleStartCapture}
          type="button"
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
        >
          Начать захват
        </button>

        <button
          onClick={handleStopCapture}
          type="button"
          className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
        >
          Остановить захват
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
