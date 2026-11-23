import api from "./api";

// Rules live under the collection they generate into.
const base = (type) => (type === "income" ? "/income/recurring" : "/expenses/recurring");

// The API creates an entry once its date is today in this zone, not in UTC.
const withTimeZone = (ruleData) => ({
  ...ruleData,
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
});

export const getRecurring = async (type) => {
  const response = await api.get(base(type));

  return response.data;
};

export const createRecurring = async (type, ruleData) => {
  const response = await api.post(base(type), withTimeZone(ruleData));

  return response.data;
};

export const updateRecurring = async (type, id, ruleData) => {
  const response = await api.put(`${base(type)}/${id}`, withTimeZone(ruleData));

  return response.data;
};

export const deleteRecurring = async (type, id) => {
  const response = await api.delete(`${base(type)}/${id}`);

  return response.data;
};
