export interface DataPoint {
  period: string;     // ISO date or period label
  date: Date;
  demand: number;
  planned?: number;
  actual?: number;
}

export interface ForecastPoint {
  period: string;
  date: Date;
  historical?: number;
  forecast?: number;
  upperBound?: number;
  lowerBound?: number;
  error?: number;
}

export interface ForecastMetrics {
  mape: number;       // Mean Absolute Percentage Error
  mad: number;        // Mean Absolute Deviation
  mse: number;        // Mean Squared Error
  bias: number;       // Forecast Bias
  trackingSignal: number;
  accuracy: number;   // 100 - MAPE
}

export type ForecastMethod = "sma" | "wma" | "linear" | "exponential";

export interface ForecastParams {
  method: ForecastMethod;
  periods: number;     // window size
  weights?: number[];  // for WMA
  horizon: number;     // forecast horizon
  alpha?: number;      // for exponential smoothing
}

export interface UploadState {
  file: File | null;
  raw: unknown[];
  mapped: DataPoint[];
  columnMap: Record<string, string>;
  status: "idle" | "parsing" | "mapping" | "ready" | "error";
  error?: string;
}

export interface KPI {
  label: string;
  value: string;
  delta?: number;
  trend?: "up" | "down" | "flat";
  icon: string;
}

export interface BullwhipNode {
  id: string;
  label: string;
  role: "customer" | "retailer" | "distributor" | "manufacturer" | "supplier";
  demand: number;
  order: number;
  inventory: number;
  amplification: number;
}

export interface SOPSlice {
  period: string;
  demand: number;
  supply: number;
  capacity: number;
  inventory: number;
  backorders: number;
}

export interface Alert {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  timestamp: Date;
}
