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

// Helper function to normalize field names
const normalizeFieldName = (field: string): string => {
  return field
    .toLowerCase()
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/[^a-z0-9_]/g, ""); // Remove any other special characters
};

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
      console.log("[useIndicators] No indicators to calculate");
      return [];
    }

    console.log("[useIndicators] Starting calculation with indicators:", {
      total: selectedIndicators.length,
      active: selectedIndicators.filter((ind) => ind.active).length,
      indicators: selectedIndicators.map((ind) => ({
        id: ind.id,
        active: ind.active,
        paramCount: Object.keys(ind.parameters).length,
      })),
    });

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

      console.log("[useIndicators] Sending calculation request with payload:", {
        symbol: payload.symbol,
        timeframe: payload.timeframe,
        indicatorCount: payload.indicators.length,
        indicators: payload.indicators.map((ind) => ({
          name: ind.name,
          type: ind.type,
          source: ind.source,
          paramKeys: Object.keys(ind.parameters),
        })),
      });

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
      console.log("[useIndicators] Received API response:", {
        hasIndicators: !!result.indicators,
        indicatorKeys: result.indicators ? Object.keys(result.indicators) : [],
      });

      // Format and process the calculation results
      const formattedResults: IndicatorCalculationResult[] = [];

      // Process the API response to create formatted results
      if (result && typeof result === "object" && result.indicators) {
        console.log(
          "[useIndicators] Processing indicators:",
          Object.keys(result.indicators)
        );

        selectedIndicators
          .filter((ind) => ind.active)
          .forEach((indicator) => {
            const schema = indicatorSchema[indicator.id];
            console.log(`[useIndicators] Processing ${indicator.id}:`, {
              hasSchema: !!schema,
              position: schema?.position,
              outputFields: schema?.output ? Object.keys(schema.output) : [],
            });

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

            console.log(`[useIndicators] Found data for ${indicator.id}:`, {
              dataFound: !!indicatorData,
              dataType: indicatorData ? typeof indicatorData : "undefined",
              isArray: Array.isArray(indicatorData),
              length: Array.isArray(indicatorData) ? indicatorData.length : 0,
            });

            if (schema && indicatorData) {
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
                  `[useIndicators] Processing array data for ${indicator.id}:`,
                  {
                    length: indicatorData.length,
                    sampleFields:
                      indicatorData.length > 0
                        ? Object.keys(indicatorData[0])
                        : [],
                  }
                );

                // Extract timestamps and all available values
                indicatorData.forEach((item: any) => {
                  if (item && ("timestamp" in item || "timestamps" in item)) {
                    const timestamp = item.timestamp || item.timestamps;
                    transformedData.timestamps.push(
                      new Date(timestamp).getTime()
                    );

                    // Process all fields except timestamp/timestamps
                    Object.entries(item).forEach(([field, value]) => {
                      if (field !== "timestamp" && field !== "timestamps") {
                        // Normalize the field name
                        const normalizedField = normalizeFieldName(field);
                        if (!transformedData[normalizedField]) {
                          transformedData[normalizedField] = [];
                        }
                        transformedData[normalizedField].push(value as number);
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
                    `[useIndicators] Successfully processed ${indicator.id}:`,
                    {
                      dataPoints: transformedData.timestamps.length,
                      fields: Object.keys(transformedData),
                      position: schema.position,
                    }
                  );
                }
              }
            }
          });
      }

      console.log("[useIndicators] Calculation completed:", {
        totalResults: formattedResults.length,
        onChart: formattedResults.filter((r) => r.position === "on_chart")
          .length,
        below: formattedResults.filter((r) => r.position === "below").length,
      });

      setCalculationResults(formattedResults);
      setIsCalculating(false);
      return formattedResults;
    } catch (error) {
      console.error("[useIndicators] Calculation error:", error);
      setIsCalculating(false);
      throw error;
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
