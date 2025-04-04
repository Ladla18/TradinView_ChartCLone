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
          // Extract time directly from the API time string
          // Format: "Fri, 12 Jan 2024 15:30:00 GMT"
          const timeString = item.time;

          // Use a UTC date object to avoid timezone conversion
          const dateObj = new Date(timeString);

          // Extract date parts in UTC
          const year = dateObj.getUTCFullYear();
          const month = (dateObj.getUTCMonth() + 1).toString().padStart(2, "0");
          const day = dateObj.getUTCDate().toString().padStart(2, "0");
          const date = `${year}-${month}-${day}`;

          // Extract hours and minutes in UTC
          const hours = dateObj.getUTCHours().toString().padStart(2, "0");
          const minutes = dateObj.getUTCMinutes().toString().padStart(2, "0");
          const time = `${hours}:${minutes}`;

          // Log sample time conversion for debugging
          if (apiData.indexOf(item) === 0) {
            console.log("Original time from API:", timeString);
            console.log("Extracted UTC time:", time);
            console.log("Extracted UTC date:", date);
          }

          return {
            date,
            time,
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
