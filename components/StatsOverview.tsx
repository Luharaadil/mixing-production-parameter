
import React from 'react';
import { GroupedBatch } from '../types';

interface StatsOverviewProps {
  data: GroupedBatch[];
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ data }) => {
  const totalBatches = data.length;
  
  const stats = React.useMemo(() => {
    if (totalBatches === 0) return { avgMx: 0, avgCt: 0 };
    
    let totalMx = 0;
    let totalCt = 0;
    
    data.forEach(b => {
      totalMx += b.mx;
      totalCt += parseFloat(b.ct || '0');
    });
    
    return {
      avgMx: totalMx / totalBatches,
      avgCt: totalCt / totalBatches
    };
  }, [data, totalBatches]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl">
          <i className="fa-solid fa-boxes-stacked"></i>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Total Batches</p>
          <h4 className="text-2xl font-bold text-slate-900">{totalBatches}</h4>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-xl">
          <i className="fa-solid fa-clock"></i>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Avg Cycle Time (MX)</p>
          <h4 className="text-2xl font-bold text-slate-900">{stats.avgMx.toFixed(2)} <span className="text-sm font-normal text-slate-400">min</span></h4>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl">
          <i className="fa-solid fa-gauge-high"></i>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Avg CT Value</p>
          <h4 className="text-2xl font-bold text-slate-900">{stats.avgCt.toFixed(2)}</h4>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
