import { useState, useRef, useEffect } from "react";
import NiftyChartContainer from "../core/NiftyChartContainer";
import StrategyAssistant from "../strategy/StrategyAssistant";
import { IndicatorCalculationResult } from "../../types";



export default function MainPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [leftPanelWidth, setLeftPanelWidth] = useState(70);
  const [isDragging, setIsDragging] = useState(false);
  const [indicatorData, setIndicatorData] = useState<
    IndicatorCalculationResult[]
  >([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };
  
  // Handle indicator data updates from StrategyAssistant
  const handleIndicatorDataUpdate = (data: IndicatorCalculationResult[]) => {
    console.log("MainPage received indicator data:", data);
    setIndicatorData(data);
  };

  // Set up dragging handlers
  const startDragging = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const stopDragging = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;

    // Calculate percentage (clamped between 30% and 85%)
    const newLeftPanelWidth = Math.min(
      Math.max((mouseX / containerWidth) * 100, 30),
      85
    );

    setLeftPanelWidth(newLeftPanelWidth);
  };

  // Add and remove event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", stopDragging);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDragging);
    };
  }, [isDragging]);

  return (
    <div className="flex w-full" ref={containerRef}>
      <div
        className={`min-h-screen transition-colors duration-300 ${
          theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-800"
        }`}
        style={{ width: `${leftPanelWidth}%` }}
      >
       

        <NiftyChartContainer
          initialOptions={{
            theme: theme,
            showVolume: true,
            title: "Nifty 50 Price Chart",
          }}
          days={30}
         
          apiUrl="https://dev.api.tusta.co/charts/get_csv_data"
          calculationResults={indicatorData}
        />
      </div>

      {/* Resizable Divider */}
      <div
        className={`w-2 relative group cursor-col-resize transition-colors duration-150 ${
          theme === "dark" ? "bg-gray-700" : "bg-gray-200"
        }`}
        onMouseDown={startDragging}
      >
        {/* Divider handle/grip */}
        <div
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
            w-5 h-20 rounded-full flex flex-col items-center justify-center gap-1.5
            transition-all duration-200
            ${
              isDragging
                ? theme === "dark"
                  ? "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                  : "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                : theme === "dark"
                ? "bg-gray-600 group-hover:bg-blue-600"
                : "bg-gray-300 group-hover:bg-blue-400"
            }`}
        >
          {/* Grip dots */}
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`w-1 h-4 rounded-full ${
                isDragging || theme === "dark" ? "bg-gray-200" : "bg-gray-500"
              }`}
            />
          ))}
        </div>

        {/* Active/hover overlay for better grabbing area */}
        <div
          className={`absolute inset-x-[-4px] inset-y-0 ${
            isDragging
              ? theme === "dark"
                ? "bg-blue-600/20"
                : "bg-blue-500/10"
              : "hover:bg-blue-400/10"
          }`}
        />
      </div>

      <div
        className={`transition-colors duration-300 ${
          theme === "dark"
            ? "border-gray-700 bg-gray-800"
            : "border-gray-200 bg-gray-50"
        }`}
        style={{ width: `${100 - leftPanelWidth}%` }}
      >
        <StrategyAssistant onIndicatorDataUpdate={handleIndicatorDataUpdate} />
      </div>
    </div>
  );
}
