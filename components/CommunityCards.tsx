import React from 'react';
import { Card as CardType, GameStage } from '../types';
import CardComponent from './Card';

interface CommunityCardsProps {
  cards: CardType[];
  gameStage: GameStage;
  winningCards?: CardType[];
}

const CommunityCards: React.FC<CommunityCardsProps> = ({ cards, gameStage, winningCards }) => {
  const visibleCards = () => {
    if (gameStage >= GameStage.River) return 5;
    if (gameStage >= GameStage.Turn) return 4;
    if (gameStage >= GameStage.Flop) return 3;
    return 0;
  };

  const displayCards = Array(5).fill(null).map((_, i) => i < cards.length ? cards[i] : null);

  return (
    <div className="flex justify-center items-center space-x-1 sm:space-x-2 my-1 sm:my-2 p-1 sm:p-2 bg-black/20 rounded-lg backdrop-blur-sm">
      {displayCards.map((card, index) => {
        const isWinningHandCard = gameStage === GameStage.Showdown && !!card && winningCards?.some(wc => wc.id === card.id);
        return (
          <div key={index} className={`transition-opacity duration-500 ${index < visibleCards() ? 'opacity-100' : 'opacity-0'}`}>
            {card ? <CardComponent card={card} isWinningHandCard={isWinningHandCard} /> : <div className="w-9 h-14 sm:w-12 sm:h-20 md:w-16 md:h-24 bg-green-700/50 rounded-md border border-dashed border-green-500" />}
          </div>
        )
      })}
    </div>
  );
};

export default CommunityCards;