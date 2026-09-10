import Input from "../ui/Input";
import Select from "../ui/Select";

const ExpenseFilters = ({
  search,
  setSearch,
  category,
  setCategory,
  sort,
  setSort,
}) => {
  const categories = [
    { value: "food", label: "Food" },
    { value: "transport", label: "Transport" },
    { value: "shopping", label: "Shopping" },
    { value: "bills", label: "Bills" },
    { value: "entertainment", label: "Entertainment" },
    { value: "health", label: "Health" },
    { value: "other", label: "Other" },
  ];

  const sortOptions = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "highest", label: "Highest amount" },
    { value: "lowest", label: "Lowest amount" },
  ];

  return (
    <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-3">
      <Input
        label="Search"
        placeholder="Search expenses..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Select
        label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        options={categories}
      />

      <Select
        label="Sort"
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        options={sortOptions}
      />
    </div>
  );
};

export default ExpenseFilters;