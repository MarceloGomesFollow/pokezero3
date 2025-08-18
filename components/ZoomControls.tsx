import React from 'react';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  currentZoom: number;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ onZoomIn, onZoomOut, onZoomReset, currentZoom }) => {
  return (
    <div className="fixed top-16 right-2 sm:top-2 sm:right-2 z-50 flex flex-col items-center space-y-1 bg-black/40 p-1 rounded-lg backdrop-blur-sm">
      <button onClick={onZoomIn} title="Aumentar Zoom" className="w-8 h-8 flex items-center justify-center bg-gray-700/80 text-white font-bold rounded-md hover:bg-gray-600 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
      <button onClick={onZoomReset} title="Restaurar Zoom" className="w-8 h-8 flex items-center justify-center bg-gray-700/80 text-white font-bold rounded-md hover:bg-gray-600 transition-colors text-xs">
        {Math.round(currentZoom * 100)}%
      </button>
      <button onClick={onZoomOut} title="Diminuir Zoom" className="w-8 h-8 flex items-center justify-center bg-gray-700/80 text-white font-bold rounded-md hover:bg-gray-600 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
      </button>
    </div>
  );
};

export default ZoomControls;