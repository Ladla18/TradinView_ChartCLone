import React from "react";
import IndicatorChart from "./IndicatorChart";
import { IndicatorSchema } from "../../types/index";

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

  console.log("Below chart indicators found:", belowChartIndicators.length);
  belowChartIndicators.forEach((indicator) => {
    console.log(`Indicator: ${indicator.indicator}`, {
      position: indicator.position,
      dataFields: Object.keys(indicator.data),
      fieldsLength: Object.keys(indicator.data).map((key) => ({
        field: key,
        length: indicator.data[key]?.length,
      })),
    });
  });

  if (belowChartIndicators.length === 0) {
    console.log("No below chart indicators found");
    return null;
  }

  return (
    <div
      className={`w-full mt-5 pt-2.5 border-t ${
        theme === "dark" ? "border-gray-600" : "border-gray-200"
      }`}
    >
      <h3
        className={`m-0 mb-2.5 text-base ${
          theme === "dark" ? "text-white" : "text-gray-800"
        }`}
      >
        Indicator Panels
      </h3>

      {belowChartIndicators.map((result) => {
        const schema = indicatorSchema?.[result.indicator];
        if (!schema) {
          console.log(`No schema found for indicator: ${result.indicator}`);
          return null;
        }

        // Log the data structure for debugging
        console.log(`Data for ${result.indicator}:`, {
          keys: Object.keys(result.data),
          fieldCounts: Object.keys(result.data).map((field) => ({
            field,
            count: result.data[field]?.length || 0,
            hasValues: result.data[field] && result.data[field].length > 0,
            schemaOutput:
              schema.output?.[field]?.description || "Not in schema",
          })),
        });

        // Filter out timestamp fields before passing to the chart
        const filteredData = Object.fromEntries(
          Object.entries(result.data).filter(
            ([key]) => key !== "timestamps" && key !== "timestamp"
          )
        );

        // Check if data has any usable values after removing timestamps
        const hasData = Object.values(filteredData).some(
          (arr) => arr && arr.length > 0
        );

        if (!hasData) {
          console.log(`No usable data for ${result.indicator}`);
          return null;
        }

        return (
          <IndicatorChart
            key={result.indicator}
            indicator={result.indicator}
            indicatorName={schema.description}
            data={filteredData}
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
