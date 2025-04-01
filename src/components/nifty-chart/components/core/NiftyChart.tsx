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
    setChartOptions(generateNiftyChartOptions(data, options));
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
