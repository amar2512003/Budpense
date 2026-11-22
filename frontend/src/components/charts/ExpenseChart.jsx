// src/components/charts/ExpenseChart.jsx

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import useUIStore from "../../store/uiStore";
import { getChartTheme } from "./chartTheme";

const ExpenseChart = ({
  data = [],
}) => {
  const darkMode = useUIStore((state) => state.darkMode);
  const { axisColor, gridColor, tooltipContent, tooltipText } = getChartTheme(darkMode);

  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        No expense data available.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <LineChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />

          <XAxis
            dataKey="date"
            axisLine={{ stroke: gridColor }}
            tickLine={{ stroke: gridColor }}
            tick={{ fill: axisColor }}
          />

          <YAxis
            axisLine={{ stroke: gridColor }}
            tickLine={{ stroke: gridColor }}
            tick={{ fill: axisColor }}
          />

          <Tooltip
            contentStyle={tooltipContent}
            labelStyle={tooltipText}
            itemStyle={tooltipText}
          />

          <Line
            type="monotone"
            dataKey="amount"
            stroke={darkMode ? "#818cf8" : "#4f46e5"}
            strokeWidth={2}
            dot={{ r: 3, fill: darkMode ? "#818cf8" : "#4f46e5" }}
            activeDot={{ r: 5, fill: darkMode ? "#818cf8" : "#4f46e5" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExpenseChart;
