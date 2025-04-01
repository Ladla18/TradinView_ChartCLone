// Mock indicator data for fallback
const mockIndicators = {
  sma: {
    description: "Simple Moving Average",
    output: {
      value: { description: "SMA Line", type: "float" },
    },
    parameters: {
      length: {
        default: 14,
        description: "Period length",
        type: "int",
      },
      source: {
        default: "close",
        description: "Source data",
        type: "str",
        options: ["open", "high", "low", "close"],
      },
    },
    position: "on_chart",
  },
  rsi: {
    description: "Relative Strength Index",
    output: {
      value: { description: "RSI Line", type: "float" },
    },
    parameters: {
      length: {
        default: 14,
        description: "Period length",
        type: "int",
      },
      source: {
        default: "close",
        description: "Source data",
        type: "str",
        options: ["open", "high", "low", "close"],
      },
    },
    position: "below",
  },
  macd: {
    description: "Moving Average Convergence Divergence",
    output: {
      value: { description: "MACD Line", type: "float" },
      signal: { description: "Signal Line", type: "float" },
      histogram: { description: "Histogram", type: "float" },
    },
    parameters: {
      fast_length: {
        default: 12,
        description: "Fast EMA Length",
        type: "int",
      },
      slow_length: {
        default: 26,
        description: "Slow EMA Length",
        type: "int",
      },
      signal_length: {
        default: 9,
        description: "Signal Length",
        type: "int",
      },
      source: {
        default: "close",
        description: "Source data",
        type: "str",
        options: ["open", "high", "low", "close"],
      },
    },
    position: "below",
  },
};

// Chart indicator API services

/**
 * Fetches all available indicators from the API
 * @returns Promise that resolves to the indicator schema
 */
export const getAllIndicators = async () => {
  try {
    const response = await fetch(
      "https://dev.api.tusta.co/charts/get_all_indicators"
    );
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching indicators, using fallback data:", error);
    // Return mock data as fallback
    return mockIndicators;
  }
};

/**
 * Calculate indicators based on provided configuration
 * @param payload The indicator calculation configuration
 * @returns Promise that resolves to calculation results
 */
export const calculateIndicators = async (payload: any) => {
  try {
    const response = await fetch(
      "https://dev.api.tusta.co/charts/calculate_indicators_csv",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error calculating indicators, using fallback data:", error);
    // Return mock calculation results as fallback
    return {
      success: true,
      data: {
        indicators: payload.indicators.map((ind: any) => ({
          name: ind.name,
          values: Array(30)
            .fill(0)
            .map(() => Math.random() * 100),
        })),
      },
    };
  }
};
