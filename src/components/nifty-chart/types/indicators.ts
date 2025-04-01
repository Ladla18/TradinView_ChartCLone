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
}

export interface IndicatorSchema {
  [key: string]: Indicator;
}

export interface SelectedIndicator {
  id: string;
  name: string;
  parameters: Record<string, any>;
  active: boolean;
}
