import React, { useState, useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";
import { NiftyDataPoint, NiftyChartOptions } from "../../types/index";
import { generateNiftyChartOptions } from "../../utils/chartUtils";
import { twMerge } from "tailwind-merge";

interface NiftyChartProps {
  data: NiftyDataPoint[];
  options?: NiftyChartOptions;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onDataZoomChange?: (values: { start: number; end: number }) => void;
  showXAxis?: boolean;
}

const NiftyChart: React.FC<NiftyChartProps> = ({
  data,
  options = {},
  loading = false,
  className = "",
  style = {},
  onDataZoomChange,
  showXAxis = true,
}) => {
  const [chartOptions, setChartOptions] = useState(
    generateNiftyChartOptions(data, options)
  );
  const chartRef = useRef<ReactECharts>(null);

  // Update options when data or options change
  useEffect(() => {
    // Get chart options from the utils
    const baseOptions = generateNiftyChartOptions(data, options);

    // Modify xAxis configuration to be fixed at the bottom
    if (baseOptions.xAxis && typeof baseOptions.xAxis === "object") {
      if (Array.isArray(baseOptions.xAxis)) {
        baseOptions.xAxis.forEach((axis) => {
          axis.axisLabel = {
            ...axis.axisLabel,
            show: showXAxis,
          };
          axis.position = "bottom";
          axis.axisTick = {
            ...axis.axisTick,
            alignWithLabel: true,
          };
        });
      } else {
        baseOptions.xAxis.axisLabel = {
          ...baseOptions.xAxis.axisLabel,
          show: showXAxis,
        };
        baseOptions.xAxis.position = "bottom";
        baseOptions.xAxis.axisTick = {
          ...baseOptions.xAxis.axisTick,
          alignWithLabel: true,
        };
      }
    }

    // Adjust grid to ensure x-axis is visible and fixed at bottom
    if (baseOptions.grid && typeof baseOptions.grid === "object") {
      if (!Array.isArray(baseOptions.grid)) {
        baseOptions.grid.bottom = showXAxis ? "10%" : "0%";
        baseOptions.grid.containLabel = true;
      }
    }

    // Use the modified options
    setChartOptions(baseOptions);
  }, [data, options, showXAxis]);

  // Handle zoom events from both slider and mouse wheel
  useEffect(() => {
    const chart = chartRef.current?.getEchartsInstance();
    if (chart) {
      // Handle all types of zoom events
      const handleZoom = (params: any) => {
        if (params.batch) {
          // Handle batch updates (usually from mouse wheel)
          const lastBatch = params.batch[params.batch.length - 1];
          onDataZoomChange?.({
            start: lastBatch.start,
            end: lastBatch.end,
          });
        } else {
          // Handle single updates (usually from slider)
          onDataZoomChange?.({
            start: params.start,
            end: params.end,
          });
        }
      };

      chart.on("datazoom", handleZoom);

      return () => {
        chart.off("datazoom", handleZoom);
      };
    }
  }, [onDataZoomChange]);

  // Custom height/width from style prop should override Tailwind classes
  const customStyle: React.CSSProperties = {
    height: style.height || "calc(100vh - 50px)", // Full viewport height minus some space for header/navigation
    width: style.width || "100%",
    margin: 0,
    padding: 0,
    overflow: "hidden",
  };

  if (loading) {
    return (
      <div
        className={twMerge(
          "flex h-[calc(100vh-50px)] w-full items-center justify-center bg-gray-50 text-gray-600",
          className
        )}
        style={customStyle}
      >
        <div className="flex flex-col items-center">
          <div className="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"></div>
          <p>Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        className={twMerge(
          "flex h-[calc(100vh-50px)] w-full items-center justify-center bg-gray-50 text-gray-600",
          className
        )}
        style={customStyle}
      >
        <div className="flex flex-col items-center">
          <div className="mb-3 text-4xl text-gray-300">📈</div>
          <p>No data available</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full p-0 m-0">
      <ReactECharts
        option={chartOptions}
        style={customStyle}
        className={twMerge("h-[calc(100vh-50px)] w-full p-0 m-0", className)}
        notMerge={true}
        lazyUpdate={true}
        ref={chartRef}
      />
    </div>
  );
};

export default NiftyChart;
