const protectSpreadsheetFormula = (value) => {
  if (typeof value !== "string") return value;

  // Spreadsheet apps may evaluate cells that start with formula characters.
  return /^[\u0000-\u0020]*[=+\-@]/.test(value) ? `'${value}` : value;
};

const escapeCsvCell = (value) => {
  const safeValue = protectSpreadsheetFormula(value);
  const text = safeValue == null ? "" : String(safeValue);

  return `"${text.replaceAll('"', '""')}"`;
};

export const createCsv = (rows, columns) => {
  const header = columns.map(({ label }) => escapeCsvCell(label)).join(",");
  const records = rows.map((row) =>
    columns.map(({ value }) => escapeCsvCell(value(row))).join(","),
  );

  return `\uFEFF${[header, ...records].join("\r\n")}`;
};

export const downloadCsv = (rows, columns, filename) => {
  const blob = new Blob([createCsv(rows, columns)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
