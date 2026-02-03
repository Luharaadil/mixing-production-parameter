
// Fix: Added MachineType enum to provide the missing export for dataService.ts
export enum MachineType {
  MIXER = 'MIXER',
  PREPARATION = 'PREPARATION'
}

export interface RawProductionRow {
  date: string;       // Column B
  machine: string;    // Column A
  lotNumber: string;  // Column C
  batchNumber: string; // Column F
  rubber: string;      // Column D
  ct: string;          // Derived from Column V via X/Y lookup
  stepNumber: number; // Column G (Index 6)
  timeValue: number;  // Column J (Index 9)
  tempValue: number;  // Column L (Index 11)
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
  steps: {
    [stepId: number]: {
      time: number;
      temp: number;
    };
  };
  originalRows: any[];
}

export interface FilterState {
  startDate: string;
  endDate: string;
  machine: string;
  lotNumber: string;
  rubber: string;
  selectedLots: string[];
}
