import React from "react";
import IndicatorChart from "./IndicatorChart";
import { IndicatorCalculationResult, IndicatorSchema } from "../../types/index";

interface IndicatorChartsProps {
  calculationResults: {
    indicator: string;
    position: "on_chart" | "below";
    data: Record<string, number[]>;
  }[];
  indicatorSchema: IndicatorSchema | null;
  theme?: "light" | "dark";
  dates: string[];
}

const IndicatorCharts: React.FC<IndicatorChartsProps> = ({
  calculationResults,
  indicatorSchema,
  theme = "light",
  dates,
}) => {
  console.log("IndicatorCharts called with:", {
    resultsCount: calculationResults?.length || 0,
    indicatorSchemaExists: !!indicatorSchema,
    datesCount: dates?.length || 0,
  });

  if (!calculationResults || calculationResults.length === 0) {
    console.log("No calculationResults available");
    return null;
  }

  // Filter for indicators that should appear below the main chart
  const belowChartIndicators = calculationResults.filter(
    (result) =>
      result.position === "below" &&
      result.data &&
      Object.keys(result.data).length > 0
  );

  console.log("Below chart indicators:", belowChartIndicators);

  if (belowChartIndicators.length === 0) {
    console.log("No below chart indicators found");
    return null;
  }

  const chartContainerStyle: React.CSSProperties = {
    width: "100%",
    marginTop: "20px",
    borderTop: `1px solid ${theme === "dark" ? "#444" : "#ddd"}`,
    paddingTop: "10px",
  };

  return (
    <div style={chartContainerStyle}>
      <h3
        style={{
          margin: "0 0 10px 0",
          fontSize: "1rem",
          color: theme === "dark" ? "#fff" : "#333",
        }}
      >
        Indicator Panels
      </h3>

      {belowChartIndicators.map((result) => {
        const schema = indicatorSchema?.[result.indicator];
        if (!schema) return null;

        // Check if data has any usable values
        const hasTimestamps =
          result.data.timestamps && result.data.timestamps.length > 0;
        const hasData =
          hasTimestamps ||
          Object.values(result.data).some((arr) => arr && arr.length > 0);

        if (!hasData) {
          console.log(`No usable data for ${result.indicator}`);
          return null;
        }

        return (
          <IndicatorChart
            key={result.indicator}
            indicator={result.indicator}
            indicatorName={schema.description}
            data={result.data}
            dates={dates}
            schema={schema}
            theme={theme}
          />
        );
      })}
    </div>
  );
};

export default IndicatorCharts;
