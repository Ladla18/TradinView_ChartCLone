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

  // Sort data by date for proper display
  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Extract date values for x-axis
  const dates = sortedData.map((item) => item.date);

  // Prepare data for candlestick chart
  const candlestickData = sortedData.map((item) => [
    item.open,
    item.close,
    item.low,
    item.high,
  ]);

  // Prepare data for volume chart if needed
  const volumeData = showVolume
    ? sortedData.map((item) => item.volume || 0)
    : [];

  // Base text color based on theme
  const textColor = theme === "dark" ? "#ddd" : "#333";

  // Get the on-chart indicators from the calculation results
  const onChartIndicators =
    options.calculationResults?.filter(
      (result: IndicatorCalculationResult) =>
        result.position === "on_chart" &&
        indicators.some(
          (ind: { id: string; active: boolean }) =>
            ind.id === result.indicator && ind.active
        )
    ) || [];

  const baseOption: EChartsOption = {
    title: {
      text: title,
      left: "center",
      textStyle: {
        color: textColor,
      },
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

        const date = candlestickParam.axisValue;
        const [open, close, low, high] = candlestickParam.data;

        let tooltipContent = `<div style="font-weight: bold; margin-bottom: 4px">${date}</div>`;
        tooltipContent += `<div>Open: ${open.toFixed(2)}</div>`;
        tooltipContent += `<div>Close: ${close.toFixed(2)}</div>`;
        tooltipContent += `<div>Low: ${low.toFixed(2)}</div>`;
        tooltipContent += `<div>High: ${high.toFixed(2)}</div>`;

        // Add volume if available
        if (showVolume) {
          const volumeParam = params.find(
            (param: any) => param.seriesName === "Volume"
          );
          if (volumeParam) {
            tooltipContent += `<div>Volume: ${volumeParam.data.toLocaleString()}</div>`;
          }
        }

        // Add indicator values if any
        params.forEach((param: any) => {
          if (
            param.seriesType === "line" &&
            param.seriesName !== "Volume" &&
            param.seriesName !== "Nifty 50"
          ) {
            tooltipContent += `<div style="color:${param.color}">${
              param.seriesName
            }: ${param.data.toFixed(2)}</div>`;
          }
        });

        return tooltipContent;
      },
    },
    legend: {
      data: [
        "Nifty 50",
        ...(showVolume ? ["Volume"] : []),
        ...onChartIndicators.flatMap((ind) =>
          Object.keys(ind.data).map((key) => `${ind.indicator}_${key}`)
        ),
      ],
      top: 30,
      textStyle: {
        color: textColor,
      },
    },
    grid: showVolume
      ? [
          { left: "10%", right: "8%", top: "15%", height: "50%" },
          { left: "10%", right: "8%", top: "70%", height: "16%" },
        ]
      : [{ left: "10%", right: "8%", top: "15%", bottom: "15%" }],
    xAxis: showVolume
      ? [
          {
            type: "category",
            data: dates,
            boundaryGap: false,
            axisLine: { lineStyle: { color: textColor } },
            axisLabel: {
              color: textColor,
              formatter: (value: string) => {
                // Format the date to be more readable
                return value.slice(5); // Remove year part, keep only month-day
              },
            },
            splitLine: { show: false },
            gridIndex: 0,
          },
          {
            type: "category",
            data: dates,
            boundaryGap: false,
            axisLine: { lineStyle: { color: textColor } },
            axisLabel: { show: false },
            axisTick: { show: false },
            splitLine: { show: false },
            gridIndex: 1,
          },
        ]
      : [
          {
            type: "category",
            data: dates,
            boundaryGap: false,
            axisLine: { lineStyle: { color: textColor } },
            axisLabel: {
              color: textColor,
              formatter: (value: string) => {
                // Format the date to be more readable
                return value.slice(5); // Remove year part, keep only month-day
              },
            },
            splitLine: { show: false },
          },
        ],
    yAxis: showVolume
      ? [
          {
            scale: true,
            splitNumber: 5,
            axisLine: { lineStyle: { color: textColor } },
            axisLabel: { color: textColor },
            splitLine: {
              show: true,
              lineStyle: { color: theme === "dark" ? "#333" : "#eee" },
            },
            gridIndex: 0,
          },
          {
            scale: true,
            splitNumber: 2,
            axisLine: { lineStyle: { color: textColor } },
            axisLabel: { color: textColor, inside: false },
            splitLine: { show: false },
            gridIndex: 1,
          },
        ]
      : [
          {
            scale: true,
            splitNumber: 5,
            axisLine: { lineStyle: { color: textColor } },
            axisLabel: { color: textColor },
            splitLine: {
              show: true,
              lineStyle: { color: theme === "dark" ? "#333" : "#eee" },
            },
          },
        ],
    dataZoom: [
      {
        type: "inside",
        xAxisIndex: showVolume ? [0, 1] : [0],
        start: 50,
        end: 100,
      },
      {
        show: true,
        xAxisIndex: showVolume ? [0, 1] : [0],
        type: "slider",
        bottom: "2%",
        start: 50,
        end: 100,
        textStyle: {
          color: textColor,
        },
      },
    ],
    series: [
      {
        name: "Nifty 50",
        type: "candlestick",
        data: candlestickData,
        itemStyle: {
          color: "#ef232a", // up candle color (bearish)
          color0: "#14b143", // down candle color (bullish)
          borderColor: "#ef232a", // up candle border color
          borderColor0: "#14b143", // down candle border color
        },
        xAxisIndex: 0,
        yAxisIndex: 0,
      },
    ] as any[],
  };

  // Add volume series if required
  if (showVolume && volumeData.length > 0) {
    (baseOption.series as any[]).push({
      name: "Volume",
      type: "bar",
      data: volumeData,
      itemStyle: {
        color: "#999",
      },
      xAxisIndex: 1,
      yAxisIndex: 1,
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
    Object.entries(indicatorResult.data).forEach(([key, values]) => {
      // Don't use timestamps for on-chart indicators
      if (key === "timestamps") return;

      if (values && Array.isArray(values) && values.length > 0) {
        // For on-chart indicators, we need to sync with the main chart dates
        // So we don't use timestamps, but instead use the last N values
        const dataPoints = values.slice(-dates.length);

        // Pad with null if necessary
        if (dataPoints.length < dates.length) {
          const nullPadding = new Array(dates.length - dataPoints.length).fill(
            null
          );
          dataPoints.unshift(...nullPadding);
        }

        const seriesName = `${indicatorResult.indicator}_${key}`;
        (baseOption.series as any[]).push({
          name: seriesName,
          type: "line",
          data: dataPoints,
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
      }
    });
  });

  return baseOption;
};
