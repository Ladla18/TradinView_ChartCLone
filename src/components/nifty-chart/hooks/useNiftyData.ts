import { useState, useEffect } from "react";
import { NiftyDataPoint, ApiDataPoint } from "../types/index";

interface UseNiftyDataProps {
  days?: number;
  apiUrl?: string;
}

interface UseNiftyDataReturn {
  data: NiftyDataPoint[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useNiftyData = ({
  days = 0,
  apiUrl = "https://dev.api.tusta.co/charts/get_csv_data",
}: UseNiftyDataProps = {}): UseNiftyDataReturn => {
  const [data, setData] = useState<NiftyDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch data from the API
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const apiData: ApiDataPoint[] = await response.json();

        if (!apiData || !Array.isArray(apiData) || apiData.length === 0) {
          throw new Error("API returned empty or invalid data");
        }

        // Transform API data to our format
        const formattedData: NiftyDataPoint[] = apiData.map((item) => {
          const dateTime = new Date(item.time);
          const date = dateTime.toISOString().split("T")[0];
          const time = dateTime.toTimeString().split(" ")[0].substring(0, 5); // Format as HH:MM

          return {
            date: date,
            time: time,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
            volume: item.volume,
          };
        });

        // Use all data from the API response
        setData(formattedData);
      } catch (err) {
        console.error("Error fetching Nifty data:", err);
        setError(
          err instanceof Error ? err : new Error("An unknown error occurred")
        );
        // Set empty data on error
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshKey, apiUrl]);

  const refetch = () => setRefreshKey((prev) => prev + 1);

  return { data, loading, error, refetch };
};
