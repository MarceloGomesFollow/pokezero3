import React from 'react';
import { Card as CardType } from '../types';

interface CardProps {
  card?: CardType;
  isFaceDown?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  isWinningHandCard?: boolean;
}

const CardComponent: React.FC<CardProps> = ({ card, isFaceDown = false, isSelected = false, onClick, isWinningHandCard = false }) => {
  const baseClasses = "w-9 h-14 sm:w-12 sm:h-20 md:w-16 md:h-24 rounded-md shadow-md transition-all duration-300";
  
  if (isFaceDown) {
    return (
      <div className={`${baseClasses} bg-blue-800 border border-blue-900 flex items-center justify-center`}>
        <div className="w-7 h-10 sm:w-10 sm:h-16 md:w-12 md:h-20 bg-blue-700 rounded-sm"></div>
      </div>
    );
  }

  if (!card) return <div className={`${baseClasses} bg-transparent`}></div>;

  const suitColor = (card.suit === '♥' || card.suit === '♦') ? 'text-red-500' : 'text-gray-800';
  const winningHandClass = isWinningHandCard ? 'ring-2 ring-emerald-400 scale-105 shadow-emerald-500/50' : '';
  const selectedClass = isSelected ? 'ring-2 ring-blue-500 scale-105' : '';
  const clickableClass = onClick ? 'cursor-pointer hover:shadow-blue-300/50' : '';

  return (
    <div
      onClick={onClick}
      className={`${baseClasses} bg-white flex flex-col justify-between p-1 relative ${winningHandClass} ${selectedClass} ${clickableClass}`}
    >
      <div className={`text-xs sm:text-lg md:text-xl font-bold ${suitColor}`}>{card.rank}</div>
      <div className={`text-sm sm:text-2xl md:text-3xl text-center ${suitColor}`}>{card.suit}</div>
      <div className={`text-xs sm:text-lg md:text-xl font-bold ${suitColor} self-end transform rotate-180`}>{card.rank}</div>
    </div>
  );
};

export default CardComponent;