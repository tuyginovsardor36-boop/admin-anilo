
import React from 'react';

const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
);

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


const Hero: React.FC = () => {
  return (
    <section className="relative h-[80vh] min-h-[500px] flex items-center">
      <div className="absolute inset-0">
        <img
          src="https://picsum.photos/seed/hero-bg/1920/1080"
          alt="Featured Content"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#040714] via-[#040714]/70 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#040714] via-transparent to-transparent"></div>
      </div>
      <div className="relative z-10 container mx-auto px-4 md:px-10 lg:px-16 w-full md:w-1/2 lg:w-2/5">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4">
          House of the Dragon
        </h1>
        <p className="text-gray-300 text-md md:text-lg mb-6 leading-relaxed">
          The reign of House Targaryen begins. This new series, set 200 years before the events of Game of Thrones, is based on George R.R. Martin’s “Fire & Blood.”
        </p>
        <div className="flex items-center space-x-4">
          <button className="flex items-center justify-center bg-white text-black font-bold py-3 px-6 rounded-full hover:bg-gray-200 transition-colors duration-300 text-lg">
            <PlayIcon />
            <span>Play</span>
          </button>
          <button className="flex items-center justify-center bg-gray-700/60 text-white font-bold py-3 px-6 rounded-full hover:bg-gray-600/80 transition-colors duration-300 backdrop-blur-sm text-lg">
            <InfoIcon />
            <span>More Info</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
