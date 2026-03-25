import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ============================================
// DEBOUNCE HOOK - Delays function execution
// ============================================
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================
// SEARCHBAR - Compact with purple sparkle
// ============================================
function SearchBar({ onSearch, onOpenOracle, fullWidth = false }) {
  const [inputValue, setInputValue] = useState('');
  const debouncedValue = useDebounce(inputValue, 400); // 400ms debounce
  const inputRef = useRef(null);

  // Navigate only when debounced value changes
  useEffect(() => {
    if (debouncedValue.trim()) {
      onSearch(debouncedValue);
    }
  }, [debouncedValue, onSearch]);

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        onSearch(inputValue);
        inputRef.current?.blur(); // Close keyboard on mobile
      }
    }
  };

  return (
    <div className={`relative flex items-center ${fullWidth ? 'w-full' : 'w-72'}`}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Search..."
        className={`w-full rounded-full border border-white/10 bg-zinc-900/50 py-2 pl-5 pr-12 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:border-orange-500/50 transition-all`}
      />
      <button
        onClick={(e) => { e.preventDefault(); onOpenOracle(); }}
        className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white transition-all"
        title="Ask the Oracle"
      >
        <span className="text-sm">✨</span>
      </button>
    </div>
  );
}

export default SearchBar;
