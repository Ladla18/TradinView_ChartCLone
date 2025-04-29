import React, { useState, useRef } from "react";
import NiftyChart from "./NiftyChart";
import { useNiftyData } from "../../hooks/useNiftyData";
import { useIndicators } from "../../hooks/useIndicators";
import {
  NiftyChartOptions,
  NiftyDataPoint,
  IndicatorCalculationResult,
} from "../../types/index";
import IndicatorSelector from "../indicators/IndicatorSelector";
import AddIndicatorModal from "../modals/AddIndicatorModal";
import ChartControls from "./ChartControls";
import { twMerge } from "tailwind-merge";

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
  className = "",
  style = {},
  apiUrl = "https://dev.api.tusta.co/charts/get_csv_data",
  calculationResults = [],
}) => {
  const [options, setOptions] = useState<NiftyChartOptions>(initialOptions);
  const [timeframe, setTimeframe] = useState<string>("1M");
  const [isIndicatorModalOpen, setIsIndicatorModalOpen] = useState(false);
  const [isAddIndicatorModalOpen, setIsAddIndicatorModalOpen] = useState(false);
  const [externalIndicatorData, setExternalIndicatorData] = useState<
    IndicatorCalculationResult[]
  >([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dataZoomState, setDataZoomState] = useState<{
    start: number;
    end: number;
  }>({
    start: 0,
    end: 100,
  });

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

  // Check if there are below chart indicators
  const belowChartIndicators = finalCalculationResults.filter(
    (result) => result.position === "below"
  );


  // Debug when calculation results change
  React.useEffect(() => {
    if (finalCalculationResults.length > 0) {
      console.log("Calculation results updated:", finalCalculationResults);
    }
  }, [finalCalculationResults]);

  // Update the options when selected indicators change
  React.useEffect(() => {
    console.log(
      "[NiftyChartContainer] Selected indicators changed:",
      selectedIndicators
    );
    setOptions((prev: NiftyChartOptions) => ({
      ...prev,
      indicators: selectedIndicators,
    }));
  }, [selectedIndicators]);

  // Update options when calculation results change
  React.useEffect(() => {
    console.log("[NiftyChartContainer] Calculation results updated:", {
      total: finalCalculationResults.length,
      onChart: finalCalculationResults.filter((r) => r.position === "on_chart")
        .length,
      below: finalCalculationResults.filter((r) => r.position === "below")
        .length,
    });
    setOptions((prev: NiftyChartOptions) => ({
      ...prev,
      calculationResults: finalCalculationResults,
    }));
  }, [finalCalculationResults]);

  // Function to toggle volume
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
  const onTimeframeChange = (tf: string) => {
    setTimeframe(tf);
    // Convert timeframe string to days for API
    let days = 30;
    switch (tf) {
      case "7D":
        days = 7;
        break;
      case "1M":
        days = 30;
        break;
      case "3M":
        days = 90;
        break;
      case "6M":
        days = 180;
        break;
      case "1Y":
        days = 365;
        break;
    }
    // Update the chart timeframe
    console.log(`Changed timeframe to ${tf} (${days} days)`);
  };

  const toggleIndicatorsModal = () => {
    setIsIndicatorModalOpen(!isIndicatorModalOpen);
  };

  // Function to trigger indicator calculation when the calculate button is clicked
  const handleCalculateIndicators = async () => {
    if (selectedIndicators.length === 0) {
      console.log(
        "[NiftyChartContainer] No indicators selected for calculation"
      );
      alert("Please select at least one indicator first");
      return;
    }

    console.log("[NiftyChartContainer] Starting indicator calculation with:", {
      indicators: selectedIndicators.map((ind) => ({
        id: ind.id,
        active: ind.active,
        parameters: ind.parameters,
      })),
    });

    try {
      const results = await calculateSelectedIndicators();
      console.log("[NiftyChartContainer] Calculation completed successfully:", {
        total: results.length,
        indicators: results.map((r) => ({
          name: r.indicator,
          position: r.position,
          dataFields: Object.keys(r.data),
        })),
      });
    } catch (err) {
      console.error("[NiftyChartContainer] Error calculating indicators:", err);
      alert("Failed to calculate indicators. Please try again.");
    }
  };

  // Handle data from AddIndicatorModal
  const handleProcessedDataUpdate = (data: IndicatorCalculationResult[]) => {
    console.log(
      "[NiftyChartContainer] Received processed data from AddIndicatorModal:",
      {
        total: data.length,
        indicators: data.map((r) => ({
          name: r.indicator,
          position: r.position,
          dataFields: Object.keys(r.data),
        })),
      }
    );
    setExternalIndicatorData(data);

    // Create virtual selected indicators for on-chart indicators from AddIndicatorModal
    const onChartIndicators = data.filter(
      (result) => result.position === "on_chart"
    );

    if (onChartIndicators.length > 0) {
      console.log(
        "[NiftyChartContainer] Creating virtual indicators for on-chart display:",
        {
          count: onChartIndicators.length,
          indicators: onChartIndicators.map((r) => r.indicator),
        }
      );

      // Create temporary selected indicators for these
      const tempSelectedIndicators = onChartIndicators.map((result) => ({
        id: result.indicator,
        name: result.indicator,
        parameters: {},
        active: true,
      }));

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

  // Add this handler function
  const handleDataZoomChange = (values: { start: number; end: number }) => {
    setDataZoomState(values);
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

  // Convert selectedIndicators to string array for ChartControls
  const selectedIndicatorIds = selectedIndicators.map((ind) => ind.id);

  // Prepare the unified chart options that include both main chart and indicators
  const unifiedChartOptions: NiftyChartOptions = {
    ...options,
    showAllIndicators: true, // Flag to show all indicators in one chart
    belowIndicators: belowChartIndicators,
    timestamps: data.map((item: NiftyDataPoint) =>
      item.time ? `${item.date} ${item.time}` : item.date
    ),
    totalDataPoints: data.length,
    dataZoom: dataZoomState,
  };

  return (
    <div
      ref={containerRef}
      className={twMerge("flex w-full flex-col h-full relative", className)}
      style={style}
    >
      {/* Chart controls */}
      <ChartControls
        options={options}
        selectedIndicators={selectedIndicatorIds}
        isCalculating={isCalculating}
        timeframe={timeframe}
        onToggleVolume={toggleVolume}
        onToggleTheme={toggleTheme}
        onToggleIndicator={toggleIndicatorsModal}
        onCalculateIndicators={handleCalculateIndicators}
        onTimeframeChange={onTimeframeChange}
        onRefreshData={refetch}
      />

      {/* Unified chart containing both main chart and indicators */}
      <div className="flex flex-col w-full flex-grow">
        <NiftyChart
          data={data}
          options={unifiedChartOptions}
          loading={chartLoading}
          style={{ height: "100%" }}
          onDataZoomChange={handleDataZoomChange}
        />
      </div>

      {/* Modals */}
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

      {isAddIndicatorModalOpen && (
        <AddIndicatorModal
          onClose={() => setIsAddIndicatorModalOpen(false)}
          onAddIndicator={handleAddIndicator}
          onProcessedDataUpdate={handleProcessedDataUpdate}
        />
      )}
    </div>
  );
};

export default NiftyChartContainer;
