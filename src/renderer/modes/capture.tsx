import { useEffect, useState } from 'react';
import { FolderIcon } from '@heroicons/react/24/solid';
import icon from '../../../assets/icon.svg';

import Dropdown from './../components/dropdown';
import {
  CaptureStatus,
  NetworkInterfaceInfo,
} from '../../main/networkCapturer/type';
import { CaptureParams, CaptureSettings } from '../../bus/types';
import CustomInput from './../components/input';

export default function Capture() {
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus>({
    state: 'stopped',
  });

  const [interfaces, setInterfaces] = useState<NetworkInterfaceInfo[]>([]);
  const [selectedInterface, setSelectedInterface] =
    useState<NetworkInterfaceInfo | null>(null);
  const [captureParams, setCaptureParams] = useState<CaptureParams>({
    maxPackets: '999',
    duration: '10',
  });
  const [pathToFile, setPathToFile] = useState<string>('');

  const handleSavePath = async () => {
    const filePath = await window.electron.saveFileDialogue();
    if (!filePath) return;
    setPathToFile(filePath);
  };
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
      alert('Пожалуйста, сначала выберете интерфейс!');
      return;
    }

    const maxPacketsNum = parseInt(captureParams.maxPackets, 10);
    const durationNum = parseInt(captureParams.duration, 10);

    if (Number.isNaN(durationNum) || durationNum <= 0) {
      alert('Длительность должна быть позитивным числом!');
      return;
    }

    if (Number.isNaN(maxPacketsNum) || maxPacketsNum <= 0) {
      alert('Максимальное кол-во пакетов должно быть позитивным числом');
      return;
    }

    const captureSettings: CaptureSettings = {
      maxPackets: maxPacketsNum.toString(),
      duration: durationNum.toString(),
      interfaceName: selectedInterface.name,
      filePath: pathToFile,
    };

    window.electron.startCapture(captureSettings);
    console.log(`Started capture on ${selectedInterface}`);
  };

  const handleStopCapture = () => {
    window.electron.stopCapture();
    console.log('Stopped capture');
  };

  useEffect(() => {
    async function fetchDefaultPath() {
      const defaultPath = await window.electron.fileGetDefaultPath();
      setPathToFile(defaultPath);
    }

    fetchDefaultPath();

    window.electron
      .getNetworkInterfaces()
      .then(setInterfaces)
      .catch(() => {});

    window.electron.onCaptureStatus((status: CaptureStatus) => {
      alert(status.message);
      console.log(`status changed ${status.message}`);
      setCaptureStatus(status);
    });
  }, []);

  const items = interfaces.map((iface) => ({
    id: iface.name + iface.addresses[0].address,
    label: `${iface.name} - ${iface.addresses[0].address}`,
    onClick: () => setSelectedInterface(iface),
  }));

  return (
    <div className="h-1/2 w-1/2 self-center my-auto mx-auto">
      <div className="Hello">
        <img width="200" alt="icon" src={icon} />
      </div>

      <div className="relative max-w-sm">
        <div className="flex justify-center">
          <div className="flex flex-col space-y-4 p-4 max-w-3xs">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSavePath}
                className=" bg-gray-300 p-1 hover:bg-gray-400 rounded"
              >
                <FolderIcon className="h-6 w-6 text-gray-600" />
              </button>

              <input
                type="text"
                readOnly
                value={pathToFile}
                className="flex-1 border rounded-lg px-2 py-1 text-sm
             text-gray-900 text-gray-800 bg-gray-300"
              />
            </div>

            <div className="flex justify-center items-center ">
              <Dropdown
                label={
                  selectedInterface
                    ? selectedInterface.name
                    : 'Выберите интерфейс'
                }
                items={items}
              />
            </div>
            <div className="flex flex-row space-x-4 p-4 max-w-3xs">
              {' '}
              <CustomInput
                label="Максимум пакетов"
                name="maxPackets"
                value={captureParams.maxPackets}
                onChange={handleInputChange}
                onInput={(e: any) => {
                  if (e.target.value < 1) e.target.value = '1';
                }}
                min={1}
                placeholder="Максимум пакетов"
              />
              <CustomInput
                label="Длительность (сек)"
                name="duration"
                value={captureParams.duration}
                onChange={handleInputChange}
                onInput={(e: any) => {
                  if (e.target.value < 1) e.target.value = '1';
                }}
                min={1}
                placeholder="Длительность (сек)"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col ">
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
        <div className="text-center mt-2">
          <p>
            Текущий статус:{' '}
            {captureStatus.state === 'stopped' ? 'остановлен' : 'в процессе'}
          </p>
        </div>{' '}
      </div>
    </div>
  );
}
