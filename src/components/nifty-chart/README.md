# Nifty 50 Chart Component

A modular React component for displaying Nifty 50 stock data using Apache ECharts.

## Structure

The component is organized into a clean, modular structure:

```
nifty-chart/
├── components/            # React components
│   ├── NiftyChart.tsx     # Base chart component
│   └── NiftyChartContainer.tsx # Container with controls
├── hooks/                 # Custom React hooks
│   └── useNiftyData.ts    # Hook for fetching Nifty data
├── utils/                 # Utility functions
│   ├── chartUtils.ts      # ECharts options generator
│   └── mockData.ts        # Mock data generator
├── types/                 # TypeScript types
│   └── index.ts           # Type definitions
└── index.ts               # Main exports
```

## Usage

Import and use the component in your React application:

```tsx
import { NiftyChartContainer } from "./components/nifty-chart";

function App() {
  return (
    <div>
      <h1>Nifty 50 Chart</h1>
      <NiftyChartContainer
        initialOptions={{
          theme: "light",
          showVolume: true,
          title: "Nifty 50 Price Chart",
        }}
        days={30}
        useMockData={false}
        apiUrl="https://dev.api.tusta.co/charts/get_csv_data"
      />
    </div>
  );
}
```

## API

### `<NiftyChartContainer>`

Main container component with all controls and features.

#### Props

| Prop             | Type                  | Default                                          | Description                       |
| ---------------- | --------------------- | ------------------------------------------------ | --------------------------------- |
| `initialOptions` | `NiftyChartOptions`   | `{}`                                             | Initial chart options             |
| `days`           | `number`              | `30`                                             | Number of days of data to display |
| `className`      | `string`              | `''`                                             | Additional CSS class              |
| `style`          | `React.CSSProperties` | `{}`                                             | Inline styles                     |
| `useMockData`    | `boolean`             | `false`                                          | Whether to use mock data          |
| `apiUrl`         | `string`              | `'https://dev.api.tusta.co/charts/get_csv_data'` | URL for fetching data             |

### `<NiftyChart>`

Base chart component that renders the ECharts candlestick chart.

#### Props

| Prop        | Type                  | Default  | Description          |
| ----------- | --------------------- | -------- | -------------------- |
| `data`      | `NiftyDataPoint[]`    | Required | Chart data points    |
| `options`   | `NiftyChartOptions`   | `{}`     | Chart options        |
| `loading`   | `boolean`             | `false`  | Loading state        |
| `className` | `string`              | `''`     | Additional CSS class |
| `style`     | `React.CSSProperties` | `{}`     | Inline styles        |

### `useNiftyData` Hook

Custom hook for fetching and managing Nifty 50 data.

```tsx
const { data, loading, error, refetch, isUsingMockData } = useNiftyData({
  days: 30,
  mockData: false,
  apiUrl: "https://dev.api.tusta.co/charts/get_csv_data",
});
```

## Types

### `NiftyDataPoint`

```ts
interface NiftyDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}
```

### `NiftyChartOptions`

```ts
interface NiftyChartOptions {
  title?: string;
  showVolume?: boolean;
  height?: string | number;
  width?: string | number;
  theme?: "light" | "dark";
}
```

## Dependencies

- React
- echarts
- echarts-for-react
