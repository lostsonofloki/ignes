import React from 'react';

const SearchBar = ({ onSearch, onOpenOracle }) => {
  console.log('--- SEARCHBAR RENDERED ---');
  
  return (
    <div className="relative flex w-full max-w-sm items-center group">
      <input
        type="text"
        placeholder="Search your library..."
        onChange={(e) => onSearch(e.target.value)}
        className="w-full rounded-full border border-white/10 bg-zinc-900/50 py-2 pl-4 pr-12 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
      />
      
      {/* THE ORACLE SPARKLE ✨ - BRIGHT PURPLE */}
      <button
        onClick={(e) => {
          e.preventDefault();
          onOpenOracle();
        }}
        className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-purple-200 hover:bg-purple-500 hover:text-white transition-all shadow-lg shadow-purple-500/30"
      >
        <span className="text-sm">✨</span>
      </button>
    </div>
  );
};

export default SearchBar;
