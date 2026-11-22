export const getChartTheme = (darkMode) => {
  const axisColor = darkMode ? "#d1d5db" : "#4b5563";
  const gridColor = darkMode ? "#374151" : "#e5e7eb";

  return {
    axisColor,
    gridColor,
    tooltipContent: {
      backgroundColor: darkMode ? "#1f2937" : "#ffffff",
      border: `1px solid ${darkMode ? "#4b5563" : "#e5e7eb"}`,
      borderRadius: 8,
    },
    tooltipText: { color: axisColor },
  };
};
