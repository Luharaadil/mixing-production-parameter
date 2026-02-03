
import React, { useState, useEffect, useCallback } from 'react';
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
    rubber: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [rawSourceData, setRawSourceData] = useState<RawProductionRow[]>([]);
  const [groupedData, setGroupedData] = useState<GroupedBatch[]>([]);
  const [error, setError] = useState<{ message: string; sub: string } | null>(null);
  const [showLimitWarning, setShowLimitWarning] = useState(false);

  const handleFetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, isMock } = await fetchProductionData();
      setRawSourceData(data);
      setIsUsingMockData(isMock);
      
      if (isMock) {
        setError({
          message: "Simulation Active",
          sub: "Using internal performance-testing dataset. Production Cloud connection pending."
        });
      }
    } catch (err: any) {
      setError({
        message: "Fetch Failure",
        sub: err.message || "Failed to load data."
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (rawSourceData.length === 0) return;

    console.time('filter_and_group_pipeline');
    
    // 1. Pre-filter Raw Data (Performance Optimization)
    const start = filters.startDate ? new Date(filters.startDate) : null;
    if (start) start.setHours(0, 0, 0, 0);
    const end = filters.endDate ? new Date(filters.endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    const filteredRaw = rawSourceData.filter(row => {
      const rowDate = new Date(row.date);
      const dateMatch = (!start || rowDate >= start) && (!end || rowDate <= end);
      const machineMatch = !filters.machine || String(row.machine || '').toLowerCase().includes(filters.machine.toLowerCase());
      const rubberMatch = !filters.rubber || String(row.rubber || '').toLowerCase().includes(filters.rubber.toLowerCase());
      
      return dateMatch && machineMatch && rubberMatch;
    });

    // 2. Group Pre-filtered Data
    const processed = processBatchData(filteredRaw);

    // 3. Post-filter by Lot (remaining text search)
    const finalResult = processed.filter(batch => {
      const lotMatch = !filters.lotNumber || String(batch.lotNumber || '').toLowerCase().includes(filters.lotNumber.toLowerCase());
      return lotMatch;
    });

    // 4. Check display limit
    setShowLimitWarning(finalResult.length > ROW_DISPLAY_LIMIT);
    setGroupedData(finalResult.slice(0, ROW_DISPLAY_LIMIT));
    
    console.timeEnd('filter_and_group_pipeline');
  }, [rawSourceData, filters.startDate, filters.endDate, filters.machine, filters.lotNumber, filters.rubber]);

  useEffect(() => {
    handleFetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 w-full">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 shadow-sm w-full">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-100">
              <i className="fa-solid fa-microchip"></i>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Mixing Production Parameters</h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">MAXXIS RUBBER INDIA</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-xs font-bold uppercase tracking-wider ${isUsingMockData ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${isUsingMockData ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`}></span>
              {isUsingMockData ? 'Performance Test Mode' : 'Connected'}
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-6 pt-8">
        {error && (
          <div className="mb-8 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isUsingMockData ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
              <i className="fa-solid fa-bolt-lightning text-xl"></i>
            </div>
            <div className="flex-1 pt-1">
              <p className="font-bold text-slate-900">{error.message}</p>
              <p className="text-sm text-slate-500 font-medium mt-0.5">{error.sub}</p>
            </div>
          </div>
        )}

        {showLimitWarning && (
          <div className="mb-4 px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation"></i>
            Broad search detected. Displaying limited dataset for browser performance.
          </div>
        )}

        <FilterSection 
          filters={filters} 
          onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))} 
          onSearch={handleFetchData}
          isLoading={isLoading}
        />

        <StatsOverview data={groupedData} />
        <ProductionTable data={groupedData} />
      </main>
    </div>
  );
};

export default App;
