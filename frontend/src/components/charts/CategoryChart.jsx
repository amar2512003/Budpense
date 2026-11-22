// src/components/charts/CategoryChart.jsx

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import useUIStore from "../../store/uiStore";
import { getChartTheme } from "./chartTheme";

const COLORS = ["#6366f1", "#22c55e", "#f97316", "#ec4899", "#14b8a6", "#eab308"];

const CategoryChart = ({
  data = [],
}) => {
  const darkMode = useUIStore((state) => state.darkMode);
  const { axisColor, tooltipContent, tooltipText } = getChartTheme(darkMode);

  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        No category data available.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            innerRadius={45}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || COLORS[index % COLORS.length]}
                stroke={darkMode ? "#111827" : "#ffffff"}
              />
            ))}
          </Pie>

          <Tooltip
            contentStyle={tooltipContent}
            labelStyle={tooltipText}
            itemStyle={tooltipText}
          />

          <Legend wrapperStyle={{ color: axisColor }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryChart;
