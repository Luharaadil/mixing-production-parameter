
import React, { useMemo } from 'react';
import { GroupedBatch } from '../types';

interface ProductionTableProps {
  data: GroupedBatch[];
}

const ProductionTable: React.FC<ProductionTableProps> = ({ data }) => {
  // Skip rows where mx sum equals zero
  const validData = useMemo(() => data.filter(batch => batch.mx !== 0), [data]);

  const stepColumns = useMemo(() => {
    const maxStep = validData.reduce((max, batch) => {
      const steps = Object.keys(batch.steps).map(Number);
      const localMax = steps.length > 0 ? Math.max(...steps) : 0;
      return Math.max(max, localMax);
    }, 0);
    // Limit to reasonable steps for compact display
    return Array.from({ length: Math.min(maxStep || 3, 10) }, (_, i) => i + 1);
  }, [validData]);

  // Calculate arithmetic means for the summary row
  const averages = useMemo(() => {
    const rowCount = validData.length;
    if (rowCount === 0) return null;

    let totalMx = 0;
    let totalCt = 0;
    
    // Accumulators for step totals to handle missing steps correctly
    const stepTimeSums: Record<number, number> = {};
    const stepTempSums: Record<number, number> = {};
    const stepTimeCounts: Record<number, number> = {};
    const stepTempCounts: Record<number, number> = {};

    validData.forEach(batch => {
      totalMx += batch.mx;
      totalCt += parseFloat(batch.ct || '0');

      stepColumns.forEach(step => {
        const stepData = batch.steps[step];
        if (stepData) {
          if (typeof stepData.time === 'number') {
            stepTimeSums[step] = (stepTimeSums[step] || 0) + stepData.time;
            stepTimeCounts[step] = (stepTimeCounts[step] || 0) + 1;
          }
          if (typeof stepData.temp === 'number') {
            stepTempSums[step] = (stepTempSums[step] || 0) + stepData.temp;
            stepTempCounts[step] = (stepTempCounts[step] || 0) + 1;
          }
        }
      });
    });

    const stepAverages: Record<number, { time: string; temp: string }> = {};
    stepColumns.forEach(step => {
      const avgTime = stepTimeCounts[step] ? (stepTimeSums[step] / stepTimeCounts[step]).toFixed(2) : '-';
      const avgTemp = stepTempCounts[step] ? (stepTempSums[step] / stepTempCounts[step]).toFixed(2) : '-';
      stepAverages[step] = { time: avgTime, temp: avgTemp };
    });

    return {
      mx: (totalMx / rowCount).toFixed(2),
      ct: (totalCt / rowCount).toFixed(2),
      steps: stepAverages
    };
  }, [validData, stepColumns]);

  if (validData.length === 0) {
    return (
      <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
          <i className="fa-solid fa-database text-2xl"></i>
        </div>
        <h3 className="text-lg font-medium text-slate-900">No data found</h3>
        <p className="text-slate-500 text-sm">Adjust filters or refine search criteria.</p>
      </div>
    );
  }

  // Percentage widths to ensure single-page layout (total 100%)
  const stepCellWidth = 35 / (stepColumns.length * 2);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Consolidated Batch Log</h2>
        <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-200">
          {validData.length} Batches
        </span>
      </div>
      <div className="table-container overflow-x-hidden w-full">
        <table className="w-full text-left border-collapse table-fixed" style={{ width: '100%' }}>
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-1 py-1 text-[10px] font-bold text-slate-600 uppercase tracking-tight" style={{ width: '6%' }}>Lot #</th>
              <th className="px-1 py-1 text-[10px] font-bold text-slate-600 uppercase tracking-tight" style={{ width: '7%' }}>Batch #</th>
              <th className="px-1 py-1 text-[10px] font-bold text-slate-600 uppercase tracking-tight" style={{ width: '9%' }}>Date</th>
              <th className="px-1 py-1 text-[10px] font-bold text-slate-600 uppercase tracking-tight" style={{ width: '11%' }}>Machine</th>
              <th className="px-1 py-1 text-[10px] font-bold text-slate-600 uppercase tracking-tight" style={{ width: '18%' }}>Rubber Name</th>
              <th className="px-1 py-1 text-[10px] font-bold text-amber-600 uppercase tracking-tight bg-amber-50/50" style={{ width: '7%' }}>CT</th>
              <th className="px-1 py-1 text-[10px] font-bold text-indigo-600 uppercase tracking-tight bg-indigo-50/50" style={{ width: '7%' }}>MX Sum</th>
              
              {stepColumns.map(step => (
                <React.Fragment key={step}>
                  <th className="px-1 py-1 text-[9px] font-bold text-slate-500 uppercase tracking-tight bg-amber-50/20" style={{ width: `${stepCellWidth}%` }}>T{step}</th>
                  <th className="px-1 py-1 text-[9px] font-bold text-slate-500 uppercase tracking-tight bg-emerald-50/20" style={{ width: `${stepCellWidth}%` }}>Tmp{step}</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Summary Average Row */}
            {averages && (
              <tr className="bg-slate-900 text-white font-bold border-b border-slate-700">
                <td colSpan={2} className="px-1 py-1 text-[10px] uppercase text-center bg-indigo-600 text-white">Average</td>
                <td className="px-1 py-1 text-[10px]">-</td>
                <td className="px-1 py-1 text-[10px]">-</td>
                <td className="px-1 py-1 text-[10px]">-</td>
                <td className="px-1 py-1 text-[10px] text-amber-400">{averages.ct}</td>
                <td className="px-1 py-1 text-[10px] text-indigo-300">{averages.mx}</td>
                {stepColumns.map(step => (
                  <React.Fragment key={step}>
                    <td className="px-1 py-1 text-[9px] text-amber-200">{averages.steps[step].time}</td>
                    <td className="px-1 py-1 text-[9px] text-emerald-300">{averages.steps[step].temp}</td>
                  </React.Fragment>
                ))}
              </tr>
            )}

            {/* Data Rows */}
            {validData.map((batch, idx) => (
              <tr key={`${batch.lotNumber}-${batch.batchNumber}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-1 py-1 text-[10px] font-bold text-slate-900 truncate">{batch.lotNumber}</td>
                <td className="px-1 py-1 text-[10px] font-bold text-slate-900 truncate">{batch.batchNumber}</td>
                <td className="px-1 py-1 text-[10px] text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">{new Date(batch.date).toLocaleDateString()}</td>
                <td className="px-1 py-1 text-[10px] text-slate-600 truncate">{batch.machine}</td>
                <td className="px-1 py-1 text-[10px] text-slate-700 font-medium truncate">{batch.rubber}</td>
                <td className="px-1 py-1 text-[10px] font-bold text-amber-700 bg-amber-50/10">
                  {batch.ct || '0'}
                </td>
                <td className="px-1 py-1 text-[10px] font-bold text-indigo-600 bg-indigo-50/10">
                  {batch.mx.toFixed(1)}
                </td>

                {stepColumns.map(step => (
                  <React.Fragment key={step}>
                    <td className="px-1 py-1 text-[10px] text-amber-700 bg-amber-50/5 truncate">
                      {batch.steps[step]?.time?.toFixed(1) || '-'}
                    </td>
                    <td className="px-1 py-1 text-[10px] text-emerald-700 bg-emerald-50/5 truncate">
                      {batch.steps[step]?.temp?.toFixed(0) || '-'}
                    </td>
                  </React.Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductionTable;
