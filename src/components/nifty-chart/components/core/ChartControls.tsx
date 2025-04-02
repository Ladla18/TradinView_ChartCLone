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

interface ChartControlsProps {
  options: NiftyChartOptions;
  selectedIndicators: { id: string; active: boolean }[];
  isCalculating: boolean;
  timeframe: number;
  toggleVolume: () => void;
  toggleTheme: () => void;
  toggleIndicatorsModal: () => void;
  toggleAddIndicatorModal: () => void;
  handleCalculateIndicators: () => void;
  refetch: () => void;
  changeTimeframe: (days: number) => void;
}

const ChartControls: React.FC<ChartControlsProps> = ({
  options,
  selectedIndicators,
  isCalculating,
  timeframe,
  toggleVolume,
  toggleTheme,
  toggleIndicatorsModal,
  handleCalculateIndicators,
  refetch,
  changeTimeframe,
}) => {
  return (
    <div className="mb-2 flex justify-between items-center py-1 px-1 border-b border-gray-200">
      <div className="flex items-center space-x-1">
        {/* Chart Options */}
        <div className="flex space-x-1 mr-3 items-center">
          <button
            onClick={toggleVolume}
            className="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            title={options.showVolume ? "Hide Volume" : "Show Volume"}
          >
            <BarChart2 size={18} />
          </button>

          <button
            onClick={toggleTheme}
            className="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            title={
              options.theme === "dark"
                ? "Switch to Light Theme"
                : "Switch to Dark Theme"
            }
          >
            {options.theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-gray-300 mx-1"></div>

        {/* Indicators */}
        <button
          onClick={toggleIndicatorsModal}
          className={`flex items-center rounded-md px-2 py-1 text-sm font-medium ${
            selectedIndicators.length > 0
              ? "bg-green-500 text-white hover:bg-green-600"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          } transition-colors`}
        >
          <Activity size={15} className="mr-1" />
          Indicators
          {selectedIndicators.length > 0 && (
            <span className="ml-1.5 bg-white bg-opacity-20 px-1.5 py-0.5 rounded-full text-xs">
              {selectedIndicators.length}
            </span>
          )}
        </button>

        {selectedIndicators.length > 0 && (
          <button
            onClick={handleCalculateIndicators}
            disabled={isCalculating}
            className="flex items-center rounded-md bg-green-500 px-2 py-1 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            <Calculator size={15} className="mr-1" />
            {isCalculating ? "Calculating..." : "Calculate"}
          </button>
        )}

        <button
          onClick={refetch}
          className="flex items-center rounded-md bg-gray-100 px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
        >
          <RefreshCw size={15} className="mr-1" />
          Refresh
        </button>
      </div>

      {/* Time Range Controls */}
      <div className="flex rounded-md bg-gray-100 p-0.5">
        {[
          { days: 7, label: "7D" },
          { days: 30, label: "1M" },
          { days: 90, label: "3M" },
          { days: 180, label: "6M" },
          { days: 365, label: "1Y" },
        ].map(({ days, label }) => (
          <button
            key={days}
            onClick={() => changeTimeframe(days)}
            className={`px-2 py-0.5 text-xs font-medium rounded-md ${
              timeframe === days
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            } transition-colors`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChartControls;
