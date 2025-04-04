import React from "react";
import {
  RefreshCw,
  BarChart2,
  Sun,
  Moon,
  Activity,
  Calculator,
} from "lucide-react";
import { NiftyChartOptions } from "../../types/index";

export interface ChartControlsProps {
  options: NiftyChartOptions;
  selectedIndicators: string[];
  isCalculating: boolean;
  timeframe: string;
  onToggleVolume: () => void;
  onToggleTheme: () => void;
  onToggleIndicator: () => void;
  onCalculateIndicators: () => void;
  onTimeframeChange: (timeframe: string) => void;
  onRefreshData: () => void;
}

const ChartControls: React.FC<ChartControlsProps> = ({
  options,
  selectedIndicators,
  isCalculating,
  timeframe,
  onToggleVolume,
  onToggleTheme,
  onToggleIndicator,
  onCalculateIndicators,
  onTimeframeChange,
  onRefreshData,
}) => {
  return (
    <div className="flex items-center justify-between py-1 px-2 mb-1">
      <div className="flex items-center space-x-2">
        {/* Volume Toggle */}
        <button
          className={`flex items-center p-1 text-xs rounded hover:bg-gray-200 transition-colors ${
            options.showVolume ? "bg-blue-100 text-blue-700" : ""
          }`}
          onClick={onToggleVolume}
          title="Toggle Volume Chart"
        >
          <BarChart2 size={14} className="mr-1" />
          Volume
        </button>

        {/* Theme Toggle */}
        <button
          className="p-1 rounded hover:bg-gray-200 transition-colors"
          onClick={onToggleTheme}
          title={`Switch to ${
            options.theme === "dark" ? "Light" : "Dark"
          } Theme`}
        >
          {options.theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div className="h-5 border-r border-gray-300 mx-1"></div>

        {/* Indicators Toggle */}
        <button
          className={`flex items-center p-1 text-xs rounded hover:bg-gray-200 transition-colors ${
            selectedIndicators.length > 0 ? "bg-blue-100 text-blue-700" : ""
          }`}
          onClick={onToggleIndicator}
          title="Toggle Indicators"
        >
          <Activity size={14} className="mr-1" />
          Indicators
          {selectedIndicators.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
              {selectedIndicators.length}
            </span>
          )}
        </button>

        {/* Calculate Indicators Button - Only show if indicators are selected */}
        {selectedIndicators.length > 0 && (
          <button
            className={`flex items-center p-1 text-xs rounded hover:bg-gray-200 transition-colors ${
              isCalculating ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={onCalculateIndicators}
            disabled={isCalculating}
            title="Calculate Indicators"
          >
            <Calculator size={14} className="mr-1" />
            {isCalculating ? "Calculating..." : "Calculate"}
          </button>
        )}
      </div>

      <div className="flex items-center">
        {/* Refresh Data Button */}
        <button
          className="p-1 rounded mr-2 hover:bg-gray-200 transition-colors"
          onClick={onRefreshData}
          title="Refresh Data"
        >
          <RefreshCw size={16} />
        </button>

        {/* Timeframe Buttons */}
        <div className="flex border rounded overflow-hidden">
          {["7D", "1M", "3M", "6M", "1Y"].map((tf) => (
            <button
              key={tf}
              className={`px-2 py-0.5 text-xs ${
                timeframe === tf
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-200"
              }`}
              onClick={() => onTimeframeChange(tf)}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChartControls;
