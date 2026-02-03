
import React from 'react';
import { FilterState } from '../types';

interface FilterSectionProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onSearch: () => void;
  isLoading: boolean;
  availableBatches: string[];
}

const FilterSection: React.FC<FilterSectionProps> = ({ 
  filters, 
  onFilterChange, 
  onSearch,
  isLoading,
  availableBatches
}) => {
  const handleToggleBatch = (batch: string) => {
    const next = filters.selectedBatches.includes(batch)
      ? filters.selectedBatches.filter(b => b !== batch)
      : [...filters.selectedBatches, batch];
    onFilterChange({ selectedBatches: next });
  };

  const selectAll = () => onFilterChange({ selectedBatches: [...availableBatches] });
  const selectNone = () => onFilterChange({ selectedBatches: [] });

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 bg-indigo-600 h-full"></div>
      
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <i className="fa-solid fa-sliders text-indigo-500"></i>
          Search & Filter Controls
        </h3>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onSearch}
            disabled={isLoading}
            className="flex items-center justify-center h-[38px] px-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          >
            {isLoading ? (
              <i className="fa-solid fa-circle-notch fa-spin"></i>
            ) : (
              <>
                <i className="fa-solid fa-rotate mr-2"></i>
                Sync Data
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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

        {/* Machine Name (Text Input) */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
            <i className="fa-solid fa-gear text-indigo-400"></i>
            Machine Name
          </label>
          <input
            type="text"
            placeholder="Search Machine..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-xs font-medium"
            value={filters.machine}
            onChange={(e) => onFilterChange({ machine: e.target.value })}
          />
        </div>

        {/* Lot Number */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
            <i className="fa-solid fa-hashtag text-indigo-400"></i>
            Lot Number
          </label>
          <input
            type="text"
            placeholder="Search Lot..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-xs font-medium"
            value={filters.lotNumber}
            onChange={(e) => onFilterChange({ lotNumber: e.target.value })}
          />
        </div>

        {/* Rubber Name */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
            <i className="fa-solid fa-flask text-indigo-400"></i>
            Rubber Name
          </label>
          <input
            type="text"
            placeholder="Search Rubber..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-xs font-medium"
            value={filters.rubber}
            onChange={(e) => onFilterChange({ rubber: e.target.value })}
          />
        </div>
      </div>

      {/* Batch Selection Checkboxes */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
            <i className="fa-solid fa-list-check text-indigo-400"></i>
            Batch Selection
          </label>
          <div className="flex gap-2">
            <button 
              onClick={selectAll}
              className="px-2 py-1 text-[9px] font-extrabold uppercase bg-slate-100 text-slate-600 hover:bg-slate-200 rounded transition-colors"
            >
              Select All
            </button>
            <button 
              onClick={selectNone}
              className="px-2 py-1 text-[9px] font-extrabold uppercase bg-slate-100 text-slate-600 hover:bg-slate-200 rounded transition-colors"
            >
              Select None
            </button>
          </div>
        </div>
        <div id="batch-checkbox-container" className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-2 max-h-32 overflow-y-auto p-1">
          {availableBatches.length > 0 ? (
            availableBatches.map(batch => (
              <label 
                key={batch} 
                className={`flex items-center justify-center px-2 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                  filters.selectedBatches.includes(batch)
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={filters.selectedBatches.includes(batch)}
                  onChange={() => handleToggleBatch(batch)}
                />
                {batch}
              </label>
            ))
          ) : (
            <p className="col-span-full text-[10px] text-slate-400 font-medium italic">No batches available for selected criteria</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterSection;
