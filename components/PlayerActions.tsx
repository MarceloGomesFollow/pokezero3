
import React, { useState, useMemo } from 'react';

interface PlayerActionsProps {
  canCheck: boolean;
  canRaise: boolean;
  amountToCall: number;
  minRaise: number;
  maxRaise: number; // player's stack
  onFold: () => void;
  onCheck: () => void;
  onCall: () => void;
  onRaise: (amount: number) => void;
}

const PlayerActions: React.FC<PlayerActionsProps> = ({
  canCheck, canRaise, amountToCall, minRaise, maxRaise,
  onFold, onCheck, onCall, onRaise,
}) => {
  const [raiseAmount, setRaiseAmount] = useState(minRaise);

  React.useEffect(() => {
    setRaiseAmount(minRaise);
  }, [minRaise]);
  
  const handleRaise = () => {
      if (raiseAmount >= minRaise && raiseAmount <= maxRaise) {
          onRaise(raiseAmount);
      }
  };

  const callText = amountToCall > 0 ? `Cobrir $${amountToCall}` : 'Check';

  return (
    <div className="flex flex-col items-center space-y-2 p-2 bg-black/30 rounded-t-lg w-full max-w-xl">
      {canRaise && (
         <div className="w-full flex flex-col sm:flex-row items-center sm:space-x-2 gap-1 px-1">
            <label htmlFor="raise-slider" className="font-semibold text-yellow-300 text-xs sm:text-sm">Aumentar:</label>
            <input 
              id="raise-slider"
              type="range" 
              min={minRaise} 
              max={maxRaise} 
              value={raiseAmount}
              step={10}
              onChange={e => setRaiseAmount(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="font-bold text-sm sm:text-base text-white w-16 text-center">${raiseAmount}</span>
         </div>
      )}
      <div className="flex flex-wrap justify-center gap-2 w-full">
        <button
          onClick={onFold}
          className="py-1.5 px-4 text-sm sm:py-2 sm:px-6 sm:text-base font-bold rounded-md bg-red-600 hover:bg-red-700 transition-all transform hover:scale-105"
        >
          Correr
        </button>
        <button
          onClick={canCheck ? onCheck : onCall}
          className="py-1.5 px-4 text-sm sm:py-2 sm:px-6 sm:text-base font-bold rounded-md bg-blue-600 hover:bg-blue-700 transition-all transform hover:scale-105"
        >
          {callText}
        </button>
        {canRaise && (
          <button
            onClick={handleRaise}
            disabled={raiseAmount < minRaise}
            className="py-1.5 px-4 text-sm sm:py-2 sm:px-6 sm:text-base font-bold rounded-md bg-green-600 hover:bg-green-700 transition-all transform hover:scale-105 disabled:bg-gray-500 disabled:scale-100"
          >
             {amountToCall > 0 ? 'Aumentar' : 'Apostar'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PlayerActions;