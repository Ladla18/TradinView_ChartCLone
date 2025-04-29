export interface IndicatorParameter {
  default: any;
  description: string;
  type: string;
  options?: string[];
}

export interface IndicatorOutput {
  description: string;
  type: string;
}

export interface Indicator {
  description: string;
  output: Record<string, IndicatorOutput>;
  parameters: Record<string, IndicatorParameter>;
  position: "on_chart" | "below";
  short_name?: string;
}

export interface IndicatorSchema {
  [key: string]: Indicator;
}

export interface ApiIndicator {
  name: string;
  short_name: string;
  output: Record<string, IndicatorOutput>;
  parameters: Record<string, IndicatorParameter>;
  position: "on_chart" | "below";
}

export interface SelectedIndicator {
  id: string;
  name: string;
  type: string;
  period: number;
  chartType: string;
  parameters: Record<string, any>;
  active: boolean;
  candleInterval?: string;
  field?: string;
  noOfCandles?: number;
}
