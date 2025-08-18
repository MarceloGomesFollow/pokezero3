import { Rank, Suit } from './types';

export const SUITS: Suit[] = ['♥', '♦', '♣', '♠'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

export const HAND_RANK_NAMES: string[] = [
    "Carta Alta", 
    "Um Par", 
    "Dois Pares", 
    "Trinca", 
    "Sequência (Straight)", 
    "Flush", 
    "Full House", 
    "Quadra (Four of a Kind)", 
    "Straight Flush", 
    "Royal Flush"
];

export const FOOTBALL_TIPS: string[] = [
    "No poker, como no futebol, um bom blefe pode virar o jogo! Drible o oponente com uma cara de poker imbatível.",
    "Mantenha sua 'poker face', assim como um goleiro em disputa de pênaltis. Nunca deixe eles saberem sua mão.",
    "Uma Sequência (Straight) é como um contra-ataque letal: imparável! Foque em conectar as cartas.",
    "Um Flush é como um time todo jogando de uniforme novo: unido e forte. Busque naipes iguais para vencer.",
    "Não aposte tudo em uma mão fraca – é como chutar de longe sem mira. Paciência ganha campeonatos.",
    "Um Full House é o hat-trick do poker: três de um, dois de outro. É gol de placa!",
    "Saber a hora de desistir (Fold) é como uma defesa sólida no futebol – evita tomar gols e preserva suas fichas para a próxima jogada."
];

export const AI_COMMENTS = {
  GREETING: [
    "Prepare-se, a bola vai rolar!",
    "Hoje a sorte tá do meu lado.",
    "Que comecem os jogos!",
    "Vamos ver quem tem a melhor tática.",
    "Cade o Zero3?",
    "Cade o Farma?",
    "Ninguém toma mais vinho aqui?",
    "Dr cade você? Bora farma!",
    "Agora é a rezenha do Zero3",
    "Cade o Vinho ?Bora?",
    "Esposa liberou to chegando no espaço zero3",
  ],
  BET: [
    "Vou apostar alto, igual final de campeonato!",
    "Isso aqui é pra ver quem tem coragem.",
    "Sentiu a pressão?",
    "Pode vir, tô confiante na minha zaga.",
    "Minhas cartas estão pesadas!",
    "Vai capita!",
    "E ai parceiro, arregou?",
    "Esse aí é arregão.",
    "All in sem olhar as cartas",
    "Esse flop veio mais redondo que a bola da final!",
  ],
  CHECK: [
    "Vou só observar por enquanto...",
    "Calma, o jogo tá só começando.",
    "Deixando a bola rolar.",
    "Passo a vez, estudando o adversário.",
    "Traz um Cookies da Karmel para mim?",
    "Manda aquela esfirra da Casa Bauci para mim",
  ],
  FOLD: [
    "Essa mão tá mais furada que peneira. Tô fora!",
    "Recuar pra atacar depois. Faz parte da tática.",
    "Melhor não arriscar um gol contra.",
    "Essas cartas não valem o ingresso. Desisto.",
    "Tá sem cartas, hein? Vou deixar essa passar.",
    "Vou embora para o Espaço Zero3, pra mim acabou.",
    "Bora já deu, vou pegar uma massa no Pecorino",
    "Não consigo acompanhar a resenha",
  ],
  WIN: [
    "GOOOOL! Chupa essa!",
    "É disso que eu tô falando! Vitória!",
    "Fácil demais, parecia treino.",
    "O troféu é nosso!",
    "Serviço completo barba, cabelo e bigode, só no Cartel",
    "Juiz, pode acabar o jogo!",
  ],
   ELIMINATED: [
    "Fui pro chuveiro mais cedo...",
    "Não deu pra mim. Na próxima tem mais.",
    "Expulso de campo! 🟥",
    "Acabou o campeonato pra mim."
  ]
};

export const DEFAULT_AI_NAMES = ['Corinthians', 'Palmeiras', 'São Paulo', 'Flamengo', 'Vasco'];


export const STARTING_STACK = 1500;
export const SMALL_BLIND = 10;
export const BIG_BLIND = 20;

export const SPONSORS: string[] = [
    "Espaço Zero3",
    "FollowAdvisor",
    "Pecorino",
    "Farma",
    "Casa Bauci",
    "Karmel Cookies",
    "O Cartel"
];