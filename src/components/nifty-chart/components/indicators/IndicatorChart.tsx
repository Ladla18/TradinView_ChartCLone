import React from "react";
import ReactECharts from "echarts-for-react";
import { IndicatorCalculationResult, IndicatorSchema } from "../../types/index";

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
  const textColor = theme === "dark" ? "#ddd" : "#333";
  const backgroundColor = theme === "dark" ? "#333" : "#f5f5f5";

  // Colors for different lines
  const colors = [
    "#2196f3",
    "#f44336",
    "#4caf50",
    "#ff9800",
    "#9c27b0",
    "#795548",
    "#607d8b",
    "#e91e63",
    "#673ab7",
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
  if (
    (hasTimestamps && (!data.value || data.value.length === 0)) ||
    (!hasTimestamps &&
      Object.keys(data).every((key) => !data[key] || data[key].length === 0))
  ) {
    console.log("No valid data to display for indicator:", indicator);
    return null;
  }

  // Generate series for each output field
  const series = Object.entries(data)
    .map(([field, values], index) => {
      // Skip timestamps field as it's used for x-axis
      if (field === "timestamps" || !values || values.length === 0) return null;

      // Get the description from the schema if available
      const fieldDescription = schema?.output?.[field]?.description || field;

      return {
        name: `${fieldDescription}`,
        type: "line",
        data:
          hasTimestamps && data.timestamps && values
            ? data.timestamps.map((time, i) => [time, values[i] || null])
            : values,
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
        theme === "dark" ? "rgba(50,50,50,0.7)" : "rgba(255,255,255,0.7)",
      borderWidth: 1,
      borderColor: theme === "dark" ? "#555" : "#ddd",
      textStyle: {
        color: textColor,
      },
      formatter: function (params: any) {
        const date = new Date(params[0].value[0]);
        const dateStr = date.toLocaleString();
        let tooltipStr = `<div>${dateStr}</div>`;

        params.forEach((param: any) => {
          tooltipStr += `<div style="color:${param.color}">
            <span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${
              param.color
            }"></span>
            ${param.seriesName}: ${param.value[1].toFixed(2)}
          </div>`;
        });

        return tooltipStr;
      },
    },
    legend: {
      data: Object.keys(data)
        .filter((key) => key !== "timestamps")
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
      type: hasTimestamps ? "time" : "category",
      data: !hasTimestamps ? dates : undefined,
      boundaryGap: false,
      axisLine: { lineStyle: { color: textColor } },
      axisLabel: {
        color: textColor,
        formatter: hasTimestamps
          ? (value: number) => {
              const date = new Date(value);
              return `${date.getHours()}:${date
                .getMinutes()
                .toString()
                .padStart(2, "0")}`;
            }
          : (value: string) => {
              return value.slice(5); // Remove year part
            },
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      axisLine: { lineStyle: { color: textColor } },
      axisLabel: { color: textColor },
      splitLine: {
        show: true,
        lineStyle: { color: theme === "dark" ? "#444" : "#eee" },
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
      style={{
        marginBottom: "15px",
        backgroundColor,
        borderRadius: "4px",
        padding: "10px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
      }}
    >
      <ReactECharts
        option={option}
        style={{ height: "200px", width: "100%" }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
};

export default IndicatorChart;
