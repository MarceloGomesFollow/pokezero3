import React from 'react';
import { SPONSORS } from '../constants';

interface LandingPageProps {
  onNavigateToSetup: () => void;
  onManageChampionship: () => void;
}

const testimonials = [
  { name: 'Capitão Zero3', quote: 'A resenha aqui é de outro nível! Poker de qualidade com os amigos e a organização impecável.' },
  { name: 'Farma FC', quote: 'Finalmente um app pra organizar nosso campeonato. O painel de gerenciamento é fácil e funciona perfeitamente.' },
  { name: 'Corinthians', quote: 'A IA joga duro! Ótimo pra treinar umas mãos antes da partida real com a galera.' }
];

const newsItems = [
  { title: 'Grande Final do Torneio', date: 'DEZ 20, 2024', description: 'A grande final do torneio de inverno se aproxima! Preparem suas melhores jogadas.' },
  { title: 'Parceria de Sucesso', date: 'DEZ 15, 2024', description: 'Nova parceria com "O Cartel" traz benefícios exclusivos para membros do clube.' },
  { title: 'Novas Funcionalidades', date: 'DEZ 01, 2024', description: 'Em breve, novas skins de mesa e avatares personalizados para os jogadores.' }
];

const LandingCard: React.FC<{ title: string; description: string; buttonText: string; onClick: () => void; icon: JSX.Element }> = ({ title, description, buttonText, onClick, icon }) => (
  <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-md border-2 border-yellow-400/30 flex flex-col items-center text-center transform hover:scale-105 hover:border-yellow-400 transition-all duration-300 animate-fadeInUp" style={{ animationDelay: '300ms' }}>
    <div className="text-6xl text-yellow-300 mb-4">{icon}</div>
    <h2 className="text-3xl font-bold text-white mb-3">{title}</h2>
    <p className="text-gray-300 mb-8 flex-grow">{description}</p>
    <button
      onClick={onClick}
      className="w-full py-3 px-4 rounded-md shadow-lg text-lg font-bold text-gray-900 bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 focus:ring-offset-gray-800 transition-all"
    >
      {buttonText}
    </button>
  </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToSetup, onManageChampionship }) => {
  return (
    <div className="min-h-screen w-full bg-gray-900 text-white overflow-x-hidden">
      
      {/* Hero Section */}
      <header 
        className="relative flex flex-col items-center justify-center h-screen p-4 text-center bg-cover bg-center" 
        style={{backgroundImage: `linear-gradient(to top, #111827 5%, transparent 50%), linear-gradient(rgba(17, 24, 39, 0.6), rgba(17, 24, 39, 0.8)), url('https://images.unsplash.com/photo-1579952363873-27f3bade9f55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxfDB8MXxyYW5kb218MHx8c29jY2VyfHx8fHx8MTcxODI0NDc5NQ&ixlib=rb-4.0.3&q=80&w=1080')`}}>
        <div className="animate-fadeInUp">
          <h1 className="text-5xl sm:text-7xl font-black text-white drop-shadow-lg uppercase">PokerZero3</h1>
          <h2 className="text-4xl sm:text-6xl font-black text-yellow-400 drop-shadow-lg uppercase">Futebol Clube</h2>
          <p className="text-gray-200 mt-4 max-w-2xl mx-auto text-lg sm:text-xl">A arena definitiva onde a tática do futebol encontra a estratégia do Texas Hold'em.</p>
        </div>
        <div className="absolute bottom-10 text-white animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </div>
      </header>

      <main className="py-16 sm:py-24 px-4">
      
        {/* CTA Section */}
        <section className="container mx-auto flex flex-col md:flex-row items-stretch justify-center gap-8 -mt-48 z-10 relative">
            <LandingCard
              title="Poker Online"
              description="Desafie a inteligência artificial em um torneio de poker Texas Hold'em e mostre quem manda na mesa."
              buttonText="Jogar Agora"
              onClick={onNavigateToSetup}
              icon={<span role="img" aria-label="playing cards">🃏</span>}
            />
            <LandingCard
              title="Gerenciar Campeonato"
              description="Organize e administre um torneio de poker real com seus amigos. Acesso restrito ao administrador."
              buttonText="Acessar Painel"
              onClick={onManageChampionship}
              icon={<span role="img" aria-label="trophy">🏆</span>}
            />
        </section>

        {/* Sponsor Section */}
        <section className="mt-20 sm:mt-24">
            <h3 className="text-center text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Patrocinadores Oficiais</h3>
            <div className="w-full max-w-6xl mx-auto bg-black/30 rounded-md shadow-lg overflow-hidden border border-gray-700 h-16 flex items-center">
              <div className="flex animate-scroll whitespace-nowrap">
                  {[...SPONSORS, ...SPONSORS, ...SPONSORS].map((sponsor, index) => (
                      <div key={index} className="flex items-center mx-8">
                          <span className="text-xl sm:text-2xl font-black uppercase tracking-wide text-cyan-300" style={{ textShadow: '0 0 4px #22d3ee, 0 0 8px #22d3ee' }}>
                              {sponsor}
                          </span>
                      </div>
                  ))}
              </div>
            </div>
        </section>

        {/* Gallery & News Section */}
        <section className="container mx-auto mt-20 sm:mt-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="h-96 rounded-lg shadow-2xl bg-cover bg-center animate-image-fade border-4 border-yellow-400/30">
                {/* CSS animation handles the images */}
            </div>
            <div className="space-y-6">
                <h2 className="text-3xl sm:text-4xl font-black text-white">Últimas do Clube</h2>
                {newsItems.map((item, index) => (
                    <div key={index} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <p className="text-xs text-yellow-400 font-semibold">{item.date}</p>
                        <h4 className="text-xl font-bold text-white mt-1">{item.title}</h4>
                        <p className="text-gray-400 mt-1">{item.description}</p>
                    </div>
                ))}
            </div>
        </section>
        
        {/* Testimonials Section */}
        <section className="container mx-auto mt-20 sm:mt-24">
            <h2 className="text-3xl sm:text-4xl font-black text-white text-center mb-10">O Que a Galera Diz</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map((item, index) => (
                    <div key={index} className="bg-green-800/30 p-6 rounded-lg border border-green-600/50 text-center">
                        <p className="text-gray-200 italic">"{item.quote}"</p>
                        <p className="text-yellow-400 font-bold mt-4">- {item.name}</p>
                    </div>
                ))}
            </div>
        </section>
      
      </main>

      <footer className="w-full bg-black/50 text-center text-xs text-gray-400 p-4">
        Follow Labs - Digital Solutions - Cortesia de <a href="https://followadvisor.com" target="_blank" rel="noopener noreferrer" className="font-bold text-yellow-300 hover:underline">Followadvisor.com</a>
      </footer>
    </div>
  );
};

export default LandingPage;