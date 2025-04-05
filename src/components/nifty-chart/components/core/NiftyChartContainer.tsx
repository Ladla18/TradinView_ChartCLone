import React, { useState, useEffect, useRef } from "react";
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
  const [isResizing, setIsResizing] = useState(false);
  const [customIndicatorHeight, setCustomIndicatorHeight] = useState<
    number | null
  >(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeStartPos = useRef<number>(0);
  const initialHeights = useRef<{ main: number; indicators: number }>({
    main: 0,
    indicators: 0,
  });
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
  const hasBelowIndicators = belowChartIndicators.length > 0;

  // Calculate dynamic heights based on indicators
  const getChartHeights = () => {
    const totalHeight = "calc(100vh - 100px)"; // Total available height

    if (!hasBelowIndicators) {
      return {
        mainChart: totalHeight,
        indicators: "0px",
      };
    }

    // If user has manually resized, use that height
    if (customIndicatorHeight !== null) {
      return {
        mainChart: `calc(100vh - 100px - ${customIndicatorHeight}px)`,
        indicators: `${customIndicatorHeight}px`,
      };
    }

    // For default height calculations, consider the number of indicators
    // Base starting height is dependent on the number of indicators
    const baseHeight =
      belowChartIndicators.length === 1
        ? 200 // Single indicator
        : Math.min(belowChartIndicators.length * 150, 400); // Multiple indicators, but capped

    // When indicators are present, allocate height based on indicator count
    return {
      mainChart: `calc(100vh - 100px - ${baseHeight}px)`,
      indicators: `${baseHeight}px`,
    };
  };

  const [heights, setHeights] = useState(getChartHeights());

  // Update heights when indicators change
  useEffect(() => {
    // Reset custom indicator height when indicators change
    if (!hasBelowIndicators) {
      setCustomIndicatorHeight(null);
    }
    setHeights(getChartHeights());
  }, [belowChartIndicators.length]);

  // Add a resize handler to update heights when window is resized
  useEffect(() => {
    const handleResize = () => {
      setHeights(getChartHeights());
    };

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [belowChartIndicators.length]);

  // Handle main resize divider interactions
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartPos.current = e.clientY;

    // Store initial heights for calculation
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const totalHeight = containerRect.height;

      // Parse current heights
      let mainHeight = 0;
      let indicatorHeight = 0;

      if (typeof heights.indicators === "string") {
        // Try to extract numeric value
        const indicatorMatch = heights.indicators.match(/(\d+)px/);

        if (indicatorMatch) {
          indicatorHeight = parseInt(indicatorMatch[1], 10);
          mainHeight = totalHeight - indicatorHeight;
        } else {
          // Default to percentage-based calculation
          mainHeight = totalHeight * 0.7;
          indicatorHeight = totalHeight * 0.3;
        }
      }

      initialHeights.current = {
        main: mainHeight,
        indicators: indicatorHeight,
      };
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const deltaY = e.clientY - resizeStartPos.current;

    // Adjust indicator height, ensuring:
    // 1. Minimum height to fit all indicators (at least 30px per indicator, minimum 120px total)
    // 2. Maximum of 60% of window height
    // 3. Minimum main chart height of 200px
    const minIndicatorCount = belowChartIndicators.length;
    const minIndicatorHeight = Math.max(120, minIndicatorCount * 40);
    const maxIndicatorHeight = Math.min(
      window.innerHeight * 0.6,
      window.innerHeight - 200 // Ensure at least 200px for main chart
    );

    // Calculate the new height with constraints
    const newIndicatorHeight = Math.max(
      minIndicatorHeight,
      Math.min(initialHeights.current.indicators - deltaY, maxIndicatorHeight)
    );

    setCustomIndicatorHeight(newIndicatorHeight);
    setHeights({
      mainChart: `calc(100vh - 100px - ${newIndicatorHeight}px)`,
      indicators: `${newIndicatorHeight}px`,
    });
  };

  // Add a double-click handler to reset to auto height
  const handleDoubleClick = () => {
    setCustomIndicatorHeight(null);
    setHeights(getChartHeights());
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  // Add event listeners for resize
  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing]);

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

      {/* Main chart section with dynamic height */}
      <div
        className="flex flex-col w-full"
        style={{ height: heights.mainChart }}
      >
        <NiftyChart
          data={data}
          options={options}
          loading={chartLoading}
          style={{ height: "100%" }}
          onDataZoomChange={handleDataZoomChange}
        />
      </div>

      {/* Resizable handle - only shown when below indicators exist */}
      {hasBelowIndicators && (
        <div
          className={`w-full h-2 cursor-ns-resize border-t border-b ${
            options.theme === "dark"
              ? "border-gray-700 bg-gray-800"
              : "border-gray-300 bg-gray-100"
          } hover:bg-blue-500 hover:bg-opacity-20 flex items-center justify-center`}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
        >
          <div
            className={`w-16 h-1 ${
              options.theme === "dark" ? "bg-gray-600" : "bg-gray-400"
            }`}
          ></div>
        </div>
      )}

      {/* Indicator charts area */}
      {hasBelowIndicators && (
        <div
          className="w-full overflow-hidden"
          style={{ height: heights.indicators }}
        >
          <IndicatorCharts
            calculationResults={finalCalculationResults}
            indicatorSchema={indicatorSchema}
            theme={options.theme}
            dates={data.map((item: NiftyDataPoint) =>
              item.time ? `${item.date} ${item.time}` : item.date
            )}
            dataZoom={dataZoomState}
          />
        </div>
      )}

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
