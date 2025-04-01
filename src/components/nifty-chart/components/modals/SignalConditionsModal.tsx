import React, { useState } from "react";
import {
  X,
  Trash2,
  Plus,
  Save,
  AlertTriangle,
  
} from "lucide-react";

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

interface SignalConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSave: (conditionGroups: ConditionGroup[]) => void;
  initialConditions?: ConditionGroup[];
}

const SignalConditionsModal: React.FC<SignalConditionsModalProps> = ({
  isOpen,
  onClose,
  title,
  onSave,
  initialConditions = [],
}) => {
  const [conditionGroups, setConditionGroups] = useState<ConditionGroup[]>(
    initialConditions.length > 0
      ? initialConditions
      : [
          {
            id: "group-" + Date.now(),
            conditions: [
              {
                id: "condition-" + Date.now(),
                leftOperand: "Current Close",
                operator: "Equal To",
                rightOperand: "Current Open",
              },
            ],
            logicalOperator: "AND",
          },
        ]
  );

  const operandOptions = [
    "Current Close",
    "Current Open",
    "Current High",
    "Current Low",
    "Previous Close",
    "Previous Open",
    "Previous High",
    "Previous Low",
    "MA(5)",
    "MA(10)",
    "MA(20)",
    "MA(50)",
    "MA(200)",
    "RSI(14)",
    "MACD",
  ];

  const operatorOptions = [
    "Equal To",
    "Greater Than",
    "Less Than",
    "Greater Than or Equal To",
    "Less Than or Equal To",
    "Not Equal To",
    "Crosses Above",
    "Crosses Below",
  ];

  const addCondition = (groupId: string) => {
    setConditionGroups(
      conditionGroups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            conditions: [
              ...group.conditions,
              {
                id: "condition-" + Date.now(),
                leftOperand: "Current Open",
                operator: "Equal To",
                rightOperand: "",
              },
            ],
          };
        }
        return group;
      })
    );
  };

  const removeCondition = (groupId: string, conditionId: string) => {
    setConditionGroups(
      conditionGroups.map((group) => {
        if (group.id === groupId) {
          // Ensure at least one condition remains
          if (group.conditions.length > 1) {
            return {
              ...group,
              conditions: group.conditions.filter((c) => c.id !== conditionId),
            };
          }
        }
        return group;
      })
    );
  };

  const toggleLogicalOperator = (groupId: string) => {
    setConditionGroups(
      conditionGroups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            logicalOperator: group.logicalOperator === "AND" ? "OR" : "AND",
          };
        }
        return group;
      })
    );
  };

  const updateCondition = (
    groupId: string,
    conditionId: string,
    field: keyof Condition,
    value: string
  ) => {
    setConditionGroups(
      conditionGroups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            conditions: group.conditions.map((condition) => {
              if (condition.id === conditionId) {
                return {
                  ...condition,
                  [field]: value,
                };
              }
              return condition;
            }),
          };
        }
        return group;
      })
    );
  };

  const addConditionGroup = () => {
    setConditionGroups([
      ...conditionGroups,
      {
        id: "group-" + Date.now(),
        conditions: [
          {
            id: "condition-" + Date.now(),
            leftOperand: "Current Close",
            operator: "Equal To",
            rightOperand: "Current Open",
          },
        ],
        logicalOperator: "AND",
      },
    ]);
  };

  const removeConditionGroup = (groupId: string) => {
    if (conditionGroups.length > 1) {
      setConditionGroups(
        conditionGroups.filter((group) => group.id !== groupId)
      );
    }
  };

  const handleSave = () => {
    onSave(conditionGroups);
    onClose();
  };

  const handleDelete = () => {
    onSave([]);
    onClose();
  };

  if (!isOpen) return null;

  // Check if conditions are valid for save
  const hasEmptyFields = conditionGroups.some((group) =>
    group.conditions.some(
      (condition) => !condition.leftOperand || !condition.rightOperand
    )
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black opacity-15 backdrop-filter backdrop-blur-sm"></div>
      <div className="w-[92%] max-w-[700px] bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden z-10">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 relative">
          <h2 className="text-lg font-medium text-gray-800">
            {title}
            <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-sm font-normal text-gray-600">
              {conditionGroups.reduce(
                (total, group) => total + group.conditions.length,
                0
              )}{" "}
              condition
              {conditionGroups.reduce(
                (total, group) => total + group.conditions.length,
                0
              ) === 1
                ? ""
                : "s"}
            </span>
          </h2>
          <button
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 rounded-full p-1"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick help tip */}
        <div className="px-5 py-3 bg-gray-50 text-sm text-gray-600 border-b border-gray-200">
          Define conditions that compare indicators or price values to generate
          trading signals
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {conditionGroups.map((group, groupIndex) => (
            <div
              key={group.id}
              className="mb-5 bg-white rounded-lg p-4 border border-gray-200"
            >
              {conditionGroups.length > 1 && (
                <div className="flex justify-between items-center mb-3">
                  <div className="text-sm font-medium text-gray-500">
                    Group {groupIndex + 1}
                  </div>
                  <button
                    className="p-1 rounded text-gray-400 hover:text-gray-600"
                    onClick={() => removeConditionGroup(group.id)}
                    title="Remove group"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              {group.conditions.map((condition, condIndex) => (
                <React.Fragment key={condition.id}>
                  <div className="mb-4 p-3 rounded border border-gray-200 bg-gray-50">
                    <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 items-start">
                      {/* First operand */}
                      <div className="sm:col-span-3">
                        <label className="block text-xs text-gray-500 mb-1">
                          Left Operand
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={condition.leftOperand}
                            onChange={(e) =>
                              updateCondition(
                                group.id,
                                condition.id,
                                "leftOperand",
                                e.target.value
                              )
                            }
                            className="w-full p-2 border border-gray-300 rounded text-gray-700 bg-white"
                            placeholder="Select indicator"
                            list="operands"
                          />
                          {condition.leftOperand && (
                            <button
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              onClick={() =>
                                updateCondition(
                                  group.id,
                                  condition.id,
                                  "leftOperand",
                                  ""
                                )
                              }
                              title="Clear field"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                        <datalist id="operands">
                          {operandOptions.map((option) => (
                            <option key={option} value={option} />
                          ))}
                        </datalist>
                      </div>

                      {/* Operator */}
                      <div className="sm:col-span-1">
                        <label className="block text-xs text-gray-500 mb-1">
                          Operator
                        </label>
                        <select
                          value={condition.operator}
                          onChange={(e) =>
                            updateCondition(
                              group.id,
                              condition.id,
                              "operator",
                              e.target.value
                            )
                          }
                          className="w-full p-2 border border-gray-300 rounded text-gray-700 bg-white appearance-none"
                          style={{
                            backgroundImage:
                              "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                            backgroundPosition: "right 0.5rem center",
                            backgroundRepeat: "no-repeat",
                            backgroundSize: "1.5em 1.5em",
                            paddingRight: "2.5rem",
                          }}
                        >
                          {operatorOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Second operand */}
                      <div className="sm:col-span-3">
                        <label className="block text-xs text-gray-500 mb-1">
                          Right Operand
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={condition.rightOperand}
                            onChange={(e) =>
                              updateCondition(
                                group.id,
                                condition.id,
                                "rightOperand",
                                e.target.value
                              )
                            }
                            className="w-full p-2 border border-gray-300 rounded text-gray-700 bg-white"
                            placeholder="Select indicator or value"
                            list="operands"
                          />
                          {condition.rightOperand && (
                            <button
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              onClick={() =>
                                updateCondition(
                                  group.id,
                                  condition.id,
                                  "rightOperand",
                                  ""
                                )
                              }
                              title="Clear field"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Remove condition button - only visible when there are multiple conditions */}
                      <div>
                        {group.conditions.length > 1 && (
                          <button
                            className="mt-6 p-1 rounded text-gray-400 hover:text-red-500"
                            onClick={() =>
                              removeCondition(group.id, condition.id)
                            }
                            title="Remove condition"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Show logical operator toggle between conditions */}
                  {condIndex < group.conditions.length - 1 && (
                    <div className="flex justify-center mb-4">
                      <div className="inline-flex items-center">
                        <button
                          className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                            group.logicalOperator === "AND"
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          } rounded-l-md`}
                          onClick={() => {
                            if (group.logicalOperator !== "AND")
                              toggleLogicalOperator(group.id);
                          }}
                        >
                          AND
                        </button>
                        <button
                          className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                            group.logicalOperator === "OR"
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          } rounded-r-md`}
                          onClick={() => {
                            if (group.logicalOperator !== "OR")
                              toggleLogicalOperator(group.id);
                          }}
                        >
                          OR
                        </button>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}

              {/* Add Condition button */}
              <button
                className="mt-2 w-full py-2 border border-dashed border-gray-300 bg-white hover:bg-gray-50 text-gray-600 rounded flex items-center justify-center transition-colors"
                onClick={() => addCondition(group.id)}
              >
                <Plus size={16} className="mr-1" />
                Add Condition
              </button>
            </div>
          ))}

          {/* Add Condition Group button - only show if there are conditions */}
          {conditionGroups.length > 0 && (
            <button
              className="w-full py-2.5 border border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded flex items-center justify-center transition-colors"
              onClick={addConditionGroup}
            >
              <Plus size={16} className="mr-1" />
              Add Another Group
            </button>
          )}
        </div>

        {/* Warning for empty fields */}
        {hasEmptyFields && (
          <div className="px-5 py-2.5 bg-yellow-50 border-t border-yellow-100 flex items-center">
            <AlertTriangle
              size={16}
              className="text-yellow-500 mr-2 flex-shrink-0"
            />
            <span className="text-sm text-yellow-700">
              Fill all fields to enable saving
            </span>
          </div>
        )}

        <div className="flex justify-between border-t border-gray-200 p-4 bg-gray-50">
          <button
            className="px-3 py-1.5 border border-gray-300 bg-white text-gray-600 rounded hover:bg-gray-50 flex items-center transition-colors"
            onClick={handleDelete}
          >
            <Trash2 size={16} className="mr-1.5" />
            Clear All
          </button>
          <button
            className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center transition-colors shadow-sm disabled:opacity-50 disabled:pointer-events-none"
            onClick={handleSave}
            disabled={hasEmptyFields}
          >
            <Save size={16} className="mr-1.5" />
            Save Conditions
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignalConditionsModal;
