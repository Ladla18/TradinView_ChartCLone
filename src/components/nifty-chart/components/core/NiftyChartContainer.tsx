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
import { AlertCircle } from "lucide-react";
import AddIndicatorModal from "../modals/AddIndicatorModal";
import ChartControls from "./ChartControls";

interface NiftyChartContainerProps {
  initialOptions?: NiftyChartOptions;
  days?: number;
  className?: string;
  style?: React.CSSProperties;
  apiUrl?: string;
  calculationResults?: IndicatorCalculationResult[];
}

const NiftyChartContainer: React.FC<NiftyChartContainerProps> = ({
  initialOptions = {},
  days = 30,
  className = "",
  style = {},
  apiUrl = "https://dev.api.tusta.co/charts/get_csv_data",
  calculationResults = [],
}) => {
  const [options, setOptions] = useState<NiftyChartOptions>(initialOptions);
  const [timeframe, setTimeframe] = useState<number>(days);
  const [isIndicatorModalOpen, setIsIndicatorModalOpen] = useState(false);
  const [isAddIndicatorModalOpen, setIsAddIndicatorModalOpen] = useState(false);
  const [externalIndicatorData, setExternalIndicatorData] = useState<
    IndicatorCalculationResult[]
  >([]);

  const {
    data,
    loading: chartLoading,
    error,
    refetch,
  } = useNiftyData({
    days: 0, // Don't limit by days, show all data
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
      : externalIndicatorData.length > 0
      ? externalIndicatorData
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

  // Handle data from AddIndicatorModal
  const handleProcessedDataUpdate = (data: IndicatorCalculationResult[]) => {
    console.log("Received processed data from AddIndicatorModal:", data);
    setExternalIndicatorData(data);

    // Create virtual selected indicators for on-chart indicators from AddIndicatorModal
    // This is needed because the chart utils expects indicators in the selectedIndicators format
    const onChartIndicators = data.filter(
      (result) => result.position === "on_chart"
    );

    if (onChartIndicators.length > 0) {
      // Create temporary selected indicators for these
      const tempSelectedIndicators = onChartIndicators.map((result) => ({
        id: result.indicator,
        name: result.indicator,
        parameters: {},
        active: true,
      }));

      console.log(
        "Created virtual indicators for on-chart display:",
        tempSelectedIndicators
      );

      // Add these to the existing selected indicators
      setOptions((prev) => ({
        ...prev,
        indicators: [...(prev.indicators || []), ...tempSelectedIndicators],
      }));
    }
  };

  // Function to add indicator from AddIndicatorModal
  const handleAddIndicator = (indicator: any) => {
    console.log("Adding indicator from modal:", indicator);
    // If the indicator already has processedData, use it
    if (indicator.processedData) {
      handleProcessedDataUpdate(indicator.processedData);
    }
    setIsAddIndicatorModalOpen(false);
  };

  const toggleAddIndicatorModal = () => {
    setIsAddIndicatorModalOpen(!isAddIndicatorModalOpen);
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
      {/* Chart controls */}
      <ChartControls
        options={options}
        selectedIndicators={selectedIndicators}
        isCalculating={isCalculating}
        timeframe={timeframe}
        toggleVolume={toggleVolume}
        toggleTheme={toggleTheme}
        toggleIndicatorsModal={toggleIndicatorsModal}
        toggleAddIndicatorModal={toggleAddIndicatorModal}
        handleCalculateIndicators={handleCalculateIndicators}
        refetch={refetch}
        changeTimeframe={changeTimeframe}
      />

      {/* The chart itself */}
      <NiftyChart data={data} options={options} loading={chartLoading} />

      {/* Indicator charts below the main chart */}
      {finalCalculationResults.length > 0 && (
        <IndicatorCharts
          calculationResults={finalCalculationResults}
          indicatorSchema={indicatorSchema}
          theme={options.theme}
          dates={data.map((item: NiftyDataPoint) =>
            item.time ? `${item.date} ${item.time}` : item.date
          )}
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

      {/* Add Indicator Modal */}
      {isAddIndicatorModalOpen && (
        <AddIndicatorModal
          onClose={() => setIsAddIndicatorModalOpen(false)}
          onAddIndicator={handleAddIndicator}
          onProcessedDataUpdate={handleProcessedDataUpdate}
        />
      )}

      <div className="mt-3 text-center text-xs text-gray-500">
        Data source: dev.api.tusta.co
      </div>
    </div>
  );
};

export default NiftyChartContainer;
