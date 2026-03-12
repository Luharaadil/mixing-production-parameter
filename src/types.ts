export enum MachineType {
  MIXER = 'MIXER',
  PREPARATION = 'PREPARATION'
}

export interface RawProductionRow {
  date: string;       // Column B (Index 1)
  machine: string;    // Column A (Index 0)
  lotNumber: string;  // Column C (Index 2)
  batchNumber: string; // Column E (Index 4)
  rubber: string;      // Column D (Index 3)
  ct: string;          // Derived via Index 13/14 lookup from Index 11
  stepNumber: number; // Column F (Index 5)
  timeValue: number;  // Column G (Index 6)
  tempValue: number;  // Column H (Index 7)
  power: number;      // Column I (Index 8)
  speed: number;      // Column J (Index 9)
  [key: string]: any; 
}

export interface GroupedBatch {
  lotNumber: string;
  batchNumber: string;
  rubber: string;
  machine: string;
  date: string;
  ct: string;
  mx: number; 
  avgPower: number;
  avgSpeed: number;
  steps: {
    [stepId: number]: {
      time: number;
      temp: number;
      power: number;
      speed: number;
    };
  };
  originalRows: any[];
}

export interface FilterState {
  startDate: string;
  endDate: string;
  machine: string[];
  rubber: string[];
  lotNumber: string;
}