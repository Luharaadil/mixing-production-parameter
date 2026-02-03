import React, { useState, useEffect } from 'react';
import { FilterState } from '../types';

interface FilterSectionProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onSearch: () => void;
  onSync: () => void;
  isLoading: boolean;
  availableLots: string[];
}

const FilterSection: React.FC<FilterSectionProps> = ({ 
  filters, 
  onFilterChange, 
  onSearch,
  onSync,
  isLoading,
  availableLots
}) => {
  const [showAllLots, setShowAllLots] = useState(false);
  const LOT_LIMIT = 100;

  const handleToggleLot = (lot: string) => {
    const next = filters.selectedLots.includes(lot)
      ? filters.selectedLots.filter(l => l !== lot)
      : [...filters.selectedLots, lot];
    onFilterChange({ selectedLots: next });
  };

  const selectAll = () => onFilterChange({ selectedLots: [...availableLots] });
  const clearAll = () => onFilterChange({ selectedLots: [] });

  const displayedLots = showAllLots ? availableLots : availableLots.slice(0, LOT_LIMIT);
  const hasMore = availableLots.length > LOT_LIMIT;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 bg-indigo-600 h-full"></div>
      
      {/* Top Controls */}
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

        {/* Search/Apply Button */}
        <div>
          <button
            onClick={onSearch}
            disabled={isLoading}
            className="w-full flex items-center justify-center h-[38px] px-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-100 disabled:opacity-50 text-xs"
          >
            <i className="fa-solid fa-magnifying-glass mr-2"></i>
            Generate Lot List
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
            <i className="fa-solid fa-gear text-indigo-400"></i>
            Machine Identifier
          </label>
          <input
            type="text"
            placeholder="Search machine..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-xs font-medium"
            value={filters.machine}
            onChange={(e) => onFilterChange({ machine: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
            <i className="fa-solid fa-flask text-indigo-400"></i>
            Rubber Name
          </label>
          <input
            type="text"
            placeholder="Search rubber..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-xs font-medium"
            value={filters.rubber}
            onChange={(e) => onFilterChange({ rubber: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
            <i className="fa-solid fa-magnifying-glass text-indigo-400"></i>
            Search Final Lots
          </label>
          <input
            type="text"
            placeholder="Filter visible lots..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-xs font-medium"
            value={filters.lotNumber}
            onChange={(e) => onFilterChange({ lotNumber: e.target.value })}
          />
        </div>
      </div>

      {/* Lot Selection Container */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
            <i className="fa-solid fa-list-check text-indigo-400"></i>
            Available Lots ({availableLots.length})
          </label>
          <div className="flex gap-2">
            <button onClick={selectAll} className="px-2 py-1 text-[9px] font-extrabold uppercase bg-slate-100 hover:bg-slate-200 rounded">Select All</button>
            <button onClick={clearAll} className="px-2 py-1 text-[9px] font-extrabold uppercase bg-slate-100 hover:bg-slate-200 rounded">Clear All</button>
          </div>
        </div>
        
        <div id="lot-checkbox-container" className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-100 rounded-xl bg-slate-50/30">
          {displayedLots.length > 0 ? (
            displayedLots.map(lot => (
              <label key={lot} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${filters.selectedLots.includes(lot) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500'}`}>
                <input type="checkbox" className="hidden" checked={filters.selectedLots.includes(lot)} onChange={() => handleToggleLot(lot)} />
                <span className="truncate">{lot}</span>
              </label>
            ))
          ) : (
            <p className="col-span-full text-[10px] text-slate-400 font-medium italic py-4 text-center">No lots found. Adjust filters and click "Generate Lot List".</p>
          )}
          
          {hasMore && !showAllLots && (
            <button onClick={() => setShowAllLots(true)} className="col-span-full py-2 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-dashed border-indigo-200 mt-2">
              Show {availableLots.length - LOT_LIMIT} More Lots
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterSection;