import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { TrendingUp } from "lucide-react";
import {
  SimpleAlertDialog as AlertDialog,
  Input,
  SimpleSelect as Select,
} from "../atoms";
import { DateRangePicker, FormField } from "../molecules";
import {
  Resolution,
  RESOLUTION_LABELS,
  STOCK_SOURCE_LABELS,
  StockFormData,
  StockHistoryRequest,
  StockSource,
} from "../types";
import {
  dateToUnixTimestamp,
  getDefaultDateRange,
  isValidDateRange,
} from "@fin-catch/shared";

export interface StockQueryFormProps {
  onSubmit: (request: StockHistoryRequest) => void;
  isLoading?: boolean;
}

const resolutionOptions = Object.entries(RESOLUTION_LABELS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

const stockSourceOptions = Object.entries(STOCK_SOURCE_LABELS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export const StockQueryForm: React.FC<StockQueryFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const { from, to } = getDefaultDateRange();
  const [showAlert, setShowAlert] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<StockFormData>({
    defaultValues: {
      symbol: "AAPL",
      resolution: "1D" as Resolution,
      fromDate: from,
      toDate: to,
      source: "yahoo_finance" as StockSource,
    },
  });

  const handleFormSubmit = (data: StockFormData) => {
    // Validate date range
    if (!isValidDateRange(data.fromDate, data.toDate)) {
      setShowAlert(true);
      return;
    }

    // Convert to API request format
    const request: StockHistoryRequest = {
      symbol: data.symbol.trim().toUpperCase(),
      resolution: data.resolution,
      from: dateToUnixTimestamp(data.fromDate),
      to: dateToUnixTimestamp(data.toDate),
      source: data.source,
    };

    onSubmit(request);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp className="w-6 h-6" style={{ color: "var(--cube-cyan)" }} />
        <h3
          style={{
            fontSize: "var(--text-lg)",
            fontWeight: "var(--font-bold)",
            color: "var(--cube-gray-900)",
          }}
        >
          Stock Query
        </h3>
      </div>

      {/* Symbol Input */}
      <FormField
        label="Stock Symbol"
        error={errors.symbol?.message}
        required
        htmlFor="stock-symbol"
      >
        <Controller
          name="symbol"
          control={control}
          rules={{
            required: "Stock symbol is required",
            pattern: {
              value: /^[A-Za-z0-9^=.\-]+$/,
              message: "Invalid stock symbol format",
            },
          }}
          render={({ field }) => (
            <Input
              {...field}
              id="stock-symbol"
              placeholder="e.g., AAPL, TSLA, GC=F"
              error={!!errors.symbol}
              fullWidth
            />
          )}
        />
      </FormField>

      {/* Resolution Select */}
      <FormField
        label="Time Interval"
        error={errors.resolution?.message}
        required
        htmlFor="stock-resolution"
      >
        <Controller
          name="resolution"
          control={control}
          rules={{ required: "Resolution is required" }}
          render={({ field }) => (
            <Select
              {...field}
              id="stock-resolution"
              options={resolutionOptions}
              error={!!errors.resolution}
              fullWidth
            />
          )}
        />
      </FormField>

      {/* Date Range Picker */}
      <Controller
        name="fromDate"
        control={control}
        rules={{ required: "From date is required" }}
        render={({ field }) => (
          <Controller
            name="toDate"
            control={control}
            rules={{ required: "To date is required" }}
            render={({ field: toField }) => (
              <DateRangePicker
                fromDate={field.value}
                toDate={toField.value}
                onFromDateChange={(date) => field.onChange(date || new Date())}
                onToDateChange={(date) => toField.onChange(date || new Date())}
                fromError={errors.fromDate?.message}
                toError={errors.toDate?.message}
                required
              />
            )}
          />
        )}
      />

      {/* Source Select */}
      <FormField
        label="Data Source"
        error={errors.source?.message}
        htmlFor="stock-source"
      >
        <Controller
          name="source"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              id="stock-source"
              options={stockSourceOptions}
              error={!!errors.source}
              fullWidth
            />
          )}
        />
      </FormField>

      {/* Submit Button */}
      <button type="submit" disabled={isLoading} className="btn-primary w-full">
        {isLoading ? "LOADING..." : "QUERY STOCK DATA"}
      </button>

      {/* Date Validation Alert */}
      <AlertDialog
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title="Invalid Date Range"
        message="From date must be before To date"
        type="warning"
      />
    </form>
  );
};
