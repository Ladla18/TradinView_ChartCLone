import { useState, useEffect } from "react";
import { IndicatorSchema, SelectedIndicator } from "../types/index";

interface UseIndicatorsProps {
  apiUrl?: string;
  calculateApiUrl?: string;
}

interface IndicatorCalculationResult {
  indicator: string;
  position: "on_chart" | "below";
  data: Record<string, number[]>;
}

interface UseIndicatorsReturn {
  indicatorSchema: IndicatorSchema | null;
  loading: boolean;
  error: Error | null;
  selectedIndicators: SelectedIndicator[];
  calculationResults: IndicatorCalculationResult[];
  isCalculating: boolean;
  addIndicator: (id: string) => void;
  removeIndicator: (id: string) => void;
  updateIndicatorParameter: (id: string, paramName: string, value: any) => void;
  toggleIndicator: (id: string) => void;
  calculateSelectedIndicators: () => Promise<IndicatorCalculationResult[]>;
}

interface CalculationPayload {
  symbol: string;
  timeframe: string;
  indicators: {
    name: string;
    type: string;
    source: string;
    parameters: Record<string, any>;
  }[];
}

export const useIndicators = ({
  apiUrl = "https://dev.api.tusta.co/charts/get_all_indicators",
  calculateApiUrl = "https://dev.api.tusta.co/charts/calculate_indicators_csv",
}: UseIndicatorsProps = {}): UseIndicatorsReturn => {
  const [indicatorSchema, setIndicatorSchema] =
    useState<IndicatorSchema | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedIndicators, setSelectedIndicators] = useState<
    SelectedIndicator[]
  >([]);
  const [calculationResults, setCalculationResults] = useState<
    IndicatorCalculationResult[]
  >([]);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Fetch indicator schema
  useEffect(() => {
    const fetchIndicators = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data: IndicatorSchema = await response.json();
        setIndicatorSchema(data);
      } catch (err) {
        console.error("Error fetching indicators:", err);
        setError(
          err instanceof Error ? err : new Error("An unknown error occurred")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchIndicators();
  }, [apiUrl]);

  // Calculate indicators based on selected ones
  const calculateSelectedIndicators = async () => {
    if (!indicatorSchema || selectedIndicators.length === 0) {
      return [];
    }

    setIsCalculating(true);

    try {
      const payload: CalculationPayload = {
        symbol: "3045", // hardcoded as requested
        timeframe: "1m", // hardcoded as requested
        indicators: selectedIndicators
          .filter((ind) => ind.active)
          .map((indicator) => {
            let source = "close"; // default

            // Extract source from parameters if it exists
            const parameters: Record<string, any> = {};
            Object.entries(indicator.parameters).forEach(([key, value]) => {
              if (key === "source") {
                source = value;
              } else {
                parameters[key] = value;
              }
            });

            return {
              name: indicator.name,
              type: indicator.id,
              source,
              parameters,
            };
          }),
      };

      console.log("Calculating indicators with payload:", payload);

      const response = await fetch(calculateApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `Calculation API request failed with status ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Calculation API response:", result);

      // Debug the response structure
      if (result && result.indicators) {
        console.log(
          "Response indicators structure:",
          Object.keys(result.indicators)
        );
        for (const key of Object.keys(result.indicators)) {
          const data = result.indicators[key];
          console.log(`Indicator ${key}:`, {
            type: typeof data,
            isArray: Array.isArray(data),
            length: Array.isArray(data) ? data.length : 0,
            sample: Array.isArray(data) && data.length > 0 ? data[0] : null,
          });
        }
      }

      // Format and process the calculation results
      const formattedResults: IndicatorCalculationResult[] = [];

      // Process the API response to create formatted results
      if (result && typeof result === "object" && result.indicators) {
        console.log("Processing indicators:", Object.keys(result.indicators));

        selectedIndicators
          .filter((ind) => ind.active)
          .forEach((indicator) => {
            const schema = indicatorSchema[indicator.id];

            // Try to find the indicator data by either id or name
            let indicatorData = null;
            if (result.indicators[indicator.id]) {
              indicatorData = result.indicators[indicator.id];
            } else if (result.indicators[indicator.name]) {
              indicatorData = result.indicators[indicator.name];
            } else {
              // Look for fuzzy matches - response might use different keys
              const possibleKeys = Object.keys(result.indicators);
              const matchingKey = possibleKeys.find(
                (key) =>
                  key.toLowerCase().includes(indicator.id.toLowerCase()) ||
                  key.toLowerCase().includes(indicator.name.toLowerCase())
              );

              if (matchingKey) {
                indicatorData = result.indicators[matchingKey];
              }
            }

            console.log(`Processing indicator ${indicator.id}:`, {
              schemaExists: !!schema,
              resultDataExists: !!indicatorData,
              dataType: indicatorData ? typeof indicatorData : "undefined",
              isArray: Array.isArray(indicatorData),
              dataLength: Array.isArray(indicatorData)
                ? indicatorData.length
                : 0,
            });

            // Only use data from API
            if (schema && indicatorData) {
              // The API returns an array of objects with timestamp and value
              // We need to transform this into a format our charts can use

              // Initialize the transformed data with timestamps and all output fields from schema
              const transformedData: Record<string, number[]> = {};

              // Initialize all fields from schema output
              if (schema.output) {
                Object.keys(schema.output).forEach((outputField) => {
                  transformedData[outputField] = [];
                });
              }

              // Always include timestamps field
              transformedData.timestamps = [];

              // Handle different response formats
              if (Array.isArray(indicatorData)) {
                console.log(
                  `Processing array data for ${indicator.id}, length:`,
                  indicatorData.length
                );
                if (indicatorData.length > 0) {
                  console.log("Sample data item:", indicatorData[0]);

                  // Get all fields from the first data item (excluding timestamp/timestamps)
                  const dataFields = Object.keys(indicatorData[0]).filter(
                    (field) => field !== "timestamp" && field !== "timestamps"
                  );

                  // Initialize any fields present in the data but not in the schema
                  dataFields.forEach((field) => {
                    if (!transformedData[field]) {
                      transformedData[field] = [];
                    }
                  });
                }

                // Extract timestamps and all available values
                indicatorData.forEach((item: any) => {
                  if (item && ("timestamp" in item || "timestamps" in item)) {
                    // Handle timestamp
                    const timestamp = item.timestamp || item.timestamps;
                    transformedData.timestamps.push(
                      new Date(timestamp).getTime()
                    );

                    // Process all fields except timestamp/timestamps
                    Object.entries(item).forEach(([field, value]) => {
                      if (
                        field !== "timestamp" &&
                        field !== "timestamps" &&
                        field in transformedData
                      ) {
                        // Handle null values
                        if (value === null) {
                          transformedData[field].push(NaN);
                        } else {
                          transformedData[field].push(value as number);
                        }
                      }
                    });
                  }
                });

                if (transformedData.timestamps.length > 0) {
                  formattedResults.push({
                    indicator: indicator.id,
                    position: schema.position,
                    data: transformedData,
                  });
                  console.log(
                    `Successfully processed ${transformedData.timestamps.length} data points for ${indicator.id} with fields:`,
                    Object.keys(transformedData)
                  );
                }
              }
            }
          });

        console.log("Formatted results:", formattedResults);
      }

      setCalculationResults(formattedResults);
      return formattedResults;
    } catch (err) {
      console.error("Error calculating indicators:", err);
      return [];
    } finally {
      setIsCalculating(false);
    }
  };

  // Add a new indicator
  const addIndicator = (id: string) => {
    if (!indicatorSchema || !indicatorSchema[id]) return;

    // Check if already exists
    if (selectedIndicators.some((ind) => ind.id === id)) return;

    const indicator = indicatorSchema[id];

    // Create default parameters
    const parameters: Record<string, any> = {};

    Object.entries(indicator.parameters).forEach(([paramName, paramInfo]) => {
      parameters[paramName] = paramInfo.default;
    });

    setSelectedIndicators((prev) => [
      ...prev,
      {
        id,
        name: indicator.description,
        parameters,
        active: true,
      },
    ]);
  };

  // Remove an indicator
  const removeIndicator = (id: string) => {
    setSelectedIndicators((prev) =>
      prev.filter((indicator) => indicator.id !== id)
    );

    // Also remove from calculation results
    setCalculationResults((prev) =>
      prev.filter((result) => result.indicator !== id)
    );
  };

  // Update indicator parameter
  const updateIndicatorParameter = (
    id: string,
    paramName: string,
    value: any
  ) => {
    setSelectedIndicators((prev) =>
      prev.map((indicator) => {
        if (indicator.id !== id) return indicator;

        return {
          ...indicator,
          parameters: {
            ...indicator.parameters,
            [paramName]: value,
          },
        };
      })
    );
  };

  // Toggle indicator visibility
  const toggleIndicator = (id: string) => {
    setSelectedIndicators((prev) =>
      prev.map((indicator) => {
        if (indicator.id !== id) return indicator;

        return {
          ...indicator,
          active: !indicator.active,
        };
      })
    );
  };

  return {
    indicatorSchema,
    loading,
    error,
    selectedIndicators,
    calculationResults,
    isCalculating,
    addIndicator,
    removeIndicator,
    updateIndicatorParameter,
    toggleIndicator,
    calculateSelectedIndicators,
  };
};
