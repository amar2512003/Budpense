// src/components/charts/CategoryChart.jsx

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const CategoryChart = ({
  data = [],
}) => {
  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-gray-500">
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
              />
            ))}
          </Pie>

          <Tooltip />

          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryChart;