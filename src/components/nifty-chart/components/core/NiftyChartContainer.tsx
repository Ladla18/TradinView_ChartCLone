import React, { useState } from "react";
import NiftyChart from "./NiftyChart";
import { useNiftyData } from "../../hooks/useNiftyData";
import { useIndicators } from "../../hooks/useIndicators";
import {
  NiftyChartOptions,
  NiftyDataPoint,
  IndicatorCalculationResult,
} from "../../types/index";
import IndicatorSelector from "../indicators/IndicatorSelector";
import IndicatorCharts from "../indicators/IndicatorCharts";
import { twMerge } from "tailwind-merge";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ProcessedIndicator {
  indicator: string;
  position: "on_chart" | "below";
  data: Record<string, number[]>;
}

interface NiftyChartContainerProps {
  initialOptions?: NiftyChartOptions;
  days?: number;
  className?: string;
  style?: React.CSSProperties;
  useMockData?: boolean;
  apiUrl?: string;
  calculationResults?: IndicatorCalculationResult[];
}

const NiftyChartContainer: React.FC<NiftyChartContainerProps> = ({
  initialOptions = {},
  days = 30,
  className = "",
  style = {},
  useMockData = false,
  apiUrl = "https://dev.api.tusta.co/charts/get_csv_data",
  calculationResults = [],
}) => {
  const [options, setOptions] = useState<NiftyChartOptions>(initialOptions);
  const [timeframe, setTimeframe] = useState<number>(days);
  const [isIndicatorModalOpen, setIsIndicatorModalOpen] = useState(false);

  const {
    data,
    loading: chartLoading,
    error,
    refetch,
    isUsingMockData,
  } = useNiftyData({
    days: timeframe,
    mockData: useMockData,
    apiUrl,
  });

  const {
    indicatorSchema,
    selectedIndicators,
    loading: indicatorsLoading,
    addIndicator,
    removeIndicator,
    updateIndicatorParameter,
    toggleIndicator,
    calculateSelectedIndicators,
    calculationResults: internalCalculationResults,
    isCalculating,
  } = useIndicators();

  // Use external calculationResults if provided, otherwise use internal ones
  const finalCalculationResults =
    calculationResults && calculationResults.length > 0
      ? calculationResults
      : internalCalculationResults;

  // Debug when calculation results change
  React.useEffect(() => {
    if (finalCalculationResults.length > 0) {
      console.log("Calculation results updated:", finalCalculationResults);
    }
  }, [finalCalculationResults]);

  // Update the options when selected indicators change
  React.useEffect(() => {
    setOptions((prev: NiftyChartOptions) => ({
      ...prev,
      indicators: selectedIndicators,
    }));
  }, [selectedIndicators]);

  // Update options when calculation results change
  React.useEffect(() => {
    setOptions((prev: NiftyChartOptions) => ({
      ...prev,
      calculationResults: finalCalculationResults,
    }));
  }, [finalCalculationResults]);

  // Function to toggle volume display
  const toggleVolume = () => {
    setOptions((prev: NiftyChartOptions) => ({
      ...prev,
      showVolume: !prev.showVolume,
    }));
  };

  // Function to switch theme
  const toggleTheme = () => {
    setOptions((prev: NiftyChartOptions) => ({
      ...prev,
      theme: prev.theme === "dark" ? "light" : "dark",
    }));
  };

  // Function to change timeframe
  const changeTimeframe = (newDays: number) => {
    setTimeframe(newDays);
  };

  const toggleIndicatorsModal = () => {
    setIsIndicatorModalOpen(!isIndicatorModalOpen);
  };

  // Function to trigger indicator calculation when the calculate button is clicked
  const handleCalculateIndicators = async () => {
    if (selectedIndicators.length === 0) {
      alert("Please select at least one indicator first");
      return;
    }

    console.log("Starting indicator calculation with:", selectedIndicators);

    try {
      const results = await calculateSelectedIndicators();
      console.log("Calculation completed successfully:", results);
    } catch (err) {
      console.error("Error calculating indicators:", err);
      alert("Failed to calculate indicators. Please try again.");
    }
  };

  // If there's an error, display it
  if (error && !data.length) {
    return (
      <div className={twMerge("flex w-full flex-col", className)} style={style}>
        <div className="p-5 text-center text-red-600">
          Error loading chart data: {error.message}
        </div>
        <button
          onClick={() => refetch()}
          className="mx-auto rounded bg-red-500 px-3 py-2 text-white hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={twMerge("flex w-full flex-col", className)} style={style}>
      {/* Data source notification */}
      {isUsingMockData && (
        <div className="mb-3 flex items-center justify-center rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertCircle className="mr-2 h-4 w-4" />
          Using simulated data.
          <button
            onClick={refetch}
            className="ml-2 cursor-pointer text-amber-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Chart controls */}
      <div className="mb-3 flex justify-between py-2.5">
        <div className="flex space-x-2">
          <button
            onClick={toggleVolume}
            className="rounded border border-gray-300 bg-gray-50 px-3 py-2 hover:bg-gray-100"
          >
            {options.showVolume ? "Hide Volume" : "Show Volume"}
          </button>

          <button
            onClick={toggleTheme}
            className="rounded border border-gray-300 bg-gray-50 px-3 py-2 hover:bg-gray-100"
          >
            {options.theme === "dark" ? "Light Theme" : "Dark Theme"}
          </button>

          <button
            onClick={toggleIndicatorsModal}
            className={`rounded border px-3 py-2 ${
              selectedIndicators.length > 0
                ? "border-green-500 bg-green-500 text-white hover:bg-green-600"
                : "border-gray-300 bg-gray-50 hover:bg-gray-100"
            }`}
          >
            Indicators{" "}
            {selectedIndicators.length > 0 && `(${selectedIndicators.length})`}
          </button>

          {selectedIndicators.length > 0 && (
            <button
              onClick={handleCalculateIndicators}
              disabled={isCalculating}
              className="rounded bg-green-500 px-3 py-2 font-bold text-white hover:bg-green-600 disabled:opacity-50"
            >
              {isCalculating ? "Calculating..." : "Calculate Indicators"}
            </button>
          )}

          <button
            onClick={refetch}
            className="flex items-center rounded border border-gray-300 bg-gray-50 px-3 py-2 hover:bg-gray-100"
          >
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Refresh Data
          </button>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => changeTimeframe(7)}
            className={`rounded border px-3 py-2 ${
              timeframe === 7
                ? "border-gray-400 bg-gray-200"
                : "border-gray-300 bg-gray-50 hover:bg-gray-100"
            }`}
          >
            7D
          </button>

          <button
            onClick={() => changeTimeframe(30)}
            className={`rounded border px-3 py-2 ${
              timeframe === 30
                ? "border-gray-400 bg-gray-200"
                : "border-gray-300 bg-gray-50 hover:bg-gray-100"
            }`}
          >
            1M
          </button>

          <button
            onClick={() => changeTimeframe(90)}
            className={`rounded border px-3 py-2 ${
              timeframe === 90
                ? "border-gray-400 bg-gray-200"
                : "border-gray-300 bg-gray-50 hover:bg-gray-100"
            }`}
          >
            3M
          </button>

          <button
            onClick={() => changeTimeframe(180)}
            className={`rounded border px-3 py-2 ${
              timeframe === 180
                ? "border-gray-400 bg-gray-200"
                : "border-gray-300 bg-gray-50 hover:bg-gray-100"
            }`}
          >
            6M
          </button>

          <button
            onClick={() => changeTimeframe(365)}
            className={`rounded border px-3 py-2 ${
              timeframe === 365
                ? "border-gray-400 bg-gray-200"
                : "border-gray-300 bg-gray-50 hover:bg-gray-100"
            }`}
          >
            1Y
          </button>
        </div>
      </div>

      {/* The chart itself */}
      <NiftyChart data={data} options={options} loading={chartLoading} />

      {/* Indicator charts below the main chart */}
      {finalCalculationResults.length > 0 && (
        <IndicatorCharts
          calculationResults={finalCalculationResults}
          indicatorSchema={indicatorSchema}
          theme={options.theme}
          dates={data.map((item: NiftyDataPoint) => item.date)}
        />
      )}

      {/* Indicator selector modal */}
      <IndicatorSelector
        isOpen={isIndicatorModalOpen}
        onClose={toggleIndicatorsModal}
        indicatorSchema={indicatorSchema}
        selectedIndicators={selectedIndicators}
        onAddIndicator={addIndicator}
        onRemoveIndicator={removeIndicator}
        onUpdateIndicator={updateIndicatorParameter}
        onToggleIndicator={toggleIndicator}
        onCalculate={handleCalculateIndicators}
        isLoading={indicatorsLoading}
      />

      <div className="mt-3 text-center text-xs text-gray-500">
        Data source: {isUsingMockData ? "Simulated data" : "dev.api.tusta.co"}
      </div>
    </div>
  );
};

export default NiftyChartContainer;
