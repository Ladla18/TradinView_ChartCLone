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

    // Get chart options from the utils
    const baseOptions = generateNiftyChartOptions(data, options);

    // Use the options directly without modification
    setChartOptions(baseOptions);
  }, [data, options]);

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
      />
    </div>
  );
};

export default NiftyChart;
