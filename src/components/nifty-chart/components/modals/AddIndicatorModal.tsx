import React, { useState, useEffect } from "react";
import { X, Info, ChevronDown, AlertCircle, Save, Search } from "lucide-react";
import {
  getAllIndicators,
  calculateIndicators,
} from "../../../../services/chartsnifty";
import { IndicatorCalculationResult } from "../../types";

interface ApiIndicator {
  description: string;
  output: Record<string, { description: string; type: string }>;
  parameters: Record<
    string,
    {
      default: any;
      description: string;
      type: string;
      options?: string[];
    }
  >;
  position: "on_chart" | "below";
}

interface AddIndicatorModalProps {
  onClose: () => void;
  onAddIndicator: (indicator: any) => void;
  existingIndicator?: {
    id: string;
    name: string;
    type: string;
    period: number;
    chartType: string;
    candleInterval?: string;
    field?: string;
    noOfCandles?: number;
  } | null;
  onProcessedDataUpdate?: (data: IndicatorCalculationResult[]) => void;
}

// Create a variable to store all indicators added so far
let allAddedIndicators: Array<{
  name: string;
  type: string;
  source: string;
  parameters: Record<string, any>;
}> = [];

const AddIndicatorModal: React.FC<AddIndicatorModalProps> = ({
  onClose,
  onAddIndicator,
  existingIndicator,
  onProcessedDataUpdate,
}) => {
  const [indicatorType, setIndicatorType] = useState(
    existingIndicator?.type || ""
  );
  const [indicatorName, setIndicatorName] = useState(
    existingIndicator?.name || ""
  );
  const [allIndicators, setAllIndicators] = useState<
    Record<string, ApiIndicator>
  >({});
  const [filteredIndicators, setFilteredIndicators] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State to store parameter values
  const [parameterValues, setParameterValues] = useState<Record<string, any>>(
    {}
  );

  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        setLoading(true);
        const data = await getAllIndicators();
        console.log("Fetched indicators:", data);
        setAllIndicators(data);
        setFilteredIndicators(Object.keys(data));
        setError("");

        // If we have an existing indicator, initialize parameter values
        if (existingIndicator?.type && data[existingIndicator.type]) {
          const indicatorData = data[existingIndicator.type];
          if (indicatorData) {
            initializeParameterValues(indicatorData);
          }
        }
      } catch (error) {
        console.error("Error fetching indicators:", error);
        setError("Failed to load indicators. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchIndicators();
  }, [existingIndicator]);

  // Initialize parameter values based on schema defaults or existing values
  const initializeParameterValues = (indicatorData: ApiIndicator) => {
    if (!indicatorData || !indicatorData.parameters) return;

    const newParams: Record<string, any> = {};

    Object.entries(indicatorData.parameters).forEach(([key, paramInfo]) => {
      // Always include source, not filtered now
      // If editing, try to get existing value or use default
      if (existingIndicator && existingIndicator.period && key === "length") {
        newParams[key] = existingIndicator.period;
      } else {
        newParams[key] = paramInfo.default;
      }
    });

    setParameterValues(newParams);
  };

  const handleIndicatorTypeChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setIndicatorType(value);

    if (value.trim() === "") {
      setFilteredIndicators(Object.keys(allIndicators));
    } else {
      const filtered = Object.keys(allIndicators).filter(
        (indicator) =>
          indicator.toLowerCase().includes(value.toLowerCase()) ||
          (allIndicators[indicator]?.description || "")
            .toLowerCase()
            .includes(value.toLowerCase())
      );
      setFilteredIndicators(filtered);
    }

    setShowDropdown(true);
  };

  const handleSelectIndicator = (indicator: string) => {
    setIndicatorType(indicator);
    setShowDropdown(false);

    // Auto-fill name from indicator type
    if (!indicatorName) {
      setIndicatorName(indicator);
    }

    // Initialize parameter values
    const indicatorData = allIndicators[indicator];
    if (indicatorData && indicatorData.parameters) {
      initializeParameterValues(indicatorData);
    }
  };

  // Handle parameter value changes
  const handleParameterChange = (paramName: string, value: any) => {
    setParameterValues((prev) => ({
      ...prev,
      [paramName]: value,
    }));
  };

  // Render input field based on parameter type
  const renderParameterInput = (paramName: string, paramInfo: any) => {
    const value = parameterValues[paramName];

    switch (paramInfo.type) {
      case "int":
      case "float":
        return (
          <div className="relative">
            <input
              type="number"
              value={value}
              onChange={(e) =>
                handleParameterChange(
                  paramName,
                  paramInfo.type === "int"
                    ? parseInt(e.target.value)
                    : parseFloat(e.target.value)
                )
              }
              className="w-full rounded-md border border-gray-300 p-2.5 text-gray-700 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500/20 bg-white"
              step={paramInfo.type === "int" ? 1 : 0.01}
            />
            {paramInfo.type === "int" && (
              <div className="absolute right-0 top-0 h-full flex items-center pr-3">
                <div className="flex flex-col">
                  <button
                    className="text-gray-500 hover:text-gray-700 px-1"
                    onClick={() =>
                      handleParameterChange(paramName, parseInt(value) + 1)
                    }
                  >
                    ▲
                  </button>
                  <button
                    className="text-gray-500 hover:text-gray-700 px-1"
                    onClick={() =>
                      handleParameterChange(paramName, parseInt(value) - 1)
                    }
                  >
                    ▼
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case "str":
        if (paramInfo.options && paramInfo.options.length > 0) {
          return (
            <div className="relative">
              <select
                value={value}
                onChange={(e) =>
                  handleParameterChange(paramName, e.target.value)
                }
                className="w-full rounded-md border border-gray-300 p-2.5 text-gray-700 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500/20 bg-white appearance-none pr-10"
              >
                {paramInfo.options.map((option: string) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <ChevronDown size={16} className="text-gray-500" />
              </div>
            </div>
          );
        }
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleParameterChange(paramName, e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2.5 text-gray-700 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500/20 bg-white"
          />
        );
      case "boolean":
        return (
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) =>
                  handleParameterChange(paramName, e.target.checked)
                }
                className="sr-only"
              />
              <div
                className={`w-11 h-6 rounded-full transition-colors ${
                  value ? "bg-blue-500" : "bg-gray-300"
                } relative`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform ${
                    value ? "translate-x-5" : ""
                  }`}
                ></div>
              </div>
            </label>
          </div>
        );
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleParameterChange(paramName, e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2.5 text-gray-700 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500/20 bg-white"
          />
        );
    }
  };

  const handleSave = async () => {
    if (!indicatorType || !indicatorName) {
      alert("Please fill in all required fields");
      return;
    }

    const indicator: any = {
      type: indicatorType,
      name: indicatorName,
      parameters: parameterValues, // Use all parameter values
      chartType: existingIndicator?.chartType || "Candle",
      candleInterval: existingIndicator?.candleInterval || "5 Minutes",
      field: existingIndicator?.field || "Equity",
      // For backward compatibility
      period: parameterValues["length"] || parameterValues["period"] || 14,
    };

    // Create new indicator for the payload
    const newIndicator = {
      name: indicatorName,
      type: indicatorType,
      source: parameterValues["source"] || "close",
      parameters: { ...parameterValues },
    };

    // Check if we're editing an existing indicator
    if (existingIndicator) {
      // Update the existing indicator in the array
      const existingIndex = allAddedIndicators.findIndex(
        (ind) => ind.name === existingIndicator.name
      );
      if (existingIndex >= 0) {
        allAddedIndicators[existingIndex] = newIndicator;
      } else {
        // If not found, add it
        allAddedIndicators.push(newIndicator);
      }
    } else {
      // Add the new indicator to our collection
      allAddedIndicators.push(newIndicator);
    }

    // Create payload with all indicators
    const payload = {
      symbol: "3045", // hardcoded
      timeframe: "1m", // hardcoded
      indicators: [...allAddedIndicators],
    };

    // Log the payload
    console.log("Indicator Payload:", payload);

    // Send the payload to the calculateIndicators API
    try {
      const response = await calculateIndicators(payload);
      console.log("Indicator Calculation Response:", response);

      // Process the response to prepare data for charts
      if (response && response.indicators) {
        // Get schema for determining indicator positions
        const processedIndicators: IndicatorCalculationResult[] = [];

        // Process each indicator in the response
        for (const [indicatorType, indicatorData] of Object.entries(
          response.indicators
        )) {
          // Find the indicator in our schema to get its position
          const indicatorSchema = allIndicators[indicatorType];
          if (indicatorSchema) {
            const position = indicatorSchema.position || "below"; // Default to below if not specified

            // Structure the data in the format expected by IndicatorCharts
            // The data should be a Record<string, number[]> with keys for each output field
            const processedData: Record<string, number[]> = {};

            // Check if the data is an array of objects
            if (Array.isArray(indicatorData)) {
              // Convert array of objects to record of arrays
              // Each object in the array becomes a point in the respective output field arrays
              if (indicatorData.length > 0) {
                // Initialize arrays for each output field, excluding timestamps
                const fields = Object.keys(indicatorData[0]).filter(
                  (field) => field !== "timestamps" && field !== "timestamp"
                );
                
                // Log all available fields in the response
                console.log(`Indicator ${indicatorType} available fields:`, fields);
                
                fields.forEach((field) => {
                  processedData[field] = [];
                });

                // Fill the arrays with values, excluding timestamps
                indicatorData.forEach((dataPoint) => {
                  fields.forEach((field) => {
                    processedData[field].push(dataPoint[field]);
                  });
                });
                
                // Check if all expected output fields from schema are present
                if (indicatorSchema.output) {
                  const expectedFields = Object.keys(indicatorSchema.output);
                  const missingFields = expectedFields.filter(field => !fields.includes(field));
                  
                  if (missingFields.length > 0) {
                    console.warn(`Missing fields in ${indicatorType} data:`, missingFields);
                  }
                }
              }
            } else {
              // If it's already in the expected format, filter out timestamps
              Object.entries(indicatorData as Record<string, number[]>).forEach(
                ([key, value]) => {
                  if (key !== "timestamps" && key !== "timestamp") {
                    processedData[key] = value;
                  }
                }
              );
            }

            // Log the processed data for verification
            console.log(`Processed data for ${indicatorType}:`, {
              fields: Object.keys(processedData),
              lengths: Object.keys(processedData).map(key => ({
                field: key,
                length: processedData[key]?.length || 0
              }))
            });

            // Create a processed indicator object that includes position information
            processedIndicators.push({
              indicator: indicatorType,
              position: position,
              data: processedData,
            });

            console.log(
              `Processed indicator ${indicatorType} with position ${position}`
            );
          }
        }

        // Log the processed indicators for rendering
        console.log("Processed indicators for rendering:", processedIndicators);

        // Pass processed indicators data to parent component if callback exists
        if (onProcessedDataUpdate && processedIndicators.length > 0) {
          onProcessedDataUpdate(processedIndicators);

          // Also attach to the indicator for backward compatibility
          indicator.processedData = processedIndicators;
        }
      }
    } catch (error) {
      console.error("Error calculating indicators:", error);
    }

    onAddIndicator(indicator);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black opacity-15 backdrop-filter backdrop-blur-sm"></div>
      <div className="w-[90%] max-w-[550px] rounded-lg bg-white shadow-md border border-gray-200 overflow-hidden z-10">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 relative">
          <h2 className="text-lg font-medium text-gray-800">
            {existingIndicator ? "Edit Indicator" : "Add Technical Indicator"}
          </h2>
          <button
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 rounded-full p-1"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 rounded bg-red-50 border border-red-200 text-red-600 flex items-center">
            <AlertCircle size={16} className="mr-2 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Indicator Type */}
          <div className="space-y-2">
            <label className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">Indicator Type</span>
              {loading && (
                <span className="text-gray-400 text-sm">Loading...</span>
              )}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={indicatorType}
                onChange={handleIndicatorTypeChange}
                onFocus={() => setShowDropdown(true)}
                className="w-full rounded border border-gray-300 p-2.5 pl-10 text-gray-700 bg-white"
                placeholder="Search for indicator type..."
                disabled={!!existingIndicator || loading}
              />
              {indicatorType && !existingIndicator && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setIndicatorType("");
                    setFilteredIndicators(Object.keys(allIndicators));
                    setShowDropdown(true);
                  }}
                >
                  <X size={16} />
                </button>
              )}

              {showDropdown &&
                filteredIndicators.length > 0 &&
                !existingIndicator && (
                  <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded border border-gray-200 shadow-lg bg-white">
                    {filteredIndicators.map((indicator) => (
                      <div
                        key={indicator}
                        className="cursor-pointer p-3 hover:bg-gray-50 text-gray-700 border-b border-gray-100 last:border-0"
                        onClick={() => handleSelectIndicator(indicator)}
                      >
                        <div className="font-medium">{indicator}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {allIndicators[indicator]?.description || ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-gray-700 font-medium">Display Name</label>
            <input
              type="text"
              value={indicatorName}
              onChange={(e) => setIndicatorName(e.target.value)}
              className="w-full rounded border border-gray-300 p-2.5 text-gray-700 bg-white"
              placeholder="Enter a name for this indicator"
            />
          </div>

          {/* Dynamic Parameter Inputs */}
          {indicatorType && allIndicators[indicatorType]?.parameters && (
            <div className="space-y-4 mt-2">
              <div className="pb-2 border-b border-gray-200">
                <h3 className="text-base font-medium text-gray-700">
                  Parameters
                </h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(allIndicators[indicatorType].parameters).map(
                  ([paramName, paramInfo]) => (
                    <div key={paramName} className="space-y-2">
                      <label className="flex items-center text-gray-700 font-medium capitalize">
                        {paramInfo.description || paramName}
                        {paramInfo.description && (
                          <div className="group relative ml-2">
                            <Info size={14} className="text-gray-400" />
                            <div className="invisible group-hover:visible absolute left-full ml-2 top-1/2 -translate-y-1/2 w-60 bg-white text-gray-600 p-2 rounded text-xs shadow-md border border-gray-200">
                              {paramInfo.description}
                            </div>
                          </div>
                        )}
                      </label>
                      {renderParameterInput(paramName, paramInfo)}
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between items-center">
          <button
            className="px-4 py-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="flex items-center rounded bg-blue-600 hover:bg-blue-700 px-4 py-2 text-white transition-colors"
            onClick={handleSave}
          >
            <Save size={16} className="mr-1.5" />
            {existingIndicator ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddIndicatorModal;
