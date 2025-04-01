import { useState } from "react";
import { AddIndicatorModal, SignalConditionsModal } from "../modals";
import { PlusCircle, Edit, X, AlertCircle, ChevronRight } from "lucide-react";

interface SavedIndicator {
  id: string;
  name: string;
  type: string;
  period: number;
  chartType: string;
  candleInterval: string;
  field: string;
  noOfCandles?: number;
  parameters?: any;
}

interface Condition {
  id: string;
  leftOperand: string;
  operator: string;
  rightOperand: string;
}

interface ConditionGroup {
  id: string;
  conditions: Condition[];
  logicalOperator: "AND" | "OR";
}

const StrategyAssistant = () => {
  const [showAddIndicatorModal, setShowAddIndicatorModal] = useState(false);
  const [showEntryConditionsModal, setShowEntryConditionsModal] =
    useState(false);
  const [showExitConditionsModal, setShowExitConditionsModal] = useState(false);
  const [savedIndicators, setSavedIndicators] = useState<SavedIndicator[]>([]);
  const [editingIndicator, setEditingIndicator] =
    useState<SavedIndicator | null>(null);
  const [entryConditions, setEntryConditions] = useState<ConditionGroup[]>([]);
  const [exitConditions, setExitConditions] = useState<ConditionGroup[]>([]);

  const openAddIndicatorModal = () => {
    setShowAddIndicatorModal(true);
  };

  const closeAddIndicatorModal = () => {
    setShowAddIndicatorModal(false);
    setEditingIndicator(null);
  };

  const handleEditIndicator = (indicator: SavedIndicator) => {
    setEditingIndicator(indicator);
    setShowAddIndicatorModal(true);
  };

  const handleDeleteIndicator = (id: string) => {
    setSavedIndicators(
      savedIndicators.filter((indicator) => indicator.id !== id)
    );
  };

  const handleEditEntry = () => {
    setShowEntryConditionsModal(true);
  };

  const handleEditExit = () => {
    setShowExitConditionsModal(true);
  };

  const handleSaveEntryConditions = (conditions: ConditionGroup[]) => {
    setEntryConditions(conditions);
  };

  const handleSaveExitConditions = (conditions: ConditionGroup[]) => {
    setExitConditions(conditions);
  };

  // Function to format conditions for display
  const formatConditionsForDisplay = (conditions: ConditionGroup[]): string => {
    if (!conditions || conditions.length === 0) {
      return "Not configured";
    }

    // Just return a summary for now
    return `${conditions.reduce(
      (acc, group) => acc + group.conditions.length,
      0
    )} condition${
      conditions.reduce((acc, group) => acc + group.conditions.length, 0) === 1
        ? ""
        : "s"
    }`;
  };

  const handleAddIndicator = async (indicator: any) => {
    try {
      console.log("Indicator added:", indicator);

      // If editing an existing indicator, update it
      if (editingIndicator) {
        setSavedIndicators((prevIndicators) =>
          prevIndicators.map((ind) =>
            ind.id === editingIndicator.id
              ? {
                  ...ind,
                  name: indicator.name,
                  type: indicator.type,
                  period: indicator.period,
                  parameters: indicator.parameters,
                  chartType: indicator.chartType || "Candle",
                  candleInterval: indicator.candleInterval || "5 Minutes",
                  field: indicator.field || "Equity",
                }
              : ind
          )
        );
      } else {
        // Otherwise add a new indicator
        const newIndicator: SavedIndicator = {
          id: `${indicator.type}_${Date.now()}`,
          name: indicator.name,
          type: indicator.type,
          period: indicator.period,
          parameters: indicator.parameters,
          chartType: indicator.chartType || "Candle",
          candleInterval: indicator.candleInterval || "5 Minutes",
          field: indicator.field || "Equity",
          noOfCandles:
            indicator.noOfCandles ||
            (indicator.type === "aroon" ? 14 : undefined),
        };

        setSavedIndicators([...savedIndicators, newIndicator]);
      }

      // Close the modal
      closeAddIndicatorModal();
    } catch (error) {
      console.error("Error calculating indicator:", error);
    }
  };

  return (
    <div className="w-full h-screen bg-white text-gray-800 overflow-y-auto">
      <div className="p-6 border-b border-gray-200 bg-gray-50 sticky top-0 z-10 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800">Strategy Assistant</h2>
        <p className="text-gray-500 mt-1">
          Create and manage trading strategies
        </p>
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-700">
            Technical Indicators
          </h3>
          <button
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors shadow-sm"
            onClick={openAddIndicatorModal}
          >
            <PlusCircle size={18} />
            <span>Add Indicator</span>
          </button>
        </div>

        {savedIndicators.length > 0 ? (
          <div className="space-y-4 mb-8">
            {savedIndicators.map((indicator) => (
              <div
                key={indicator.id}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                    <h4 className="font-medium text-lg text-gray-800">
                      {indicator.name}
                    </h4>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className="rounded-md p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                      onClick={() => handleEditIndicator(indicator)}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      className="rounded-md p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteIndicator(indicator.id)}
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm mt-4">
                  <div className="rounded-md bg-gray-50 p-3 border border-gray-100">
                    <div className="text-gray-500 mb-1 text-xs font-medium">
                      Type
                    </div>
                    <div className="text-gray-800">{indicator.type}</div>
                  </div>

                  {indicator.noOfCandles && (
                    <div className="rounded-md bg-gray-50 p-3 border border-gray-100">
                      <div className="text-gray-500 mb-1 text-xs font-medium">
                        Candles
                      </div>
                      <div className="text-gray-800">
                        {indicator.noOfCandles}
                      </div>
                    </div>
                  )}

                  {/* Chart Type */}
                  <div className="rounded-md bg-gray-50 p-3 border border-gray-100">
                    <div className="text-gray-500 mb-1 text-xs font-medium">
                      Chart Type
                    </div>
                    <div className="text-gray-800">{indicator.chartType}</div>
                  </div>

                  {/* Candle Interval */}
                  <div className="rounded-md bg-gray-50 p-3 border border-gray-100">
                    <div className="text-gray-500 mb-1 text-xs font-medium">
                      Interval
                    </div>
                    <div className="text-gray-800">
                      {indicator.candleInterval}
                    </div>
                  </div>

                  {/* Field Type */}
                  <div className="rounded-md bg-gray-50 p-3 border border-gray-100">
                    <div className="text-gray-500 mb-1 text-xs font-medium">
                      Field
                    </div>
                    <div className="inline-block px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">
                      {indicator.field}
                    </div>
                  </div>

                  {/* Display parameters */}
                  {indicator.parameters &&
                    Object.entries(indicator.parameters).map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded-md bg-gray-50 p-3 border border-gray-100"
                      >
                        <div className="text-gray-500 mb-1 text-xs font-medium">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </div>
                        <div className="text-gray-800">{String(value)}</div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
              <AlertCircle size={28} className="text-blue-500" />
            </div>
            <p className="text-gray-600 mb-6">No indicators added yet.</p>
            <button
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 transition-colors shadow-sm"
              onClick={openAddIndicatorModal}
            >
              <PlusCircle size={18} />
              <span>Add Your First Indicator</span>
            </button>
          </div>
        )}

        {/* Signal Conditions Section */}
        <div className="space-y-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-700">
            Signal Conditions
          </h3>

          {/* Entry When Section */}
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="p-5 flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mr-4 border border-green-200">
                  <ChevronRight className="text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Entry Signal</h4>
                  <div className="text-gray-500 text-sm mt-1">
                    {formatConditionsForDisplay(entryConditions)}
                  </div>
                </div>
              </div>
              <button
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center transition-colors"
                onClick={handleEditEntry}
              >
                <Edit size={16} className="mr-2" />
                Configure
              </button>
            </div>
          </div>

          {/* Exit When Section */}
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="p-5 flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mr-4 border border-red-200">
                  <ChevronRight className="text-red-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Exit Signal</h4>
                  <div className="text-gray-500 text-sm mt-1">
                    {formatConditionsForDisplay(exitConditions)}
                  </div>
                </div>
              </div>
              <button
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center transition-colors"
                onClick={handleEditExit}
              >
                <Edit size={16} className="mr-2" />
                Configure
              </button>
            </div>
          </div>
        </div>

        {/* Helpful tip */}
        <div className="bg-blue-50 rounded-lg p-4 flex items-start border border-blue-100 mt-8">
          <AlertCircle
            size={20}
            className="text-blue-500 mt-0.5 mr-3 flex-shrink-0"
          />
          <div>
            <h4 className="font-medium text-gray-700">Strategy Tip</h4>
            <p className="text-gray-600 text-sm mt-1">
              Combine technical indicators with entry/exit conditions to create
              a complete trading strategy. For example, use RSI for
              overbought/oversold conditions and moving averages for trend
              confirmation.
            </p>
          </div>
        </div>
      </div>

      {showAddIndicatorModal && (
        <AddIndicatorModal
          onClose={closeAddIndicatorModal}
          onAddIndicator={handleAddIndicator}
          existingIndicator={editingIndicator}
        />
      )}

      {showEntryConditionsModal && (
        <SignalConditionsModal
          isOpen={showEntryConditionsModal}
          onClose={() => setShowEntryConditionsModal(false)}
          title="Add Signal - Entry Condition"
          onSave={handleSaveEntryConditions}
          initialConditions={entryConditions}
        />
      )}

      {showExitConditionsModal && (
        <SignalConditionsModal
          isOpen={showExitConditionsModal}
          onClose={() => setShowExitConditionsModal(false)}
          title="Add Signal - Exit Condition"
          onSave={handleSaveExitConditions}
          initialConditions={exitConditions}
        />
      )}
    </div>
  );
};

export default StrategyAssistant;
