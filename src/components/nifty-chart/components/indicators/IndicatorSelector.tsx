import React, { useState } from "react";
import {
  Indicator,
  IndicatorSchema,
  SelectedIndicator,
} from "../../types/index";
import Modal from "../layout/Modal";
import {
  Search,
  Check,
  X,
  AlertCircle,
  Plus,
  Activity,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface IndicatorSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  indicatorSchema: IndicatorSchema | null;
  selectedIndicators: SelectedIndicator[];
  onAddIndicator: (id: string) => void;
  onRemoveIndicator: (id: string) => void;
  onUpdateIndicator: (id: string, paramName: string, value: any) => void;
  onToggleIndicator: (id: string) => void;
  onCalculate?: () => void;
  isLoading: boolean;
}

const IndicatorSelector: React.FC<IndicatorSelectorProps> = ({
  isOpen,
  onClose,
  indicatorSchema,
  selectedIndicators,
  onAddIndicator,
  onRemoveIndicator,
  onUpdateIndicator,
  onToggleIndicator,
  onCalculate,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"available" | "selected">(
    "available"
  );
  const [expandedIndicator, setExpandedIndicator] = useState<string | null>(
    null
  );

  // Filter indicators based on search term
  const filteredIndicators = indicatorSchema
    ? Object.entries(indicatorSchema)
        .filter(([id, indicator]) => {
          const term = searchTerm.toLowerCase();
          return (
            id.toLowerCase().includes(term) ||
            indicator.description.toLowerCase().includes(term)
          );
        })
        .sort((a, b) => a[1].description.localeCompare(b[1].description))
    : [];

  const renderIndicatorCard = (id: string, indicator: Indicator) => {
    const isExpanded = expandedIndicator === id;
    const isAdded = selectedIndicators.some((ind) => ind.id === id);

    return (
      <div
        key={id}
        className={`border rounded-lg p-4 mb-4 shadow-sm transition-all ${
          isAdded
            ? "bg-blue-50 border-l-4 border-l-blue-500 border-r-gray-200 border-t-gray-200 border-b-gray-200"
            : "bg-white border-gray-200"
        }`}
      >
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setExpandedIndicator(isExpanded ? null : id)}
        >
          <div>
            <div className="font-semibold text-lg text-gray-800">
              {indicator.description}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs mr-2 ${
                  indicator.position === "on_chart"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                {indicator.position === "on_chart"
                  ? "Overlay"
                  : "Separate Panel"}
              </span>
              <span className="text-gray-500">{id}</span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isAdded) {
                onRemoveIndicator(id);
              } else {
                onAddIndicator(id);
              }
            }}
            className={`px-3 py-2 rounded-md font-medium text-white shadow-sm transition-all transform hover:shadow-md hover:-translate-y-0.5 ${
              isAdded
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {isAdded ? "Remove" : "Add"}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-4 text-sm p-3 bg-gray-50 rounded-lg">
            <div className="mb-3 font-semibold flex items-center">
              <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white text-xs mr-2">
                P
              </span>
              Parameters
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {Object.entries(indicator.parameters).map(
                ([paramName, paramInfo]) => (
                  <div
                    key={paramName}
                    className="bg-white p-3 rounded-md border border-gray-200"
                  >
                    <div className="mb-2 font-medium text-gray-700">
                      {paramInfo.description}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {paramName} • {paramInfo.type} type
                    </div>
                    <div>
                      {paramInfo.options ? (
                        <select
                          defaultValue={paramInfo.default}
                          disabled={!isAdded}
                          onChange={(e) =>
                            onUpdateIndicator(id, paramName, e.target.value)
                          }
                          className={`w-full p-2 rounded border ${
                            isAdded
                              ? "bg-white border-gray-300 cursor-pointer text-gray-700"
                              : "bg-gray-100 border-gray-200 cursor-not-allowed text-gray-400"
                          }`}
                        >
                          {paramInfo.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : paramInfo.type === "int" ||
                        paramInfo.type === "float" ? (
                        <input
                          type="number"
                          defaultValue={paramInfo.default}
                          disabled={!isAdded}
                          onChange={(e) => {
                            const value =
                              paramInfo.type === "int"
                                ? parseInt(e.target.value, 10)
                                : parseFloat(e.target.value);
                            onUpdateIndicator(id, paramName, value);
                          }}
                          className={`w-full p-2 rounded border ${
                            isAdded
                              ? "bg-white border-gray-300 cursor-text text-gray-700"
                              : "bg-gray-100 border-gray-200 cursor-not-allowed text-gray-400"
                          }`}
                        />
                      ) : (
                        <input
                          type="text"
                          defaultValue={paramInfo.default}
                          disabled={!isAdded}
                          onChange={(e) =>
                            onUpdateIndicator(id, paramName, e.target.value)
                          }
                          className={`w-full p-2 rounded border ${
                            isAdded
                              ? "bg-white border-gray-300 cursor-text text-gray-700"
                              : "bg-gray-100 border-gray-200 cursor-not-allowed text-gray-400"
                          }`}
                        />
                      )}
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="mb-3 font-semibold flex items-center mt-5">
              <span className="flex items-center justify-center w-5 h-5 bg-orange-500 rounded-full text-white text-xs mr-2">
                O
              </span>
              Output
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(indicator.output).map(
                ([outputName, outputInfo]) => (
                  <div
                    key={outputName}
                    className="bg-white p-3 rounded-md border border-gray-200"
                  >
                    <div className="font-medium text-sm">
                      {outputInfo.description}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {outputName}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSelectedIndicators = () => {
    if (selectedIndicators.length === 0) {
      return (
        <div className="p-10 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <div className="text-5xl mb-3 text-gray-300">📊</div>
          <div className="font-medium mb-2">No indicators selected yet</div>
          <div className="text-sm">
            Go to the "Available" tab to add technical indicators to your chart
          </div>
        </div>
      );
    }

    return (
      <div>
        {selectedIndicators.map((indicator) => {
          const schema = indicatorSchema?.[indicator.id];
          if (!schema) return null;

          return (
            <div
              key={indicator.id}
              className={`border rounded-lg p-4 mb-4 shadow-sm transition-all ${
                indicator.active
                  ? "bg-white border-l-4 border-l-green-500 border-r-gray-200 border-t-gray-200 border-b-gray-200"
                  : "bg-gray-50 border-l-4 border-l-gray-400 border-r-gray-200 border-t-gray-200 border-b-gray-200"
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="font-semibold text-lg text-gray-800">
                    {indicator.name}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs mr-2 ${
                        schema.position === "on_chart"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {schema.position === "on_chart"
                        ? "Overlay"
                        : "Separate Panel"}
                    </span>
                    <span className="text-gray-500">{indicator.id}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onToggleIndicator(indicator.id)}
                    className={`px-3 py-2 rounded-md text-white font-medium transition-colors hover:opacity-90 ${
                      indicator.active ? "bg-blue-500" : "bg-gray-500"
                    }`}
                  >
                    {indicator.active ? "Disable" : "Enable"}
                  </button>

                  <button
                    onClick={() => onRemoveIndicator(indicator.id)}
                    className="px-3 py-2 bg-red-500 text-white rounded-md font-medium transition-colors hover:opacity-90"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-semibold mb-3">Parameters</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(schema.parameters).map(
                    ([paramName, paramInfo]) => (
                      <div key={paramName}>
                        <div className="text-sm font-medium mb-1.5">
                          {paramInfo.description}
                        </div>
                        <div className="text-xs text-gray-500 mb-1.5">
                          {paramName} • {paramInfo.type} type
                        </div>
                        {paramInfo.options ? (
                          <select
                            value={indicator.parameters[paramName]}
                            onChange={(e) =>
                              onUpdateIndicator(
                                indicator.id,
                                paramName,
                                e.target.value
                              )
                            }
                            className="w-full p-2 rounded border border-gray-300 bg-white"
                          >
                            {paramInfo.options.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : paramInfo.type === "int" ||
                          paramInfo.type === "float" ? (
                          <input
                            type="number"
                            value={indicator.parameters[paramName]}
                            onChange={(e) => {
                              const value =
                                paramInfo.type === "int"
                                  ? parseInt(e.target.value, 10)
                                  : parseFloat(e.target.value);
                              onUpdateIndicator(indicator.id, paramName, value);
                            }}
                            className="w-full p-2 rounded border border-gray-300"
                          />
                        ) : (
                          <input
                            type="text"
                            value={indicator.parameters[paramName]}
                            onChange={(e) =>
                              onUpdateIndicator(
                                indicator.id,
                                paramName,
                                e.target.value
                              )
                            }
                            className="w-full p-2 rounded border border-gray-300"
                          />
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chart Indicators"
      maxWidth="900px"
    >
      <div>
        <div className="mb-5">
          <div className="relative">
            <input
              type="text"
              placeholder="Search indicators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <Search
              className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>
        </div>

        <div className="flex border-b border-gray-200 mb-5 justify-between items-center">
          <div>
            <button
              onClick={() => setActiveTab("available")}
              className={`px-5 py-2.5 bg-transparent border-b-3 ${
                activeTab === "available"
                  ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                  : "border-b-0 text-gray-500 hover:text-gray-700"
              } transition-colors`}
            >
              Available Indicators
            </button>

            <button
              onClick={() => setActiveTab("selected")}
              className={`px-5 py-2.5 bg-transparent relative ${
                activeTab === "selected"
                  ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                  : "border-b-0 text-gray-500 hover:text-gray-700"
              } transition-colors`}
            >
              Selected Indicators
              {selectedIndicators.length > 0 && (
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs text-white ml-2 ${
                    activeTab === "selected" ? "bg-blue-500" : "bg-gray-400"
                  }`}
                >
                  {selectedIndicators.length}
                </span>
              )}
            </button>
          </div>

          {selectedIndicators.length > 0 && onCalculate && (
            <button
              onClick={onCalculate}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 rounded-md text-white font-medium flex items-center shadow-sm hover:shadow transform transition-all hover:-translate-y-0.5"
            >
              <Check size={16} className="mr-2" />
              Calculate Indicators
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-gray-500">
            <div className="inline-block w-10 h-10 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <div className="font-medium">Loading indicators...</div>
          </div>
        ) : activeTab === "available" ? (
          <div className="max-h-[500px] overflow-y-auto py-1 px-1 scrollbar scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {filteredIndicators.length > 0 ? (
              filteredIndicators.map(([id, indicator]) =>
                renderIndicatorCard(id, indicator)
              )
            ) : (
              <div className="p-10 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <div className="text-4xl mb-3 text-gray-300">🔍</div>
                <div className="font-medium mb-2">No results found</div>
                <div className="text-sm">
                  No indicators found matching "{searchTerm}"
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto py-1 px-1 scrollbar scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {renderSelectedIndicators()}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default IndicatorSelector;
