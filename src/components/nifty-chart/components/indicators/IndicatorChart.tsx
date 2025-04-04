import React, { useRef, useEffect } from "react";
import ReactECharts from "echarts-for-react";

interface IndicatorChartProps {
  indicator: string;
  indicatorName: string;
  data: Record<string, number[]>;
  dates: string[];
  schema: any;
  theme?: "light" | "dark";
  compact?: boolean;
}

const IndicatorChart: React.FC<IndicatorChartProps> = ({
  indicator,
  indicatorName,
  data,
  dates,
  schema,
  theme = "light",
  compact = false,
}) => {
  const chartRef = useRef<ReactECharts>(null);

  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  // Base text color based on theme
  const textColor = theme === "dark" ? "#e5e7eb" : "#1f2937";
  const bgColor = theme === "dark" ? "transparent" : "transparent";
  const gridColor =
    theme === "dark" ? "rgba(80, 90, 102, 0.2)" : "rgba(180, 190, 200, 0.3)";
  const zeroLineColor =
    theme === "dark" ? "rgba(156, 163, 175, 0.4)" : "rgba(156, 163, 175, 0.4)";

  // TradingView-like colors for different lines
  const colors = [
    "#2196F3", // blue - primary
    "#FF5252", // red
    "#4CAF50", // green
    "#FFC107", // amber
    "#9C27B0", // purple
    "#FF9800", // orange
    "#607D8B", // blue-grey
    "#E91E63", // pink
    "#673AB7", // deep purple
  ];

  // Ensure we have valid data to display
  if (Object.keys(data).every((key) => !data[key] || data[key].length === 0)) {
    return null;
  }

  // Handle chart resize
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && chartRef.current.getEchartsInstance) {
        const chart = chartRef.current.getEchartsInstance();
        chart.resize();
      }
    };

    window.addEventListener("resize", handleResize);

    // Create a resize observer to detect container size changes
    if (typeof ResizeObserver !== "undefined" && chartRef.current) {
      const ro = new ResizeObserver(handleResize);
      const element = chartRef.current.ele;
      if (element) {
        ro.observe(element);
        return () => {
          ro.unobserve(element);
          ro.disconnect();
          window.removeEventListener("resize", handleResize);
        };
      }
    }

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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

      // For some indicators that typically use specific visualization types
      let seriesType = "line";
      let areaStyle = undefined;
      let barWidth = undefined;
      let itemStyle = undefined;

      // Set special styling for certain known indicators
      if (
        indicator.toLowerCase().includes("rsi") ||
        indicator.toLowerCase().includes("relative_strength")
      ) {
        // Add overbought/oversold levels for RSI
        if (field.toLowerCase().includes("value")) {
          areaStyle = {
            opacity: 0.1,
            color: colors[index % colors.length],
          };
        }
      }

      // MACD histogram typically uses bars
      if (
        indicator.toLowerCase().includes("macd") &&
        field.toLowerCase().includes("histogram")
      ) {
        seriesType = "bar";
        barWidth = 4;
        itemStyle = {
          color: (params: any) => {
            return params.value >= 0 ? "#4CAF50" : "#FF5252";
          },
        };
      }

      return {
        name: `${fieldDescription}`,
        type: seriesType,
        barWidth: barWidth,
        itemStyle: itemStyle,
        // Use simple index-based data points rather than timestamps
        data: values.map((value) => value),
        symbol: "none",
        smooth: false, // TradingView charts typically have straight lines, not smooth
        lineStyle: {
          color: colors[index % colors.length],
          width: compact ? 1.5 : 2,
        },
        areaStyle: areaStyle,
        z: 2,
      };
    })
    .filter(Boolean);

  // Add reference lines for certain indicators
  const markLines = [];

  // Add reference lines based on indicator type
  if (indicator.toLowerCase().includes("rsi")) {
    // Add overbought (70) and oversold (30) lines for RSI
    markLines.push({
      silent: true,
      symbol: "none",
      lineStyle: {
        color:
          theme === "dark"
            ? "rgba(220, 38, 38, 0.4)"
            : "rgba(220, 38, 38, 0.4)",
        type: "dashed",
        width: 1,
      },
      label: {
        formatter: "70",
        position: "end",
        color:
          theme === "dark"
            ? "rgba(220, 38, 38, 0.8)"
            : "rgba(220, 38, 38, 0.8)",
        fontSize: 10,
        distance: [0, -4],
      },
      yAxis: 70,
    });

    markLines.push({
      silent: true,
      symbol: "none",
      lineStyle: {
        color:
          theme === "dark"
            ? "rgba(5, 150, 105, 0.4)"
            : "rgba(5, 150, 105, 0.4)",
        type: "dashed",
        width: 1,
      },
      label: {
        formatter: "30",
        position: "end",
        color:
          theme === "dark"
            ? "rgba(5, 150, 105, 0.8)"
            : "rgba(5, 150, 105, 0.8)",
        fontSize: 10,
        distance: [0, -4],
      },
      yAxis: 30,
    });

    // Add centerline for RSI (50)
    markLines.push({
      silent: true,
      symbol: "none",
      lineStyle: {
        color: zeroLineColor,
        type: "dashed",
        width: 1,
      },
      label: {
        formatter: "50",
        position: "end",
        color:
          theme === "dark"
            ? "rgba(156, 163, 175, 0.7)"
            : "rgba(156, 163, 175, 0.7)",
        fontSize: 10,
        distance: [0, -4],
      },
      yAxis: 50,
    });
  } else if (indicator.toLowerCase().includes("stochastic")) {
    // Add overbought (80) and oversold (20) lines for Stochastic
    markLines.push({
      silent: true,
      symbol: "none",
      lineStyle: {
        color:
          theme === "dark"
            ? "rgba(220, 38, 38, 0.4)"
            : "rgba(220, 38, 38, 0.4)",
        type: "dashed",
        width: 1,
      },
      label: {
        formatter: "80",
        position: "end",
        color:
          theme === "dark"
            ? "rgba(220, 38, 38, 0.8)"
            : "rgba(220, 38, 38, 0.8)",
        fontSize: 10,
        distance: [0, -4],
      },
      yAxis: 80,
    });

    markLines.push({
      silent: true,
      symbol: "none",
      lineStyle: {
        color:
          theme === "dark"
            ? "rgba(5, 150, 105, 0.4)"
            : "rgba(5, 150, 105, 0.4)",
        type: "dashed",
        width: 1,
      },
      label: {
        formatter: "20",
        position: "end",
        color:
          theme === "dark"
            ? "rgba(5, 150, 105, 0.8)"
            : "rgba(5, 150, 105, 0.8)",
        fontSize: 10,
        distance: [0, -4],
      },
      yAxis: 20,
    });
  } else if (
    indicator.toLowerCase().includes("macd") ||
    indicator.toLowerCase().includes("average_convergence") ||
    indicator.toLowerCase().includes("moving_average_convergence") ||
    indicator.toLowerCase().includes("histogram")
  ) {
    // Add zero line for MACD
    markLines.push({
      silent: true,
      symbol: "none",
      lineStyle: {
        color: zeroLineColor,
        type: "dashed",
        width: 1,
      },
      label: {
        formatter: "0",
        position: "end",
        color:
          theme === "dark"
            ? "rgba(156, 163, 175, 0.7)"
            : "rgba(156, 163, 175, 0.7)",
        fontSize: 10,
        distance: [0, -4],
      },
      yAxis: 0,
    });
  }

  // Generate option for echarts with TradingView-like styling
  const option = {
    backgroundColor: bgColor,
    title: indicatorName
      ? {
          text: indicatorName,
          left: "center",
          textStyle: {
            color: textColor,
            fontSize: 12,
            fontWeight: "normal",
          },
        }
      : { show: false },
    animation: false,
    tooltip: {
      trigger: "axis",
      backgroundColor:
        theme === "dark" ? "rgba(30, 30, 30, 0.9)" : "rgba(255, 255, 255, 0.9)",
      borderWidth: 1,
      borderColor: theme === "dark" ? "#333" : "#ccc",
      textStyle: {
        color: textColor,
      },
      formatter: function (params: any) {
        let tooltipStr = "";

        // First add the date/time if available
        if (params[0] && params[0].dataIndex !== undefined) {
          const index = params[0].dataIndex;
          if (dates && dates[index]) {
            tooltipStr += `<div style="font-size:11px;color:${textColor};margin-bottom:3px;font-weight:bold">${dates[index]}</div>`;
          }
        }

        // Then add each value
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

          tooltipStr += `<div style="color:${
            param.color || param.seriesName.color || textColor
          };font-size:11px;line-height:1.2">
            <span style="display:inline-block;margin-right:4px;border-radius:9px;width:9px;height:9px;background-color:${
              param.color
            }"></span>
            ${param.seriesName}: ${valueDisplay}
          </div>`;
        });

        return tooltipStr;
      },
    },
    legend: {
      show: true,
      type: "scroll",
      orient: "horizontal",
      top: 0,
      right: 8,
      itemWidth: 8,
      itemHeight: 8,
      textStyle: {
        color: textColor,
        fontSize: 10,
      },
      pageButtonPosition: "end",
      data: Object.keys(data)
        .filter((key) => key !== "timestamps" && key !== "timestamp")
        .map((key) => schema?.output?.[key]?.description || key),
    },
    grid: {
      left: "3%",
      right: "5%",
      bottom: "8%",
      top: "24px",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        show: false, // Hide x-axis labels
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      position: "right", // TradingView typically has y-axis labels on the right
      scale: true, // Scale the y-axis automatically to the data
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: textColor,
        fontSize: 10,
        formatter: (value: number) =>
          Math.abs(value) > 10 ? value.toFixed(0) : value.toFixed(1),
        inside: false,
        align: "right",
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: gridColor,
          width: 1,
          type: "dashed",
        },
      },
    },
    series: [
      ...series,
      // Add markLine series if we have any
      markLines.length > 0
        ? {
            type: "line",
            markLine: {
              symbol: ["none", "none"],
              silent: true,
              data: markLines,
              z: 1,
            },
            data: [],
          }
        : null,
    ].filter(Boolean),
  };

  return (
    <div
      className={`w-full h-full ${
        theme === "dark" ? "bg-gray-900" : "bg-white"
      }`}
    >
      <ReactECharts
        ref={chartRef}
        option={option}
        className="w-full h-full"
        notMerge={true}
        lazyUpdate={false}
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
};

export default IndicatorChart;
