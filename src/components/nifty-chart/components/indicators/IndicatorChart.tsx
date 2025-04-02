import React from "react";
import ReactECharts from "echarts-for-react";

interface IndicatorChartProps {
  indicator: string;
  indicatorName: string;
  data: Record<string, number[]>;
  dates: string[];
  schema: any;
  theme?: "light" | "dark";
}

const IndicatorChart: React.FC<IndicatorChartProps> = ({
  indicator,
  indicatorName,
  data,
  dates,
  schema,
  theme = "light",
}) => {
  console.log("IndicatorChart rendering:", {
    indicator,
    indicatorName,
    dataKeys: Object.keys(data || {}),
    datesLength: dates?.length,
    schemaAvailable: !!schema,
  });

  if (!data || Object.keys(data).length === 0) {
    console.log("No data available for indicator:", indicator);
    return null;
  }

  // Base text color based on theme
  const textColor = theme === "dark" ? "#e5e7eb" : "#1f2937";

  // Colors for different lines using Tailwind colors
  const colors = [
    "#3b82f6", // blue-500
    "#ef4444", // red-500
    "#22c55e", // green-500
    "#f97316", // orange-500
    "#a855f7", // purple-500
    "#795548", // brown
    "#64748b", // slate-500
    "#ec4899", // pink-500
    "#7c3aed", // violet-600
  ];

  // Check if we have timestamps in the data
  const hasTimestamps =
    data.timestamps &&
    Array.isArray(data.timestamps) &&
    data.timestamps.length > 0;

  console.log("Chart data details:", {
    hasTimestamps,
    dataFields: Object.keys(data),
    timestampsLength: data.timestamps?.length,
    valueLength: data.value?.length,
  });

  // Ensure we have valid data to display
  if (Object.keys(data).every((key) => !data[key] || data[key].length === 0)) {
    console.log("No valid data to display for indicator:", indicator);
    return null;
  }

  // Generate series for each output field
  const series = Object.entries(data)
    .map(([field, values], index) => {
      // Skip timestamps field as it's used for x-axis
      if (
        field === "timestamps" ||
        field === "timestamp" ||
        !values ||
        values.length === 0
      )
        return null;

      // Get the description from the schema if available
      const fieldDescription = schema?.output?.[field]?.description || field;

      console.log(`Creating series for field: ${field}`, {
        fieldDescription,
        valuesLength: values.length,
        firstFewValues: values.slice(0, 5),
      });

      return {
        name: `${fieldDescription}`,
        type: "line",
        // Use simple index-based data points rather than timestamps
        data: values.map((value, i) => value),
        symbol: "none",
        smooth: true,
        lineStyle: {
          color: colors[index % colors.length],
          width: 2,
        },
      };
    })
    .filter(Boolean);

  // Generate option for echarts
  const option = {
    title: {
      text: indicatorName,
      left: "center",
      textStyle: {
        color: textColor,
        fontSize: 14,
      },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor:
        theme === "dark" ? "rgba(31, 41, 55, 0.7)" : "rgba(243, 244, 246, 0.7)",
      borderWidth: 1,
      borderColor: theme === "dark" ? "#374151" : "#e5e7eb",
      textStyle: {
        color: textColor,
      },
      formatter: function (params: any) {
        let tooltipStr = "";

        params.forEach((param: any) => {
          let valueDisplay = "N/A";
          const value = param.value;

          // Check if value is a number before using toFixed
          if (value !== null && value !== undefined) {
            if (typeof value === "number" && !isNaN(value)) {
              valueDisplay = value.toFixed(2);
            } else {
              valueDisplay = String(value);
            }
          }

          tooltipStr += `<div style="color:${param.color}">
            <span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${param.color}"></span>
            ${param.seriesName}: ${valueDisplay}
          </div>`;
        });

        return tooltipStr;
      },
    },
    legend: {
      data: Object.keys(data)
        .filter((key) => key !== "timestamps" && key !== "timestamp")
        .map((key) => schema?.output?.[key]?.description || key),
      top: 30,
      textStyle: {
        color: textColor,
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: "60px",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      axisLine: { lineStyle: { color: textColor } },
      axisLabel: {
        color: textColor,
        show: false, // Hide x-axis labels entirely
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      axisLine: { lineStyle: { color: textColor } },
      axisLabel: { color: textColor },
      splitLine: {
        show: true,
        lineStyle: { color: theme === "dark" ? "#374151" : "#e5e7eb" },
      },
    },
    dataZoom: [
      {
        type: "inside",
        start: 50,
        end: 100,
      },
    ],
    series,
  };

  return (
    <div
      className={`mb-4 rounded-md p-2.5 shadow-sm ${
        theme === "dark" ? "bg-gray-800" : "bg-gray-100"
      }`}
    >
      <ReactECharts
        option={option}
        className="h-[200px] w-full"
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
};

export default IndicatorChart;
