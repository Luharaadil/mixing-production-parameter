
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
      power: 100 + Math.random() * 50,
      speed: 30 + Math.random() * 10,
    });
  }
  return mockRows;
};

/**
 * Enhanced fetch with longer timeout and retry logic
 */
const fetchWithRetry = async (url: string, retries: number = 1, timeoutMs: number = 180000): Promise<Response> => {
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      console.log(`Fetch attempt ${i + 1} of ${retries + 1}...`);
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(id);
      return response;
    } catch (err: any) {
      clearTimeout(id);
      if (i === retries) throw err;
      console.warn(`Attempt ${i + 1} failed, retrying...`, err.message);
    }
  }
  throw new Error('All fetch attempts failed');
};

export const fetchProductionData = async (): Promise<{ data: RawProductionRow[], isMock: boolean }> => {
  try {
    console.time('api_fetch_total');
    const response = await fetchWithRetry(GOOGLE_SHEET_URL, 1, 180000); // 180s timeout, 1 retry

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const rawResponse = await response.text();
    console.timeEnd('api_fetch_total');

    let rows: any[][];
    try {
      rows = JSON.parse(rawResponse);
    } catch (e) {
      // Fallback for CSV formatted response if JSON parse fails
      const lines = rawResponse.trim().split(/\r?\n/);
      rows = lines.map(line => line.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
    }

    if (rows.length < 2) return { data: [], isMock: false };

    // Dictionary for CT Matching using indices 13 (Lot Match) and 14 (Batch Match)
    const ctLookup: Record<string, string> = {};
    rows.slice(1).forEach(cols => {
      const lotKey = String(cols[13] || '').trim();   // Column N
      const batchKey = String(cols[14] || '').trim(); // Column O
      if (lotKey && batchKey) {
        const key = `${lotKey}_${batchKey}`;
        ctLookup[key] = String(cols[11] || '0');      // Column L
      }
    });

    const dataRows = rows.slice(1)
      .filter(cols => 
        String(cols[0] || '').trim() !== '' && 
        String(cols[2] || '').trim() !== '' && 
        String(cols[4] || '').trim() !== ''
      )
      .map(cols => {
      const lotNum = String(cols[2] || '').trim();    // Column C
      const batchNum = String(cols[4] || '').trim();  // Column E
      const lookupKey = `${lotNum}_${batchNum}`;
      
      return {
        machine: String(cols[0] || '').trim(),        // Column A
        date: String(cols[1] || '').trim(),           // Column B
        lotNumber: lotNum,                     // Column C
        rubber: String(cols[3] || '').trim(),         // Column D
        batchNumber: batchNum,                 // Column E
        stepNumber: parseInt(cols[5]) || 0,    // Column F
        timeValue: parseFloat(cols[6]) || 0,   // Column G
        tempValue: parseFloat(cols[7]) || 0,   // Column H
        power: parseFloat(cols[8]) || 0,       // Column I
        speed: parseFloat(cols[9]) || 0,       // Column J
        ct: ctLookup[lookupKey] || '0', 
      };
    });

    return { data: dataRows, isMock: false };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error("Fetch Request Timed Out after extended duration.");
    } else {
      console.error("Fetch Data Error:", error);
    }
    console.warn("Switching to simulation mode due to connection timeout or failure.");
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
        avgPower: 0,
        avgSpeed: 0,
        steps: {},
        originalRows: []
      };
    }

    const group = groups[key];
    group.mx += row.timeValue;
    group.avgPower += row.power;
    group.avgSpeed += row.speed;
    
    if (row.stepNumber > 0 && row.stepNumber < 100) {
      group.steps[row.stepNumber] = {
        time: row.timeValue,
        temp: row.tempValue,
        power: row.power,
        speed: row.speed
      };
    }
    group.originalRows.push(row);
  }

  const batches = Object.values(groups).map(batch => {
    const count = batch.originalRows.length;
    return {
      ...batch,
      avgPower: batch.avgPower / (count || 1),
      avgSpeed: batch.avgSpeed / (count || 1)
    };
  });

  console.timeEnd('grouping_processing');
  return batches;
};
