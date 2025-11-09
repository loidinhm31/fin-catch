import React from "react";
import { DateInput } from "../atoms";
import { FormField } from "./FormField";

export interface DateRangePickerProps {
  fromDate: Date;
  toDate: Date;
  onFromDateChange: (date: Date | null) => void;
  onToDateChange: (date: Date | null) => void;
  fromError?: string;
  toError?: string;
  required?: boolean;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  fromError,
  toError,
  required = false,
  className = "",
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      <FormField label="From Date" error={fromError} required={required} htmlFor="from-date">
        <DateInput
          id="from-date"
          value={fromDate}
          onChange={onFromDateChange}
          error={!!fromError}
          fullWidth
        />
      </FormField>

      <FormField label="To Date" error={toError} required={required} htmlFor="to-date">
        <DateInput
          id="to-date"
          value={toDate}
          onChange={onToDateChange}
          error={!!toError}
          fullWidth
        />
      </FormField>
    </div>
  );
};
