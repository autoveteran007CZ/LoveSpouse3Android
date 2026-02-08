// Manufacturer Data Prefix
// 0x6D, 0xB6, 0x43, 0xCE, 0x97, 0xFE, 0x42, 0x7C
export const MANUFACTURER_DATA_PREFIX = [0x6D, 0xB6, 0x43, 0xCE, 0x97, 0xFE, 0x42, 0x7C];
export const COMPANY_ID = 0xFFF0;

// Replicating the manufacturerDataList from the Arduino code
export const COMMAND_PATTERNS: number[][] = [
    // 0: Stop all channels (OFF) - {PREFIX, 0xE5, 0x15, 0x7D}
    [...MANUFACTURER_DATA_PREFIX, 0xE5, 0x15, 0x7D],
    // 1: Set all channels to speed 1
    [...MANUFACTURER_DATA_PREFIX, 0xE4, 0x9C, 0x6C],
    // 2: Set all channels to speed 2
    [...MANUFACTURER_DATA_PREFIX, 0xE7, 0x07, 0x5E],
    // 3: Set all channels to speed 3
    [...MANUFACTURER_DATA_PREFIX, 0xE6, 0x8E, 0x4F],
    // 4–9: Extra modes
    [...MANUFACTURER_DATA_PREFIX, 0xE1, 0x31, 0x3B], // 4
    [...MANUFACTURER_DATA_PREFIX, 0xE0, 0xB8, 0x2A], // 5
    [...MANUFACTURER_DATA_PREFIX, 0xE3, 0x23, 0x18], // 6
    [...MANUFACTURER_DATA_PREFIX, 0xE2, 0xAA, 0x09], // 7
    [...MANUFACTURER_DATA_PREFIX, 0xED, 0x5D, 0xF1], // 8
    [...MANUFACTURER_DATA_PREFIX, 0xEC, 0xD4, 0xE0], // 9
];

// Additional helper descriptions for the UI
export const PATTERN_NAMES = [
  "STOP (All)",
  "Speed 1 (All)",
  "Speed 2 (All)",
  "Speed 3 (All)",
  "Pattern 4",
  "Pattern 5",
  "Pattern 6",
  "Pattern 7",
  "Pattern 8",
  "Pattern 9",
];

// For BPM Mode
export const DEFAULT_BPM_ON_MS = 60;
export const DEFAULT_BPM_OFF_MS = 1500;
export const DEFAULT_BPM_PATTERN = 4;
