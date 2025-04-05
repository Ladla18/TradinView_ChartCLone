import {
  NiftyDataPoint,
  NiftyChartOptions,
  IndicatorCalculationResult,
} from "../types/index";
import { EChartsOption } from "echarts";

export const generateNiftyChartOptions = (
  data: NiftyDataPoint[],
  options: NiftyChartOptions = {}
): EChartsOption => {
  console.log("[chartUtils] Generating chart options with:", {
    dataPoints: data.length,
    hasVolume: options.showVolume,
    theme: options.theme,
    selectedIndicators: options.indicators?.length || 0,
    calculationResults: options.calculationResults?.length || 0,
  });

  const {
    title = "Nifty 50 Index",
    showVolume = true,
    theme = "light",
    indicators = [],
  } = options;

  // Use data directly as received from API
  const chartData = data;

  // Prepare data for candlestick chart - format should be [open, close, low, high]
  const candlestickData = chartData.map((item) => [
    item.open,
    item.close,
    item.low,
    item.high,
  ]);
  console.log("candlestickData", candlestickData);

  // Prepare data for volume chart if needed
  const volumeData = showVolume
    ? chartData.map((item) => item.volume || 0)
    : [];

  // Base text color based on theme
  const textColor = theme === "dark" ? "#ddd" : "#333";

  // Get the on-chart indicators from the calculation results
  const onChartIndicators =
    options.calculationResults?.filter((result: IndicatorCalculationResult) => {
      // Check if it's an on-chart indicator
      if (result.position === "on_chart") {
        // If the indicators list is not empty, check if this indicator is active
        if (indicators && indicators.length > 0) {
          const isActive = indicators.some(
            (ind: { id: string; active: boolean }) =>
              ind.id === result.indicator && ind.active
          );
          console.log(
            `[chartUtils] Checking indicator ${result.indicator}: ${
              isActive ? "active" : "inactive"
            }`
          );
          return isActive;
        }
        return true;
      }
      return false;
    }) || [];

  console.log("[chartUtils] Filtered on-chart indicators:", {
    total: onChartIndicators.length,
    indicators: onChartIndicators.map((ind) => ({
      name: ind.indicator,
      fields: Object.keys(ind.data).filter(
        (k) => k !== "timestamps" && k !== "timestamp"
      ),
    })),
  });

  // Prepare dataset with chart data and indicators
  const sourceData = chartData.map((item, index) => {
    const dataPoint: any = {
      time: item.time ? `${item.date} ${item.time}` : item.date,
      open: item.open,
      close: item.close,
      low: item.low,
      high: item.high,
      volume: item.volume || 0,
    };

    // Add indicator fields if available
    onChartIndicators.forEach((indicatorResult) => {
      Object.entries(indicatorResult.data).forEach(([key, values]) => {
        if (
          key !== "timestamps" &&
          key !== "timestamp" &&
          Array.isArray(values)
        ) {
          // Instead of calculating offset, just use the same index
          // This will align indicator data with chart data from index 0
          if (index < values.length) {
            const fieldName = `${indicatorResult.indicator}_${key}`;
            dataPoint[fieldName] = values[index];
          }
        }
      });
    });

    return dataPoint;
  });

  const baseOption: EChartsOption = {
    title: {
      text: title,
      left: "center",
      textStyle: {
        color: textColor,
      },
    },
    dataset: {
      source: sourceData,
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
      },
      backgroundColor:
        theme === "dark" ? "rgba(50,50,50,0.7)" : "rgba(255,255,255,0.7)",
      borderWidth: 1,
      borderColor: theme === "dark" ? "#555" : "#ddd",
      textStyle: {
        color: textColor,
      },
      formatter: (params: any) => {
        // Find candlestick data
        const candlestickParam = params.find(
          (param: any) => param.seriesType === "candlestick"
        );

        if (!candlestickParam) return "";

        // Handle both dataset format and regular format
        let dateTime, open, close, low, high;

        if (
          candlestickParam.value &&
          typeof candlestickParam.value === "object"
        ) {
          // Using dataset format
          dateTime = candlestickParam.value.time;
          open = candlestickParam.value.open;
          close = candlestickParam.value.close;
          low = candlestickParam.value.low;
          high = candlestickParam.value.high;
        } else {
          // Using regular format
          dateTime = candlestickParam.axisValue;
          [open, close, low, high] = candlestickParam.data;
        }

        // Format the tooltip content with time
        let tooltipContent = `<div style="font-weight: bold; margin-bottom: 4px">${dateTime}</div>`;
        tooltipContent += `<div>Open: ${Number(open).toFixed(2)}</div>`;
        tooltipContent += `<div>Close: ${Number(close).toFixed(2)}</div>`;
        tooltipContent += `<div>Low: ${Number(low).toFixed(2)}</div>`;
        tooltipContent += `<div>High: ${Number(high).toFixed(2)}</div>`;

        // Add volume if available
        if (showVolume) {
          const volumeParam = params.find(
            (param: any) => param.seriesName === "Volume"
          );
          if (volumeParam) {
            let volume;
            if (volumeParam.value && typeof volumeParam.value === "object") {
              volume = volumeParam.value.volume;
            } else {
              volume = volumeParam.data;
            }

            // Add volume to tooltip
            const volumeColor =
              chartData[candlestickParam.dataIndex].close >=
              chartData[candlestickParam.dataIndex].open
                ? "rgba(20, 177, 67, 0.8)"
                : "rgba(239, 35, 42, 0.8)";

            tooltipContent += `<div style="color:${volumeColor}">Volume: ${Number(
              volume
            ).toLocaleString()}</div>`;
          }
        }

        // Group indicator values by indicator type
        const indicatorGroups: { [key: string]: any[] } = {};
        params.forEach((param: any) => {
          if (
            param.seriesType === "line" &&
            param.seriesName !== "Volume" &&
            param.seriesName !== "Nifty 50"
          ) {
            // Split the series name to get indicator name and field
            const parts = param.seriesName.split("_");
            const indicatorName = parts[0];
            if (!indicatorGroups[indicatorName]) {
              indicatorGroups[indicatorName] = [];
            }
            indicatorGroups[indicatorName].push(param);
          }
        });

        // Add indicator values grouped by indicator
        Object.entries(indicatorGroups).forEach(([indicatorName, params]) => {
          tooltipContent += `<div style="margin-top: 4px; font-weight: bold">${indicatorName}:</div>`;

          // Sort params to ensure consistent order (lower -> middle -> upper)
          params.sort((a, b) => {
            const order = ["lower_band", "middle_band", "upper_band", "value"];
            const aField = a.seriesName.split("_").slice(1).join("_");
            const bField = b.seriesName.split("_").slice(1).join("_");
            return order.indexOf(aField) - order.indexOf(bField);
          });

          params.forEach((param: any) => {
            // Get the field name by removing the indicator prefix
            const fieldName = param.seriesName.split("_").slice(1).join("_");

            // Get proper display name for the field
            let displayName: string;
            if (fieldName === "value") {
              displayName = "Value";
            } else if (fieldName === "upper_band") {
              displayName = "Upper Band";
            } else if (fieldName === "middle_band") {
              displayName = "Middle Band";
            } else if (fieldName === "lower_band") {
              displayName = "Lower Band";
            } else {
              // For any other fields, capitalize each word
              displayName = fieldName
                .split("_")
                .map(
                  (word: string) => word.charAt(0).toUpperCase() + word.slice(1)
                )
                .join(" ");
            }

            let value;
            if (param.value && typeof param.value === "object") {
              value = param.value[param.seriesName];
            } else {
              value = param.data;
            }

            tooltipContent += `<div style="color:${
              param.color
            }; padding-left: 8px;">
              ${displayName}: ${
              typeof value === "number" ? value.toFixed(2) : "N/A"
            }
            </div>`;
          });
        });

        return tooltipContent;
      },
    },
    legend: {
      data: [
        "Nifty 50",
        ...(showVolume ? ["Volume"] : []),
        ...onChartIndicators
          .flatMap((ind) => {
            // Get only fields with actual data (non-null values)
            const fieldsWithData = Object.entries(ind.data)
              .filter(([key, values]) => {
                if (key === "timestamps" || key === "timestamp") return false;
                return (
                  values &&
                  Array.isArray(values) &&
                  values.some((v) => v !== null && v !== undefined)
                );
              })
              .map(([key]) => key);

            return fieldsWithData.map((key) => {
              // Create a more readable display name
              const displayName =
                key === "value" ? ind.indicator : `${ind.indicator} (${key})`;

              // Store the actual series name for reference
              const seriesName = `${ind.indicator}_${key}`;

              return {
                name: seriesName,
                displayName: displayName,
              };
            });
          })
          .map((item) => item.displayName),
      ],
      top: 30,
      textStyle: {
        color: textColor,
      },
    },
    grid: [
      {
        left: "0%",
        right: "2%",
        top: "15%",
        bottom: "60px", // Explicit pixels for bottom margin for the slider
        containLabel: true, // Ensure axis labels are contained within the grid
      },
    ],
    xAxis: [
      {
        type: "category",
        boundaryGap: false,
        axisLine: { lineStyle: { color: textColor } },
        axisLabel: {
          color: textColor,
          formatter: (value: string) => {
            // Format to show compact date and time
            if (value.includes(" ")) {
              // If it has both date and time (contains space)
              const parts = value.split(" ");
              // Return MM-DD HH:MM format
              return `${parts[0].substring(5)} ${parts[1]}`;
            }
            return value.slice(5); // Just show MM-DD for dates without time
          },
          rotate: 30,
          fontSize: 10,
        },
        splitLine: { show: false },
        gridIndex: 0,
      },
    ],
    yAxis: [
      {
        // Main price scale
        name: "Price",
        scale: true,
        splitNumber: 5,
        axisLine: { lineStyle: { color: textColor } },
        axisLabel: {
          color: textColor,
          padding: [0, 10, 0, 0],
          align: "right",
          formatter: (value: number) => {
            return value.toFixed(0);
          },
        },
        splitLine: {
          show: true,
          lineStyle: { color: theme === "dark" ? "#333" : "#eee" },
        },
        position: "right",
        gridIndex: 0,
        // Add scale limits to ensure all data is visible
        min: (value: any) => {
          return Math.floor(value.min * 0.995); // Add 0.5% padding below
        },
        max: (value: any) => {
          return Math.ceil(value.max * 1.005); // Add 0.5% padding above
        },
      },
      {
        // Volume scale (hidden but used for data scaling)
        name: "Volume",
        scale: true,
        show: false,
        gridIndex: 0,
        // Ensure volume bars occupy bottom 20% of the main chart area
        max: (value: any) => {
          return value.max * 5; // This will make the volume bars take up ~20% of the chart height
        },
        axisPointer: {
          show: false,
        },
      },
    ],
    dataZoom: [
      {
        // Inside scroll and zoom
        type: "inside",
        xAxisIndex: [0],
        start: 60,
        end: 100,
        zoomLock: false,
      },
      {
        // Bottom slider
        show: true,
        realtime: true,
        type: "slider",
        xAxisIndex: [0],
        bottom: 10,
        height: 40,
        left: "0%",
        right: "2%",
        start: 60,
        end: 100,
        brushSelect: false,
        emphasis: {
          handleStyle: {
            borderWidth: 2,
            borderColor: theme === "dark" ? "#aaa" : "#555",
          },
          handleLabel: {
            show: false,
          },
        },
        dataBackground: {
          lineStyle: {
            color: theme === "dark" ? "#777" : "#aaa",
            width: 1,
          },
          areaStyle: {
            color: theme === "dark" ? "#444" : "#eee",
            opacity: 1,
          },
        },
        textStyle: {
          color: textColor,
          fontSize: 11,
        },
        handleIcon:
          "M8.2,13.6V3.9H6.3v9.7H3.1v14.9h3.3v9.7h1.8v-9.7h3.3V13.6H8.2z",
        handleSize: "100%",
        handleStyle: {
          color: theme === "dark" ? "#999" : "#fff",
          borderColor: theme === "dark" ? "#666" : "#ACB8D1",
          borderWidth: 1,
          shadowBlur: 2,
          shadowColor: "rgba(0, 0, 0, 0.2)",
        },
        borderColor: theme === "dark" ? "#555" : "#ddd",
        backgroundColor: theme === "dark" ? "#333" : "#f7f7f7",
        fillerColor:
          theme === "dark" ? "rgba(80,80,80,0.8)" : "rgba(220,220,220,0.8)",
        selectedDataBackground: {
          lineStyle: {
            color: theme === "dark" ? "#999" : "#888",
            width: 1,
          },
          areaStyle: {
            color: theme === "dark" ? "#666" : "#ddd",
            opacity: 1,
          },
        },
      },
    ],
    series: [
      {
        name: "Nifty 50",
        type: "candlestick",
        encode: {
          x: "time",
          y: ["open", "close", "low", "high"],
          tooltip: ["open", "close", "low", "high"],
        },
        itemStyle: {
          color: "#ef232a", // up candle color (bearish)
          color0: "#14b143", // down candle color (bullish)
          borderColor: "#ef232a", // up candle border color
          borderColor0: "#14b143", // down candle border color
        },
        xAxisIndex: 0,
        yAxisIndex: 0,
        z: 10, // Higher z value to ensure candlesticks are on top
      },
    ] as any[],
  };

  // Add volume series if required
  if (showVolume && volumeData.length > 0) {
    // Calculate volumes as percentage of max for display
    // This will scale volume bars to fit at the bottom of the chart

    (baseOption.series as any[]).push({
      name: "Volume",
      type: "bar",
      encode: {
        x: "time",
        y: "volume",
      },
      itemStyle: {
        color: (params: any) => {
          // Match volume bar color to candlestick color
          const index = params.dataIndex;
          const item = chartData[index];
          return item.close >= item.open
            ? "rgba(20, 177, 67, 0.3)"
            : "rgba(239, 35, 42, 0.3)";
        },
      },
      barWidth: "70%",
      barCategoryGap: "10%",
      xAxisIndex: 0,
      yAxisIndex: 1, // Use the hidden volume axis
      z: 1, // Lower z value to ensure volume is below candlesticks
    });
  }

  // Add on-chart indicators as line series
  const colors = [
    "#1f77b4", // blue
    "#ff7f0e", // orange
    "#2ca02c", // green
    "#d62728", // red
    "#9467bd", // purple
    "#8c564b", // brown
    "#e377c2", // pink
    "#7f7f7f", // gray
    "#bcbd22", // yellow-green
    "#17becf", // cyan
  ];

  let colorIndex = 0;

  // Add band indicator colors
  const bandColors = {
    bollinger_band: {
      upper_band: "#2196F3", // Blue
      middle_band: "#FFC107", // Amber
      lower_band: "#4CAF50", // Green
    },
    donchian_channel: {
      upper_band: "#E91E63", // Pink
      middle_band: "#9C27B0", // Purple
      lower_band: "#673AB7", // Deep Purple
    },
    keltner_channel: {
      upper_band: "#FF5722", // Deep Orange
      middle_band: "#795548", // Brown
      lower_band: "#607D8B", // Blue Grey
    },
  };

  // Helper function to get indicator style
  const getIndicatorStyle = (
    indicatorName: string,
    fieldName: string,
    color: string
  ) => {
    // Default style
    let style: any = {
      type: "line",
      symbol: "none",
      smooth: true,
      lineStyle: {
        color: color,
        width: 2,
      },
      sampling: "average",
      animation: false,
      scale: true,
    };

    // Special styling for band-type indicators
    if (
      ["bollinger_band", "donchian_channel", "keltner_channel"].includes(
        indicatorName
      )
    ) {
      const alpha = theme === "dark" ? 0.1 : 0.05;
      const bandColor =
        bandColors[indicatorName as keyof typeof bandColors][
          fieldName as keyof (typeof bandColors)["bollinger_band"]
        ] || color;

      style.lineStyle.color = bandColor;

      if (
        fieldName.includes("upper_band") ||
        fieldName.includes("lower_band")
      ) {
        style.lineStyle.width = 1;
        style.lineStyle.type = "dashed";

        // Add area style for bands
        if (fieldName.includes("upper_band")) {
          style.areaStyle = {
            color: bandColor,
            opacity: alpha,
            origin: "start",
          };
        }
      } else if (fieldName.includes("middle_band")) {
        style.lineStyle.width = 1;
      }
    }

    return style;
  };
  // Add on-chart indicators as line series
  onChartIndicators.forEach((indicatorResult: IndicatorCalculationResult) => {
    // Get base color for this indicator
    const baseColor = colors[colorIndex % colors.length];
    colorIndex++;

    // Filter out fields with all null values
    const fieldsWithData = Object.entries(indicatorResult.data)
      .filter(([key, values]) => {
        if (key === "timestamps" || key === "timestamp") return false;
        const hasValidData =
          values &&
          Array.isArray(values) &&
          values.some((v) => v !== null && v !== undefined);
        console.log(
          `[chartUtils] Checking field ${key} for ${
            indicatorResult.indicator
          }: ${hasValidData ? "has data" : "no valid data"}`
        );
        return hasValidData;
      })
      .map(([key]) => key);

    console.log(
      `[chartUtils] Fields with actual data for ${indicatorResult.indicator}:`,
      fieldsWithData
    );

    // Sort fields to ensure proper rendering order (lower_band -> middle_band -> upper_band)
    const sortedFields = [...fieldsWithData].sort((a, b) => {
      const order = ["lower_band", "middle_band", "upper_band", "value"];
      const aIndex = order.indexOf(a);
      const bIndex = order.indexOf(b);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    // Process each field that has data
    sortedFields.forEach((key) => {
      const seriesName = `${indicatorResult.indicator}_${key}`;
      const displayName =
        key === "value"
          ? indicatorResult.indicator
          : `${indicatorResult.indicator} (${key})`;

      console.log(`[chartUtils] Adding series for ${displayName}:`, {
        name: seriesName,
        fieldKey: key,
        dataPoints: indicatorResult.data[key]?.length || 0,
      });

      // Get style for this specific field
      const style = getIndicatorStyle(
        indicatorResult.indicator,
        key,
        baseColor
      );

      // For band indicators, we need to set up the area between bands
      let areaStyle = style.areaStyle;
      if (
        key.includes("upper_band") &&
        ["bollinger_band", "donchian_channel", "keltner_channel"].includes(
          indicatorResult.indicator
        )
      ) {
        // Find the corresponding lower band data
        const lowerBandKey = "lower_band";
        if (indicatorResult.data[lowerBandKey]) {
          areaStyle = {
            ...style.areaStyle,
            origin: "auto",
          };
        }
      }

      // Add the series configuration with adjusted data
      (baseOption.series as any[]).push({
        name: seriesName,
        ...style,
        areaStyle: areaStyle,
        encode: {
          x: "time",
          y: seriesName,
        },
        xAxisIndex: 0,
        yAxisIndex: 0,
        z: key.includes("middle_band") ? 2 : 1, // Middle band on top of other bands
      });
    });
  });

  return baseOption;
};
