import React, { useState, useEffect } from "react";
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
}

const NiftyChart: React.FC<NiftyChartProps> = ({
  data,
  options = {},
  loading = false,
  className = "",
  style = {},
}) => {
  const [chartOptions, setChartOptions] = useState(
    generateNiftyChartOptions(data, options)
  );

  // Update options when data or options change
  useEffect(() => {
    // Log the first few data points for debugging
    if (data.length > 0) {
      console.log("Received data sample:", data.slice(0, 3));
    }

    // Get base options from the chart utils
    const baseOptions = generateNiftyChartOptions(data, options);

    // Filter out the slider dataZoom and keep only the inside dataZoom
    const dataZoom = Array.isArray(baseOptions.dataZoom)
      ? baseOptions.dataZoom
          .filter((zoom) => zoom.type !== "slider") // Remove the slider zoom bar
          .map((zoom) => {
            if (zoom.type === "inside") {
              return {
                ...zoom,
                zoomOnMouseWheel: true,
                moveOnMouseMove: true,
                // Make zoom much slower (higher value = slower zoom)
                zoomRate: 200,
                // Minimum zoom size - prevent zooming in too far
                minSpan: 5,
                // Smoothness of zooming
                throttle: 10,
              };
            }
            return zoom;
          })
      : [];

    // If no inside dataZoom was found, add a new one
    const hasInsideZoom =
      Array.isArray(dataZoom) &&
      dataZoom.some((zoom) => zoom.type === "inside");

    // Get xAxisIndex from the existing dataZoom if available
    let xAxisIndex: number | number[] = 0;
    if (
      Array.isArray(baseOptions.dataZoom) &&
      baseOptions.dataZoom.length > 0
    ) {
      const firstZoom = baseOptions.dataZoom[0];
      if (firstZoom && "xAxisIndex" in firstZoom) {
        xAxisIndex = firstZoom.xAxisIndex as number | number[];
      }
    }

    if (!hasInsideZoom) {
      dataZoom.push({
        type: "inside",
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
        zoomRate: 200,
        minSpan: 5,
        throttle: 10,
        xAxisIndex: xAxisIndex,
      });
    }

    // Apply the customized dataZoom configuration
    const customOptions = {
      ...baseOptions,
      dataZoom: dataZoom,
    };

    setChartOptions(customOptions);
  }, [data, options]);

  // Custom height/width from style prop should override Tailwind classes
  const customStyle: React.CSSProperties = {
    height: style.height || "600px",
    width: style.width,
  };

  if (loading) {
    return (
      <div
        className={twMerge(
          "flex h-[600px] w-full items-center justify-center bg-gray-50 text-gray-600",
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
          "flex h-[600px] w-full items-center justify-center bg-gray-50 text-gray-600",
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
    <ReactECharts
      option={chartOptions}
      style={customStyle}
      className={twMerge("h-[600px] w-full", className)}
      notMerge={true}
      lazyUpdate={true}
    />
  );
};

export default NiftyChart;
