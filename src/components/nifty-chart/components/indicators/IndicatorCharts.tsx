import React, { useState, useRef, useEffect } from "react";
import IndicatorChart from "./IndicatorChart";
import { IndicatorSchema } from "../../types/index";
import {
  X,
  Minimize2,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from "lucide-react";

interface IndicatorChartsProps {
  calculationResults: {
    indicator: string;
    position: "on_chart" | "below";
    data: Record<string, number[]>;
  }[];
  indicatorSchema: IndicatorSchema | null;
  theme?: "light" | "dark";
  dates: string[];
}

const IndicatorCharts: React.FC<IndicatorChartsProps> = ({
  calculationResults,
  indicatorSchema,
  theme = "light",
  dates,
}) => {
  const [minimizedIndicators, setMinimizedIndicators] = useState<string[]>([]);
  const [indicatorHeights, setIndicatorHeights] = useState<
    Record<string, number>
  >({});
  const [resizing, setResizing] = useState<string | null>(null);
  const resizeStartPos = useRef<number>(0);
  const initialHeight = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  console.log("IndicatorCharts called with:", {
    resultsCount: calculationResults?.length || 0,
    indicatorSchemaExists: !!indicatorSchema,
    datesCount: dates?.length || 0,
  });

  if (!calculationResults || calculationResults.length === 0) {
    console.log("No calculationResults available");
    return null;
  }

  // Filter for indicators that should appear below the main chart
  const belowChartIndicators = calculationResults.filter(
    (result) =>
      result.position === "below" &&
      result.data &&
      Object.keys(result.data).length > 0
  );

  console.log("Below chart indicators found:", belowChartIndicators.length);
  belowChartIndicators.forEach((indicator) => {
    console.log(`Indicator: ${indicator.indicator}`, {
      position: indicator.position,
      dataFields: Object.keys(indicator.data),
      fieldsLength: Object.keys(indicator.data).map((key) => ({
        field: key,
        length: indicator.data[key]?.length,
      })),
    });
  });

  if (belowChartIndicators.length === 0) {
    console.log("No below chart indicators found");
    return null;
  }

  // Initialize default heights for each indicator if not already set
  useEffect(() => {
    const defaultHeight = 180; // Default height for each indicator
    const newHeights: Record<string, number> = {};
    let heightsChanged = false;

    belowChartIndicators.forEach((result) => {
      if (!indicatorHeights[result.indicator]) {
        newHeights[result.indicator] = defaultHeight;
        heightsChanged = true;
      } else {
        newHeights[result.indicator] = indicatorHeights[result.indicator];
      }
    });

    if (heightsChanged) {
      setIndicatorHeights(newHeights);
    }
  }, [belowChartIndicators.map((i) => i.indicator).join(",")]);

  // Toggle minimize for an indicator
  const toggleMinimize = (indicator: string) => {
    setMinimizedIndicators((prev) =>
      prev.includes(indicator)
        ? prev.filter((i) => i !== indicator)
        : [...prev, indicator]
    );
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, indicator: string) => {
    e.preventDefault();
    setResizing(indicator);
    resizeStartPos.current = e.clientY;
    initialHeight.current = indicatorHeights[indicator] || 180;
  };

  // Handle resize during mouse move
  useEffect(() => {
    const handleResize = (e: MouseEvent) => {
      if (!resizing) return;

      const deltaY = e.clientY - resizeStartPos.current;
      const newHeight = Math.max(
        100,
        Math.min(400, initialHeight.current + deltaY)
      );

      setIndicatorHeights((prev) => ({
        ...prev,
        [resizing]: newHeight,
      }));
    };

    const handleResizeEnd = () => {
      setResizing(null);
    };

    if (resizing) {
      window.addEventListener("mousemove", handleResize);
      window.addEventListener("mouseup", handleResizeEnd);
      return () => {
        window.removeEventListener("mousemove", handleResize);
        window.removeEventListener("mouseup", handleResizeEnd);
      };
    }
  }, [resizing]);

  // Each indicator will be in its own separate panel like TradingView
  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col overflow-hidden"
    >
      <div
        className={`w-full flex items-center justify-between py-1 px-2 ${
          theme === "dark"
            ? "bg-gray-800 text-white"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        <h3 className="text-xs font-medium m-0">Indicator Panels</h3>
      </div>

      <div className="flex-grow overflow-auto flex flex-col">
        {belowChartIndicators.map((result, index) => {
          const schema = indicatorSchema?.[result.indicator];
          if (!schema) {
            console.log(`No schema found for indicator: ${result.indicator}`);
            return null;
          }

          // Log the data structure for debugging
          console.log(`Data for ${result.indicator}:`, {
            keys: Object.keys(result.data),
            fieldCounts: Object.keys(result.data).map((field) => ({
              field,
              count: result.data[field]?.length || 0,
              hasValues: result.data[field] && result.data[field].length > 0,
              schemaOutput:
                schema.output?.[field]?.description || "Not in schema",
            })),
          });

          // Filter out timestamp fields before passing to the chart
          const filteredData = Object.fromEntries(
            Object.entries(result.data).filter(
              ([key]) => key !== "timestamps" && key !== "timestamp"
            )
          );

          // Check if data has any usable values after removing timestamps
          const hasData = Object.values(filteredData).some(
            (arr) => arr && arr.length > 0
          );

          if (!hasData) {
            console.log(`No usable data for ${result.indicator}`);
            return null;
          }

          const isMinimized = minimizedIndicators.includes(result.indicator);
          const isCurrentlyResizing = resizing === result.indicator;

          return (
            <div
              key={result.indicator}
              className={`w-full flex-shrink-0 ${index > 0 ? "border-t" : ""} ${
                theme === "dark" ? "border-gray-700" : "border-gray-300"
              } relative`}
              style={{
                height: isMinimized
                  ? 30
                  : indicatorHeights[result.indicator] || 180,
                transition: isCurrentlyResizing
                  ? "none"
                  : "height 0.2s ease-in-out",
              }}
            >
              {/* TradingView-style indicator panel header */}
              <div
                className={`w-full flex items-center justify-between px-2 py-1 ${
                  theme === "dark"
                    ? "bg-gray-800 text-gray-200"
                    : "bg-gray-100 text-gray-700"
                } border-b ${
                  theme === "dark" ? "border-gray-700" : "border-gray-300"
                }`}
              >
                <div className="flex items-center">
                  <span className="font-medium text-xs">
                    {schema.description}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => toggleMinimize(result.indicator)}
                    className={`p-0.5 rounded hover:bg-opacity-20 hover:bg-gray-500`}
                  >
                    {isMinimized ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronUp size={14} />
                    )}
                  </button>
                </div>
              </div>

              {/* Indicator chart body - shown only when not minimized */}
              {!isMinimized && (
                <div
                  className={`w-full h-[calc(100%-24px)] ${
                    theme === "dark" ? "bg-gray-900" : "bg-white"
                  }`}
                >
                  <IndicatorChart
                    indicator={result.indicator}
                    indicatorName="" // Empty as we're showing the title in the header
                    data={filteredData}
                    dates={dates}
                    schema={schema}
                    theme={theme}
                    compact={true}
                  />
                </div>
              )}

              {/* Resizable handle at the bottom of each indicator panel */}
              {!isMinimized && (
                <div
                  className={`absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize flex items-center justify-center ${
                    isCurrentlyResizing
                      ? "bg-blue-500"
                      : "hover:bg-blue-400 hover:bg-opacity-30"
                  }`}
                  onMouseDown={(e) => handleResizeStart(e, result.indicator)}
                >
                  <div className="w-10 flex items-center justify-center">
                    <GripVertical
                      size={8}
                      className={
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IndicatorCharts;
