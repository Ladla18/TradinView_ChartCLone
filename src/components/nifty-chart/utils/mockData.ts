import { NiftyDataPoint } from "../types/index";

export const generateMockNiftyData = (days: number = 30): NiftyDataPoint[] => {
  const mockData: NiftyDataPoint[] = [];
  const today = new Date();

  let basePrice = 22000; // Starting price around Nifty 50's recent range

  for (let i = days; i > 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    // Random fluctuation between -1.5% to +1.5%
    const dailyFluctuation = (Math.random() * 3 - 1.5) / 100;

    const open = basePrice * (1 + (Math.random() * 0.5 - 0.25) / 100);
    const close = basePrice * (1 + dailyFluctuation);
    const high = Math.max(open, close) * (1 + (Math.random() * 0.5) / 100);
    const low = Math.min(open, close) * (1 - (Math.random() * 0.5) / 100);
    const volume = Math.floor(Math.random() * 10000000) + 10000000; // Between 10M and 20M

    mockData.push({
      date: date.toISOString().split("T")[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });

    // Update base price for next day
    basePrice = close;
  }

  return mockData;
};
