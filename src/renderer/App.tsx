import { JSX } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import Experiment from './modes/experiment';
import Capture from './modes/capture';
import './App.css';
import TopBar from './components/topbar';

type Mode = 'capture' | 'experiment';

const modeComponents: Record<Mode, JSX.Element> = {
  capture: <Capture />,
  experiment: <Experiment />,
};
export default function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <TopBar />
        <Routes>
          <Route path="/" element={modeComponents.capture} />
          <Route path="/experiment" element={modeComponents.experiment} />
        </Routes>
      </div>
    </Router>
  );
}
