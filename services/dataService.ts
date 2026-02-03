
import { RawProductionRow, GroupedBatch, MachineType } from '../types';

const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxEVrBCNinBpAM1pUMsn43rhGT_JaJAIY3CSnJI5mJX51ab_cSihT5BnFxZ2Zfx1VFGQw/exec';

const generateMockData = (): RawProductionRow[] => {
  const mockRows: RawProductionRow[] = [];
  const machines = [MachineType.MIXER, MachineType.PREPARATION];
  const rubberTypes = ['Natural Rubber', 'Synthetic SBR', 'EPDM Compound', 'Nitrile'];
  const today = new Date();
  
  for (let i = 0; i < 2000; i++) {
    const lotNum = `LOT-${3000 + Math.floor(i / 10)}`;
    const batchNum = `B${(i % 10) + 1}`;
    const date = new Date(today);
    date.setDate(date.getDate() - Math.floor(i / 50));
    
    mockRows.push({
      date: date.toISOString(),
      machine: machines[i % 2],
      lotNumber: lotNum,
      batchNumber: batchNum,
      rubber: rubberTypes[i % 4],
      ct: (15 + Math.random() * 10).toFixed(1),
      stepNumber: (i % 5) + 1,
      timeValue: 2 + Math.random() * 8,
      tempValue: 50 + Math.random() * 50,
    });
  }
  return mockRows;
};

export const fetchProductionData = async (): Promise<{ data: RawProductionRow[], isMock: boolean }> => {
  try {
    console.time('api_fetch');
    // Added mode: 'cors' and explicit headers as requested
    const response = await fetch(GOOGLE_SHEET_URL, { 
      method: 'GET',
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const rawResponse = await response.text();
    console.timeEnd('api_fetch');

    let rows: any[][];
    try {
      rows = JSON.parse(rawResponse);
    } catch (e) {
      // Fallback for CSV if script returns raw text instead of JSON
      const lines = rawResponse.trim().split(/\r?\n/);
      rows = lines.map(line => line.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
    }

    if (rows.length < 2) return { data: [], isMock: false };

    // Create lookup dictionary for CT values
    const ctLookup: Record<string, string> = {};
    rows.slice(1).forEach(cols => {
      const lotKey = String(cols[23] || '').trim();
      const batchKey = String(cols[24] || '').trim();
      if (lotKey && batchKey) {
        const key = `${lotKey}_${batchKey}`;
        ctLookup[key] = String(cols[21] || '0');
      }
    });

    const dataRows = rows.slice(1).map(cols => {
      const lotNum = String(cols[2] || '');
      const batchNum = String(cols[5] || '');
      const lookupKey = `${lotNum.trim()}_${batchNum.trim()}`;
      
      return {
        date: String(cols[1] || ''),
        machine: String(cols[0] || ''),
        lotNumber: lotNum,
        rubber: String(cols[3] || ''),
        batchNumber: batchNum,
        ct: ctLookup[lookupKey] || '0', 
        stepNumber: parseInt(cols[6]) || 0,
        timeValue: parseFloat(cols[9]) || 0,
        tempValue: parseFloat(cols[11]) || 0,
      };
    });

    return { data: dataRows, isMock: false };
  } catch (error) {
    console.warn("Switching to mock data due to fetch error:", error);
    return { data: generateMockData(), isMock: true };
  }
};

export const processBatchData = (rows: RawProductionRow[]): GroupedBatch[] => {
  console.time('grouping_processing');
  const groups: Record<string, GroupedBatch> = {};

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const key = `${row.lotNumber}_${row.batchNumber}`;
    
    if (!groups[key]) {
      groups[key] = {
        lotNumber: String(row.lotNumber),
        batchNumber: String(row.batchNumber),
        rubber: String(row.rubber),
        machine: String(row.machine),
        date: row.date,
        ct: String(row.ct || '0'),
        mx: 0,
        steps: {},
        originalRows: []
      };
    }

    const group = groups[key];
    group.mx += row.timeValue;
    
    if (row.stepNumber > 0 && row.stepNumber < 100) {
      group.steps[row.stepNumber] = {
        time: row.timeValue,
        temp: row.tempValue
      };
    }
    group.originalRows.push(row);
  }

  const batches = Object.values(groups);
  console.timeEnd('grouping_processing');
  return batches;
};