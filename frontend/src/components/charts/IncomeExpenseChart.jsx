// src/components/charts/IncomeExpenseChart.jsx

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import useUIStore from "../../store/uiStore";
import { getChartTheme } from "./chartTheme";

const IncomeExpenseChart = ({
  data = [],
}) => {
  const darkMode = useUIStore((state) => state.darkMode);
  const { axisColor, gridColor, tooltipContent, tooltipText } = getChartTheme(darkMode);

  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        No income or expense data available.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
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
            dataKey="month"
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

          <Legend wrapperStyle={{ color: axisColor }} />

          <Bar
            dataKey="income"
            name="Income"
            fill={darkMode ? "#4ade80" : "#16a34a"}
            radius={[4, 4, 0, 0]}
          />

          <Bar
            dataKey="expense"
            name="Expense"
            fill={darkMode ? "#f87171" : "#dc2626"}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IncomeExpenseChart;
