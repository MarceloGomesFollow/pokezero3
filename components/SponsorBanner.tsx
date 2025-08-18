
import React from 'react';
import { SPONSORS } from '../constants';

const SponsorBanner: React.FC = () => {
    // Duplica a lista de patrocinadores para criar um efeito de loop infinito e suave
    const displaySponsors = [...SPONSORS, ...SPONSORS, ...SPONSORS];

    return (
        <div className="w-full max-w-3xl mx-auto bg-black/80 rounded-md shadow-lg my-2 overflow-hidden border border-gray-700 h-8 sm:h-10 flex items-center">
            <div className="flex animate-scroll whitespace-nowrap">
                {displaySponsors.map((sponsor, index) => (
                    <div key={index} className="flex items-center mx-6">
                        <span className="text-base sm:text-lg font-black uppercase tracking-wide text-cyan-300" style={{ textShadow: '0 0 4px #22d3ee, 0 0 8px #22d3ee' }}>
                            {sponsor}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SponsorBanner;