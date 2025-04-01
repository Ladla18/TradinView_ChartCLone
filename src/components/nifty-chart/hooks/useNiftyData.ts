import { useState, useEffect } from "react";
import { NiftyDataPoint, ApiDataPoint } from "../types/index";
import { generateMockNiftyData } from "../utils/mockData";

interface UseNiftyDataProps {
  days?: number;
  mockData?: boolean;
  apiUrl?: string;
}

interface UseNiftyDataReturn {
  data: NiftyDataPoint[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  isUsingMockData: boolean;
}

export const useNiftyData = ({
  days = 30,
  mockData = false,
  apiUrl = "https://dev.api.tusta.co/charts/get_csv_data",
}: UseNiftyDataProps = {}): UseNiftyDataReturn => {
  const [data, setData] = useState<NiftyDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isUsingMockData, setIsUsingMockData] = useState<boolean>(mockData);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (mockData) {
          const mockNiftyData = generateMockNiftyData(days);
          setData(mockNiftyData);
          setIsUsingMockData(true);
        } else {
          // Fetch data from the real API
          const response = await fetch(apiUrl);

          if (!response.ok) {
            throw new Error(
              `API request failed with status ${response.status}`
            );
          }

          const apiData: ApiDataPoint[] = await response.json();

          if (!apiData || !Array.isArray(apiData) || apiData.length === 0) {
            throw new Error("API returned empty or invalid data");
          }

          // Transform API data to our format
          const formattedData: NiftyDataPoint[] = apiData.map((item) => ({
            date: new Date(item.time).toISOString().split("T")[0],
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
            volume: item.volume,
          }));

          // Take only the number of days requested, starting from the most recent
          const limitedData = days ? formattedData.slice(-days) : formattedData;

          setData(limitedData);
          setIsUsingMockData(false);
        }
      } catch (err) {
        console.error("Error fetching Nifty data:", err);
        setError(
          err instanceof Error ? err : new Error("An unknown error occurred")
        );

        // Fallback to mock data if the API fails
        if (!mockData) {
          console.log("Falling back to mock data");
          const mockNiftyData = generateMockNiftyData(days);
          setData(mockNiftyData);
          setIsUsingMockData(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [days, mockData, refreshKey, apiUrl]);

  const refetch = () => setRefreshKey((prev) => prev + 1);

  return { data, loading, error, refetch, isUsingMockData };
};
