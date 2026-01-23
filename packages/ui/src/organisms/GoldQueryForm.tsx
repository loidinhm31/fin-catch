import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Coins } from "lucide-react";
import {
  SimpleAlertDialog as AlertDialog,
  SimpleSelect as Select,
} from "../atoms";
import { DateRangePicker, FormField } from "../molecules";
import {
  GOLD_SOURCE_LABELS,
  GoldFormData,
  GoldPriceRequest,
  GoldSource,
  SJC_GOLD_PRICE_IDS,
} from "../types";
import {
  dateToUnixTimestamp,
  getDefaultDateRange,
  isValidDateRange,
} from "@fin-catch/shared";

export interface GoldQueryFormProps {
  onSubmit: (request: GoldPriceRequest) => void;
  isLoading?: boolean;
}

const goldSourceOptions = Object.entries(GOLD_SOURCE_LABELS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export const GoldQueryForm: React.FC<GoldQueryFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const { from, to } = getDefaultDateRange();
  const [showAlert, setShowAlert] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<GoldFormData>({
    defaultValues: {
      goldPriceId: "1",
      fromDate: from,
      toDate: to,
      source: "sjc" as GoldSource,
    },
  });

  const selectedSource = watch("source");

  // Dynamically generate gold price ID options based on selected source
  const goldPriceIdOptions = useMemo(() => {
    const sourceMap = selectedSource === "sjc" ? SJC_GOLD_PRICE_IDS : {};
    return Object.entries(sourceMap).map(([value, label]) => ({
      value,
      label,
    }));
  }, [selectedSource]);

  // Reset goldPriceId to first available option when source changes
  useEffect(() => {
    if (goldPriceIdOptions.length > 0) {
      setValue("goldPriceId", goldPriceIdOptions[0].value);
    }
  }, [selectedSource, goldPriceIdOptions, setValue]);

  const handleFormSubmit = (data: GoldFormData) => {
    // Validate date range
    if (!isValidDateRange(data.fromDate, data.toDate)) {
      setShowAlert(true);
      return;
    }

    // Convert to API request format
    const request: GoldPriceRequest = {
      gold_price_id: data.goldPriceId,
      from: dateToUnixTimestamp(data.fromDate),
      to: dateToUnixTimestamp(data.toDate),
      source: data.source,
    };

    onSubmit(request);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <Coins className="w-6 h-6" style={{ color: "var(--cube-yellow)" }} />
        <h3
          style={{
            fontSize: "var(--text-lg)",
            fontWeight: "var(--font-bold)",
            color: "var(--cube-gray-900)",
          }}
        >
          Gold Query
        </h3>
      </div>

      {/* Source Select */}
      <FormField
        label="Data Source"
        error={errors.source?.message}
        required
        htmlFor="gold-source"
      >
        <Controller
          name="source"
          control={control}
          rules={{ required: "Source is required" }}
          render={({ field }) => (
            <Select
              {...field}
              id="gold-source"
              options={goldSourceOptions}
              error={!!errors.source}
              fullWidth
            />
          )}
        />
      </FormField>

      {/* Gold Price ID Select */}
      <FormField
        label="Gold Type"
        error={errors.goldPriceId?.message}
        required
        htmlFor="gold-price-id"
      >
        <Controller
          name="goldPriceId"
          control={control}
          rules={{ required: "Gold type is required" }}
          render={({ field }) => (
            <Select
              {...field}
              id="gold-price-id"
              options={goldPriceIdOptions}
              error={!!errors.goldPriceId}
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

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full"
        style={{
          background: "linear-gradient(90deg, #facc15 0%, #fb923c 100%)",
        }}
      >
        {isLoading ? "LOADING..." : "QUERY GOLD DATA"}
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
