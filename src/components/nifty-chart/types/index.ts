export interface NiftyDataPoint {
  date: string;
  time?: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface IndicatorCalculationResult {
  indicator: string;
  position: "on_chart" | "below";
  data: Record<string, number[]>;
}

export interface NiftyChartOptions {
  title?: string;
  showVolume?: boolean;
  height?: string | number;
  width?: string | number;
  theme?: "light" | "dark";
  indicators?: Array<{ id: string; active: boolean }>;
  calculationResults?: IndicatorCalculationResult[];
  showAllIndicators?: boolean;
  belowIndicators?: IndicatorCalculationResult[];
  timestamps?: string[];
  totalDataPoints?: number;
  dataZoom?: { start: number; end: number };
  showDataToolbar?: boolean;
  showTimestampsOnMain?: boolean;
  showTimestampsOnLastIndicator?: boolean;
}

export interface ApiDataPoint {
  close: number;
  high: number;
  low: number;
  open: number;
  time: string;
  volume: number;
}

// Re-export indicator types
export * from "./indicators";
