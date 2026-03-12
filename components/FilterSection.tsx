import React, { useState, useRef, useEffect } from 'react';
import { FilterState } from '../types';

interface FilterSectionProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onSearch: () => void;
  onSync: () => void;
  isLoading: boolean;
  availableMachines: string[];
  availableRubbers: string[];
}

const MultiSelectDropdown: React.FC<{
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
}> = ({ options, selected, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all text-xs font-medium cursor-pointer flex justify-between items-center min-h-[38px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate pr-2 text-slate-700">
          {selected.length === 0 
            ? placeholder 
            : selected.length === 1 
              ? selected[0] 
              : `${selected.length} selected`}
        </span>
        <i className={`fa-solid fa-chevron-down text-slate-400 text-[10px] transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto py-1">
          {options.length === 0 && selected.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-500 italic">No options available</div>
          ) : (
            Array.from(new Set([...selected, ...options])).map(option => (
              <label key={option} className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                  checked={selected.includes(option)}
                  onChange={() => toggleOption(option)}
                />
                <span className={`text-xs truncate ${!options.includes(option) ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                  {option}
                </span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const FilterSection: React.FC<FilterSectionProps> = ({ 
  filters, 
  onFilterChange, 
  onSearch,
  onSync,
  isLoading,
  availableMachines,
  availableRubbers
}) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 bg-indigo-600 h-full"></div>
      
      {/* Primary Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 items-end">
        {/* Start Date */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
            <i className="fa-solid fa-calendar text-indigo-400"></i>
            Start Date
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-xs font-medium"
            value={filters.startDate}
            onChange={(e) => onFilterChange({ startDate: e.target.value })}
          />
        </div>

        {/* End Date */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
            <i className="fa-solid fa-calendar-check text-indigo-400"></i>
            End Date
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-xs font-medium"
            value={filters.endDate}
            onChange={(e) => onFilterChange({ endDate: e.target.value })}
          />
        </div>

        {/* Search Button */}
        <div>
          <button
            onClick={onSearch}
            disabled={isLoading}
            className="w-full flex items-center justify-center h-[38px] px-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-100 disabled:opacity-50 text-xs"
          >
            <i className="fa-solid fa-magnifying-glass mr-2"></i>
            Apply Filters
          </button>
        </div>

        {/* Sync Button */}
        <div>
          <button
            onClick={onSync}
            disabled={isLoading}
            className="w-full flex items-center justify-center h-[38px] px-6 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 active:scale-[0.98] transition-all shadow-md shadow-slate-100 disabled:opacity-50 text-xs"
          >
            {isLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <><i className="fa-solid fa-rotate mr-2"></i>Sync Cloud</>}
          </button>
        </div>
      </div>

      {/* Secondary Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
            <i className="fa-solid fa-gear text-indigo-400"></i>
            Machine Identifier
          </label>
          <MultiSelectDropdown
            options={availableMachines}
            selected={filters.machine}
            onChange={(selected) => onFilterChange({ machine: selected })}
            placeholder="All Machines"
          />
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
            <i className="fa-solid fa-flask text-indigo-400"></i>
            Rubber Name
          </label>
          <MultiSelectDropdown
            options={availableRubbers}
            selected={filters.rubber}
            onChange={(selected) => onFilterChange({ rubber: selected })}
            placeholder="All Rubbers"
          />
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
            <i className="fa-solid fa-hashtag text-indigo-400"></i>
            Lot #
          </label>
          <input
            type="text"
            placeholder="Search lot number..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-xs font-medium"
            value={filters.lotNumber}
            onChange={(e) => onFilterChange({ lotNumber: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};

export default FilterSection;