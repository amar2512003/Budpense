import Input from "../ui/Input";
import Select from "../ui/Select";

import { FREQUENCIES } from "../../constants/enums";

/** The repeat and end date inputs, for a form whose state holds both. */
const RepeatFields = ({ repeat, endDate, onChange }) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <Select
      label="Repeat"
      name="repeat"
      value={repeat}
      onChange={onChange}
      options={FREQUENCIES}
      placeholder="Does not repeat"
    />

    {repeat && (
      <Input
        label="Ends on (optional)"
        name="endDate"
        type="date"
        value={endDate}
        onChange={onChange}
      />
    )}
  </div>
);

export default RepeatFields;
