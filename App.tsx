import React, { useState, useEffect, useCallback, useMemo } from 'react';
import FilterSection from './components/FilterSection';
import ProductionTable from './components/ProductionTable';
import StatsOverview from './components/StatsOverview';
import { fetchProductionData, processBatchData } from './services/dataService';
import { FilterState, GroupedBatch, RawProductionRow } from './types';

const App: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    machine: [],
    rubber: [],
    lotNumber: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [rawSourceData, setRawSourceData] = useState<RawProductionRow[]>([]);
  const [groupedData, setGroupedData] = useState<GroupedBatch[]>([]);
  const [error, setError] = useState<{ message: string; sub: string } | null>(null);

  const availableMachines = useMemo(() => {
    const start = filters.startDate ? new Date(filters.startDate) : null;
    if (start) start.setHours(0, 0, 0, 0);
    const end = filters.endDate ? new Date(filters.endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    const filtered = rawSourceData.filter(row => {
      const rowDate = new Date(row.date);
      const dateMatch = (!start || rowDate >= start) && (!end || rowDate <= end);
      const rubberMatch = filters.rubber.length === 0 || filters.rubber.includes(String(row.rubber || ''));
      return dateMatch && rubberMatch;
    });
    return Array.from(new Set(filtered.map(r => r.machine).filter(Boolean))).sort();
  }, [rawSourceData, filters.startDate, filters.endDate, filters.rubber]);

  const availableRubbers = useMemo(() => {
    const start = filters.startDate ? new Date(filters.startDate) : null;
    if (start) start.setHours(0, 0, 0, 0);
    const end = filters.endDate ? new Date(filters.endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    const filtered = rawSourceData.filter(row => {
      const rowDate = new Date(row.date);
      const dateMatch = (!start || rowDate >= start) && (!end || rowDate <= end);
      const machineMatch = filters.machine.length === 0 || filters.machine.includes(String(row.machine || ''));
      return dateMatch && machineMatch;
    });
    return Array.from(new Set(filtered.map(r => r.rubber).filter(Boolean))).sort();
  }, [rawSourceData, filters.startDate, filters.endDate, filters.machine]);

  useEffect(() => {
    if (filters.machine.length > 0) {
      const validMachines = filters.machine.filter(m => availableMachines.includes(m));
      if (validMachines.length !== filters.machine.length) {
        setFilters(prev => ({ ...prev, machine: validMachines }));
      }
    }
  }, [availableMachines, filters.machine]);

  useEffect(() => {
    if (filters.rubber.length > 0) {
      const validRubbers = filters.rubber.filter(r => availableRubbers.includes(r));
      if (validRubbers.length !== filters.rubber.length) {
        setFilters(prev => ({ ...prev, rubber: validRubbers }));
      }
    }
  }, [availableRubbers, filters.rubber]);

  const applyFilters = useCallback((dataToFilter?: RawProductionRow[]) => {
    const source = dataToFilter || rawSourceData;
    if (source.length === 0) {
      setGroupedData([]);
      const loader = document.getElementById('global-loading');
      if (loader) loader.style.display = 'none';
      setIsLoading(false);
      return;
    }

    try {
      console.log("Applying filters (Date, Machine, Rubber, Lot)...");
      const start = filters.startDate ? new Date(filters.startDate) : null;
      if (start) start.setHours(0, 0, 0, 0);
      const end = filters.endDate ? new Date(filters.endDate) : null;
      if (end) end.setHours(23, 59, 59, 999);

      const filtered = source.filter(row => {
        const rowDate = new Date(row.date);
        const dateMatch = (!start || rowDate >= start) && (!end || rowDate <= end);
        const machineMatch = filters.machine.length === 0 || 
          filters.machine.includes(String(row.machine || ''));
        const rubberMatch = filters.rubber.length === 0 || 
          filters.rubber.includes(String(row.rubber || ''));
        const lotMatch = !filters.lotNumber ||
          String(row.lotNumber || '').toLowerCase().includes(filters.lotNumber.toLowerCase());
        
        return dateMatch && machineMatch && rubberMatch && lotMatch;
      });

      console.log("Processing filtered records: ", filtered.length);
      const processed = processBatchData(filtered);
      
      setGroupedData(processed);
      
      // Successfully rendered
      const loader = document.getElementById('global-loading');
      if (loader) loader.style.display = 'none';
      setIsLoading(false);
    } catch (err) {
      console.error("Processing error", err);
      setError({
        message: "Processing Error",
        sub: "An error occurred during data assembly."
      });
      const loader = document.getElementById('global-loading');
      if (loader) loader.style.display = 'none';
      setIsLoading(false);
    }
  }, [rawSourceData, filters.startDate, filters.endDate, filters.machine, filters.rubber, filters.lotNumber]);

  const handleFetchData = async () => {
    console.log("Initiating data sync");
    setIsLoading(true);
    setError(null);
    try {
      const { data, isMock } = await fetchProductionData();
      console.log("Data sync complete. Raw rows:", data.length);
      setRawSourceData(data);
      setIsUsingMockData(isMock);
      
      if (isMock) {
        setError({
          message: "Simulation Active",
          sub: "Cloud connection failed. Using internal performance-testing dataset."
        });
      }

      applyFilters(data);
    } catch (err: any) {
      console.error("Fetch Failure:", err);
      setError({
        message: "Network Failure",
        sub: err.message || "Unable to reach production servers."
      });
      const loader = document.getElementById('global-loading');
      if (loader) loader.style.display = 'none';
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loader = document.getElementById('global-loading');
    if (loader) loader.style.display = 'none';
    handleFetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 w-full">
      {isLoading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-[2px] z-[100] flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-bold text-[10px] uppercase tracking-widest">Processing Data Layout...</p>
        </div>
      )}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 shadow-sm w-full">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-100">
              <i className="fa-solid fa-industry"></i>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Production Parameter Monitor</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Maxxis Rubber India • Advanced Analytics</p>
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

        <FilterSection 
          filters={filters} 
          onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))} 
          onSearch={() => applyFilters()}
          onSync={handleFetchData}
          isLoading={isLoading}
          availableMachines={availableMachines}
          availableRubbers={availableRubbers}
        />

        <StatsOverview data={groupedData} />
        <ProductionTable data={groupedData} />
      </main>
    </div>
  );
};

export default App;