
import { Card, HandEvaluationResult } from '../types';
import { SUITS, RANKS, RANK_VALUES, HAND_RANK_NAMES } from '../constants';

export class Deck {
  private cards: Card[];

  constructor() {
    this.cards = SUITS.flatMap(suit => 
      RANKS.map(rank => ({ suit, rank, id: `${rank}-${suit}` }))
    );
    this.shuffle();
  }

  public shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  public deal(): Card | undefined {
    return this.cards.pop();
  }
}

const evaluateFiveCardHand = (hand: Card[]): HandEvaluationResult => {
  const ranks = hand.map(c => RANK_VALUES[c.rank]).sort((a, b) => b - a);
  const suits = hand.map(c => c.suit);
  
  const rankCounts = ranks.reduce((acc, rank) => {
    acc[rank] = (acc[rank] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  const uniqueRanks = Object.keys(rankCounts).map(Number).sort((a, b) => b - a);

  const isFlush = new Set(suits).size === 1;
  const isAceLowStraight = JSON.stringify(uniqueRanks) === JSON.stringify([14, 5, 4, 3, 2]);
  const isStraight = uniqueRanks.length === 5 && (uniqueRanks[0] - uniqueRanks[4] === 4 || isAceLowStraight);
  
  const getTiebreakerValues = (primaryRanks: number[]): number[] => {
      const sortedRanks = hand.map(c => RANK_VALUES[c.rank]).sort((a,b) => b-a);
      const primarySet = new Set(primaryRanks);
      const kickers = sortedRanks.filter(r => !primarySet.has(r));
      return [...primaryRanks, ...kickers];
  }
    
  if (isStraight && isFlush) {
    if (uniqueRanks[0] === 14) return { rank: 9, name: HAND_RANK_NAMES[9], values: uniqueRanks, cards: hand };
    const values = isAceLowStraight ? [5, 4, 3, 2, 1] : uniqueRanks;
    return { rank: 8, name: HAND_RANK_NAMES[8], values, cards: hand };
  }
  if (counts[0] === 4) {
    const quadRank = uniqueRanks.find(r => rankCounts[r] === 4)!;
    const kicker = uniqueRanks.find(r => rankCounts[r] === 1)!;
    return { rank: 7, name: HAND_RANK_NAMES[7], values: [quadRank, kicker], cards: hand };
  }
  if (counts[0] === 3 && counts[1] === 2) {
    const threeRank = uniqueRanks.find(r => rankCounts[r] === 3)!;
    const pairRank = uniqueRanks.find(r => rankCounts[r] === 2)!;
    return { rank: 6, name: HAND_RANK_NAMES[6], values: [threeRank, pairRank], cards: hand };
  }
  if (isFlush) return { rank: 5, name: HAND_RANK_NAMES[5], values: ranks, cards: hand };
  if (isStraight) {
      const values = isAceLowStraight ? [5, 4, 3, 2, 1] : uniqueRanks;
      return { rank: 4, name: HAND_RANK_NAMES[4], values, cards: hand };
  }
  if (counts[0] === 3) {
    const threeRank = uniqueRanks.find(r => rankCounts[r] === 3)!;
    return { rank: 3, name: HAND_RANK_NAMES[3], values: getTiebreakerValues([threeRank]), cards: hand };
  }
  if (counts[0] === 2 && counts[1] === 2) {
    const pairRanks = uniqueRanks.filter(r => rankCounts[r] === 2).sort((a, b) => b - a);
    const kicker = uniqueRanks.find(r => rankCounts[r] === 1)!;
    return { rank: 2, name: HAND_RANK_NAMES[2], values: [pairRanks[0], pairRanks[1], kicker], cards: hand };
  }
  if (counts[0] === 2) {
    const pairRank = uniqueRanks.find(r => rankCounts[r] === 2)!;
    return { rank: 1, name: HAND_RANK_NAMES[1], values: getTiebreakerValues([pairRank]), cards: hand };
  }
  return { rank: 0, name: HAND_RANK_NAMES[0], values: ranks, cards: hand };
};

const getCombinations = <T>(array: T[], k: number): T[][] => {
    if (k === 0) return [[]];
    if (array.length < k) return [];
    const first = array[0];
    const rest = array.slice(1);
    const combsWithFirst = getCombinations(rest, k - 1).map(comb => [first, ...comb]);
    const combsWithoutFirst = getCombinations(rest, k);
    return [...combsWithFirst, ...combsWithoutFirst];
};

export const findBestHand = (allSevenCards: Card[]): HandEvaluationResult => {
    const combinations = getCombinations(allSevenCards, 5);
    let bestHandResult: HandEvaluationResult | null = null;
    for (const combo of combinations) {
        const currentResult = evaluateFiveCardHand(combo);
        if (!bestHandResult || compareHands(currentResult, bestHandResult) > 0) {
            bestHandResult = currentResult;
        }
    }
    return bestHandResult!;
};


export const compareHands = (handA: HandEvaluationResult, handB: HandEvaluationResult): number => {
  if (handA.rank > handB.rank) return 1;
  if (handA.rank < handB.rank) return -1;
  
  for (let i = 0; i < handA.values.length; i++) {
    if (handA.values[i] > handB.values[i]) return 1;
    if (handA.values[i] < handB.values[i]) return -1;
  }
  
  return 0; // Tie
};
