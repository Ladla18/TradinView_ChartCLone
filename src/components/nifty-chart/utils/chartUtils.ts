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
  const {
    title = "Nifty 50 Index",
    showVolume = true,
    theme = "light",
    indicators = [],
  } = options;

  // Use data directly as received from API - no sorting needed
  const chartData = data;

  // Create date-time labels for x-axis
  const dateTimeLabels = chartData.map((item) =>
    item.time ? `${item.date} ${item.time}` : item.date
  );

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
          return indicators.some(
            (ind: { id: string; active: boolean }) =>
              ind.id === result.indicator && ind.active
          );
        }
        // If there's no indicator list or it's empty, include all on-chart indicators
        return true;
      }
      return false;
    }) || [];

  console.log("On-chart indicators for main chart:", onChartIndicators);

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
          const dataIndex = values.length - chartData.length + index;
          if (dataIndex >= 0 && dataIndex < values.length) {
            const fieldName = `${indicatorResult.indicator}_${key}`;
            dataPoint[fieldName] = values[dataIndex];
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

        // Add indicator values if any
        params.forEach((param: any) => {
          if (
            param.seriesType === "line" &&
            param.seriesName !== "Volume" &&
            param.seriesName !== "Nifty 50"
          ) {
            // Extract the real indicator name from the series name (removing field suffix)
            const seriesNameParts = param.seriesName.split("_");
            const indicatorName = seriesNameParts[0];
            const fieldName =
              seriesNameParts.length > 1 ? seriesNameParts[1] : "";

            const displayName = fieldName
              ? `${indicatorName} (${fieldName})`
              : indicatorName;

            // Get indicator value from either dataset format or regular format
            let value;
            if (param.value && typeof param.value === "object") {
              value = param.value[param.seriesName];
            } else {
              value = param.data;
            }

            tooltipContent += `<div style="color:${
              param.color
            }">${displayName}: ${
              typeof value === "number" ? value.toFixed(2) : "N/A"
            }</div>`;
          }
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
          padding: [0, 10, 0, 0], // Reduce padding to minimize space usage
          align: "right",
          formatter: (value: number) => {
            return value.toFixed(0); // Round to whole numbers to save space
          },
        },
        splitLine: {
          show: true,
          lineStyle: { color: theme === "dark" ? "#333" : "#eee" },
        },
        position: "right",
        gridIndex: 0,
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
    // Find the min and max volume to scale properly
    const minVolume = Math.min(...volumeData.filter((vol) => vol > 0));
    const maxVolume = Math.max(...volumeData);

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
    "#1f77b4",
    "#ff7f0e",
    "#2ca02c",
    "#d62728",
    "#9467bd",
    "#8c564b",
    "#e377c2",
    "#7f7f7f",
    "#bcbd22",
    "#17becf",
  ];

  let colorIndex = 0;

  onChartIndicators.forEach((indicatorResult: IndicatorCalculationResult) => {
    // Filter out fields with all null values
    const fieldsWithData = Object.entries(indicatorResult.data)
      .filter(([key, values]) => {
        // Skip timestamp fields
        if (key === "timestamps" || key === "timestamp") return false;

        // Check if this field has any non-null values
        return (
          values &&
          Array.isArray(values) &&
          values.some((v) => v !== null && v !== undefined)
        );
      })
      .map(([key]) => key);

    console.log(
      `Fields with actual data for ${indicatorResult.indicator}:`,
      fieldsWithData
    );

    // Process each field that has data
    fieldsWithData.forEach((key) => {
      const seriesName = `${indicatorResult.indicator}_${key}`;
      const displayName =
        key === "value"
          ? indicatorResult.indicator
          : `${indicatorResult.indicator} (${key})`;

      console.log(`Adding on-chart indicator series: ${displayName}`);

      (baseOption.series as any[]).push({
        name: seriesName,
        type: "line",
        encode: {
          x: "time",
          y: seriesName,
        },
        symbol: "none",
        smooth: true,
        lineStyle: {
          color: colors[colorIndex % colors.length],
          width: 2,
        },
        xAxisIndex: 0,
        yAxisIndex: 0,
      });

      colorIndex++;
    });
  });

  return baseOption;
};
