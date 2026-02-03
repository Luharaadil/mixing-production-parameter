
import React from 'react';
import { FilterState, MachineType } from '../types';

interface FilterSectionProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onSearch: () => void;
  isLoading: boolean;
}

const FilterSection: React.FC<FilterSectionProps> = ({ 
  filters, 
  onFilterChange, 
  onSearch,
  isLoading 
}) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 bg-indigo-600 h-full"></div>
      
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <i className="fa-solid fa-sliders text-indigo-500"></i>
          Search & Filter Controls
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 items-end">
        {/* Start Date */}
        <div className="space-y-1.5 lg:col-span-1">
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
        <div className="space-y-1.5 lg:col-span-1">
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

        {/* Machine Selection */}
        <div className="space-y-1.5 lg:col-span-1">
          <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
            <i className="fa-solid fa-gear text-indigo-400"></i>
            Machine
          </label>
          <div className="relative">
            <select
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none text-xs font-medium cursor-pointer"
              value={filters.machine}
              onChange={(e) => onFilterChange({ machine: e.target.value })}
            >
              <option value="">All Types</option>
              <option value={MachineType.MIXER}>Mixers</option>
              <option value={MachineType.PREPARATION}>Prep Machines</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <i className="fa-solid fa-chevron-down text-[10px]"></i>
            </div>
          </div>
        </div>

        {/* Lot Number */}
        <div className="space-y-1.5 lg:col-span-1">
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
        <div className="space-y-1.5 lg:col-span-1">
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

        {/* Search Button */}
        <div className="lg:col-span-1">
          <button
            onClick={onSearch}
            disabled={isLoading}
            className="w-full flex items-center justify-center h-[38px] px-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          >
            {isLoading ? (
              <i className="fa-solid fa-circle-notch fa-spin"></i>
            ) : (
              <>
                <i className="fa-solid fa-magnifying-glass mr-2"></i>
                Search
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterSection;
