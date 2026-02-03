
import React, { useState, useEffect, useMemo } from 'react';
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
  const [groupedData, setGroupedData] = useState<GroupedBatch[]>([]);
  const [error, setError] = useState<{ message: string; sub: string } | null>(null);
  const [showLimitWarning, setShowLimitWarning] = useState(false);

  // Stage 1: Partial Filtering (Date, Machine, Rubber)
  // This is used to derive the dynamic available lots list.
  const partialFilteredData = useMemo(() => {
    try {
      if (rawSourceData.length === 0) return [];

      const start = filters.startDate ? new Date(filters.startDate) : null;
      if (start) start.setHours(0, 0, 0, 0);
      const end = filters.endDate ? new Date(filters.endDate) : null;
      if (end) end.setHours(23, 59, 59, 999);

      return rawSourceData.filter(row => {
        const rowDate = new Date(row.date);
        const dateMatch = (!start || rowDate >= start) && (!end || rowDate <= end);
        
        const machineMatch = !filters.machine || 
          String(row.machine || '').toLowerCase().includes(filters.machine.toLowerCase());
        
        const rubberMatch = !filters.rubber || 
          String(row.rubber || '').toLowerCase().includes(filters.rubber.toLowerCase());
        
        return dateMatch && machineMatch && rubberMatch;
      });
    } catch (e) {
      console.error("Partial filter error", e);
      return [];
    }
  }, [rawSourceData, filters.startDate, filters.endDate, filters.machine, filters.rubber]);

  // Derive unique lot numbers from partial filtered data (Stage 1 result)
  const availableLots = useMemo(() => {
    try {
      const lots = Array.from(new Set(partialFilteredData.map(r => r.lotNumber)))
        .filter(l => l && l.trim() !== '')
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
      return lots;
    } catch (e) {
      console.error("Lot extraction failed", e);
      return [];
    }
  }, [partialFilteredData]);

  // Reset or adjust selected lots when available lots list changes
  useEffect(() => {
    if (availableLots.length === 0) {
       setFilters(prev => ({ ...prev, selectedLots: [] }));
       return;
    }
    
    // Auto-select all available if none selected or keep only valid ones
    setFilters(prev => {
      const validSelected = prev.selectedLots.filter(lot => availableLots.includes(lot));
      // If we just loaded or filters changed and no valid selection remains, auto-select all
      if (validSelected.length === 0 && prev.selectedLots.length > 0) {
        return { ...prev, selectedLots: availableLots };
      }
      return { ...prev, selectedLots: validSelected };
    });
  }, [availableLots]);

  const handleFetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, isMock } = await fetchProductionData();
      setRawSourceData(data);
      setIsUsingMockData(isMock);
      
      // Initial lot selection handled by the useEffect above
      if (isMock) {
        setError({
          message: "Simulation Active",
          sub: "Cloud connection failed. Using internal performance-testing dataset."
        });
      }
    } catch (err: any) {
      console.error("Fetch Failure:", err);
      setError({
        message: "Network Failure",
        sub: err.message || "Unable to reach production servers."
      });
    } finally {
      // Loader hidden in the processing useEffect
    }
  };

  // Stage 2: Final Filtering (Stage 1 result + Lot Selection)
  useEffect(() => {
    try {
      if (rawSourceData.length === 0) {
        if (!isLoading) {
          const loader = document.getElementById('global-loading');
          if (loader) loader.style.display = 'none';
        }
        return;
      }

      console.time('final_processing_pipeline');
      
      // Final Filter includes Stage 1 + Lot Selection
      const finalFiltered = partialFilteredData.filter(row => {
        return filters.selectedLots.length === 0 || filters.selectedLots.includes(row.lotNumber);
      });

      // Group Final Filtered Data
      const processed = processBatchData(finalFiltered);

      // Final display filter (text search for lot)
      const finalResult = processed.filter(batch => {
        const lotTextMatch = !filters.lotNumber || 
          String(batch.lotNumber || '').toLowerCase().includes(filters.lotNumber.toLowerCase());
        return lotTextMatch;
      });

      setShowLimitWarning(finalResult.length > ROW_DISPLAY_LIMIT);
      setGroupedData(finalResult.slice(0, ROW_DISPLAY_LIMIT));
      
      console.timeEnd('final_processing_pipeline');
      
      const loader = document.getElementById('global-loading');
      if (loader) loader.style.display = 'none';
      setIsLoading(false);

    } catch (err: any) {
      console.error("Rendering Error:", err);
      setError({
        message: "Processing Error",
        sub: "A bug occurred during final data assembly. Check logs."
      });
      const loader = document.getElementById('global-loading');
      if (loader) loader.style.display = 'none';
      setIsLoading(false);
    }
  }, [partialFilteredData, filters.selectedLots, filters.lotNumber, isLoading]);

  useEffect(() => {
    handleFetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 w-full">
      {/* Processing Indicator */}
      {isLoading && rawSourceData.length > 0 && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-[2px] z-[100] flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-bold text-[10px] uppercase tracking-widest">Refreshing Dashboard...</p>
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
            Optimized View: Showing top {ROW_DISPLAY_LIMIT} records for better performance.
          </div>
        )}

        <FilterSection 
          filters={filters} 
          onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))} 
          onSearch={handleFetchData}
          isLoading={isLoading}
          availableLots={availableLots}
        />

        {filters.selectedLots.length > 0 ? (
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
            <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">Please select specific lot numbers from the generated list to visualize production analytics.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
