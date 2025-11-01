import { Link, useLocation } from 'react-router-dom';

export default function TopBar() {
  const location = useLocation();

  const navItems = [
    { label: 'Capture', path: '/' },
    { label: 'Experiment', path: '/experiment' },
  ];

  return (
    <div className="sticky top-0 z-50 w-full">
      <div className="flex justify-center space-x-6 p-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <button
                type="button"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${
                  isActive
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                {item.label}
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
