import React, { useState, useEffect, useMemo, useCallback } from 'react';
import FilterSection from './components/FilterSection';
import ProductionTable from './components/ProductionTable';
import StatsOverview from './components/StatsOverview';
import { fetchProductionData, processBatchData } from './services/dataService';
import { FilterState, GroupedBatch, RawProductionRow } from './types';

const ROW_DISPLAY_LIMIT = 500;

const App: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    machine: '',
    lotNumber: '',
    rubber: '',
    selectedLots: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [rawSourceData, setRawSourceData] = useState<RawProductionRow[]>([]);
  const [searchFilteredData, setSearchFilteredData] = useState<RawProductionRow[]>([]);
  const [groupedData, setGroupedData] = useState<GroupedBatch[]>([]);
  const [error, setError] = useState<{ message: string; sub: string } | null>(null);
  const [showLimitWarning, setShowLimitWarning] = useState(false);

  // Derive available lots only from the search results pool
  const availableLots = useMemo(() => {
    try {
      const lots = Array.from(new Set(searchFilteredData.map(r => r.lotNumber)))
        .filter(l => l && l.trim() !== '')
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
      return lots;
    } catch (e) {
      console.error("Lot extraction failed", e);
      return [];
    }
  }, [searchFilteredData]);

  const handleSearch = useCallback((dataToFilter?: RawProductionRow[]) => {
    const source = dataToFilter || rawSourceData;
    if (source.length === 0) return;

    try {
      console.log("Applying primary filters (Date, Machine, Rubber)...");
      const start = filters.startDate ? new Date(filters.startDate) : null;
      if (start) start.setHours(0, 0, 0, 0);
      const end = filters.endDate ? new Date(filters.endDate) : null;
      if (end) end.setHours(23, 59, 59, 999);

      const filtered = source.filter(row => {
        const rowDate = new Date(row.date);
        const dateMatch = (!start || rowDate >= start) && (!end || rowDate <= end);
        const machineMatch = !filters.machine || 
          String(row.machine || '').toLowerCase().includes(filters.machine.toLowerCase());
        const rubberMatch = !filters.rubber || 
          String(row.rubber || '').toLowerCase().includes(filters.rubber.toLowerCase());
        
        return dateMatch && machineMatch && rubberMatch;
      });

      setSearchFilteredData(filtered);
      
      // Auto-select all lots from this new filtered set
      const newLots = Array.from(new Set(filtered.map(r => r.lotNumber))).filter(l => l && l.trim() !== '');
      setFilters(prev => ({ ...prev, selectedLots: newLots }));
    } catch (err) {
      console.error("Search processing error", err);
    }
  }, [rawSourceData, filters.startDate, filters.endDate, filters.machine, filters.rubber]);

  const handleFetchData = async () => {
    console.log("Start fetch");
    setIsLoading(true);
    setError(null);
    try {
      const { data, isMock } = await fetchProductionData();
      console.log("Data received. Rows:", data.length);
      setRawSourceData(data);
      setIsUsingMockData(isMock);
      
      if (isMock) {
        setError({
          message: "Simulation Active",
          sub: "Cloud connection failed. Using internal performance-testing dataset."
        });
      }

      // Automatically trigger search on first successful fetch
      handleSearch(data);

    } catch (err: any) {
      console.error("Fetch Failure:", err);
      setError({
        message: "Network Failure",
        sub: err.message || "Unable to reach production servers."
      });
      // Ensure loader is hidden even on error
      const loader = document.getElementById('global-loading');
      if (loader) loader.style.display = 'none';
      setIsLoading(false);
    }
  };

  // Final rendering logic triggered when selected lots or search filtered data changes
  useEffect(() => {
    try {
      if (searchFilteredData.length === 0 && rawSourceData.length > 0) {
        // No matches found for primary filters
        setGroupedData([]);
        setIsLoading(false);
        const loader = document.getElementById('global-loading');
        if (loader) loader.style.display = 'none';
        return;
      }

      if (rawSourceData.length === 0) return;

      console.log("Rendering table...");
      
      const finalFiltered = searchFilteredData.filter(row => {
        return filters.selectedLots.length === 0 || filters.selectedLots.includes(row.lotNumber);
      });

      const processed = processBatchData(finalFiltered);

      const finalResult = processed.filter(batch => {
        const lotTextMatch = !filters.lotNumber || 
          String(batch.lotNumber || '').toLowerCase().includes(filters.lotNumber.toLowerCase());
        return lotTextMatch;
      });

      setShowLimitWarning(finalResult.length > ROW_DISPLAY_LIMIT);
      setGroupedData(finalResult.slice(0, ROW_DISPLAY_LIMIT));
      
      // Successfully rendered
      const loader = document.getElementById('global-loading');
      if (loader) loader.style.display = 'none';
      setIsLoading(false);

    } catch (err: any) {
      console.error("Final Processing Error:", err);
      setError({
        message: "Processing Error",
        sub: "An error occurred during final data assembly."
      });
      const loader = document.getElementById('global-loading');
      if (loader) loader.style.display = 'none';
      setIsLoading(false);
    }
  }, [searchFilteredData, filters.selectedLots, filters.lotNumber]);

  useEffect(() => {
    handleFetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 w-full">
      {isLoading && rawSourceData.length > 0 && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-[2px] z-[100] flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-bold text-[10px] uppercase tracking-widest">Updating Dashboard...</p>
        </div>
      )}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 shadow-sm w-full">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-100">
              <i className="fa-solid fa-industry"></i>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Production Monitoring Dashboard</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Maxxis Rubber India • Parameter Tracking</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-wider ${isUsingMockData ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${isUsingMockData ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`}></span>
              {isUsingMockData ? 'Simulation Mode' : 'Cloud Connected'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 pt-8">
        {error && (
          <div className="mb-8 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isUsingMockData ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
              <i className="fa-solid fa-triangle-exclamation text-xl"></i>
            </div>
            <div className="flex-1 pt-1">
              <p className="font-bold text-slate-900">{error.message}</p>
              <p className="text-sm text-slate-500 font-medium mt-0.5">{error.sub}</p>
            </div>
          </div>
        )}

        {showLimitWarning && (
          <div className="mb-4 px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl text-[10px] font-bold flex items-center gap-2">
            <i className="fa-solid fa-bolt"></i>
            Large Dataset: Displaying top {ROW_DISPLAY_LIMIT} records for stability.
          </div>
        )}

        <FilterSection 
          filters={filters} 
          onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))} 
          onSearch={() => handleSearch()}
          onSync={handleFetchData}
          isLoading={isLoading}
          availableLots={availableLots}
        />

        {filters.selectedLots.length > 0 || isLoading ? (
          <>
            <StatsOverview data={groupedData} />
            <ProductionTable data={groupedData} />
          </>
        ) : (
          <div className="bg-white p-16 rounded-2xl border border-dashed border-slate-300 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
              <i className="fa-solid fa-check-double text-2xl"></i>
            </div>
            <h3 className="text-slate-900 font-bold">No Lots Selected</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">Please apply filters and select lot numbers to visualize production data.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;