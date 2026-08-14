import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select Option',
  className = '',
  disabled = false,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Find active option label
  const selectedOption = options.find(opt => opt.value === value);

  // Filter options based on query
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear query on close
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelectOption = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      
      {/* Selector Trigger Input Button */}
      <div
        onClick={handleToggle}
        className={`w-full flex items-center justify-between bg-slate-50 border rounded-xl px-3 py-2 text-xs font-bold text-slate-900 shadow-xs cursor-pointer transition-all duration-150 ${
          disabled 
            ? 'opacity-65 cursor-not-allowed bg-slate-100 border-slate-200' 
            : isOpen 
              ? 'border-indigo-500 ring-2 ring-indigo-500/10 bg-white' 
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-100/50'
        }`}
      >
        <span className={`truncate ${!selectedOption ? 'text-slate-400 font-medium' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180 text-indigo-500' : ''}`} />
      </div>

      {/* Expanded Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150 max-h-60 flex flex-col">
          
          {/* Inner Search Box */}
          <div className="relative flex-shrink-0">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-950 font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-sans"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options List */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1 max-h-40 min-h-0">
            {filteredOptions.length === 0 ? (
              <div className="py-2.5 px-3 text-[11px] text-slate-400 font-medium font-sans">
                No matching results.
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelectOption(opt.value)}
                    className={`py-2 px-3 hover:bg-indigo-50/50 hover:text-indigo-900 rounded-xl cursor-pointer text-xs font-bold transition-all duration-100 flex items-center justify-between ${
                      isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 flex-shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
