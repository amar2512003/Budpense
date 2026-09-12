import Input from "../ui/Input";
import Select from "../ui/Select";

import { CATEGORIES, SORT_OPTIONS } from "../../constants/enums";

const ExpenseFilters = ({
  search,
  setSearch,
  category,
  setCategory,
  sort,
  setSort,
}) => {
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
        options={CATEGORIES}
        // Select renders its placeholder as the empty option, which is exactly
        // the "no filter" value the API expects.
        placeholder="All categories"
      />

      <Select
        label="Sort"
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        options={SORT_OPTIONS}
        // Always has a value; a blank option here would just mean "newest"
        // again, spelled confusingly.
        placeholder={null}
      />
    </div>
  );
};

export default ExpenseFilters;