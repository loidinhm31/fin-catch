import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Coins } from "lucide-react";
import {
  SimpleAlertDialog as AlertDialog,
  SimpleSelect as Select,
} from "@fin-catch/ui/components/atoms";
import { DateRangePicker, FormField } from "@fin-catch/ui/components/molecules";
import {
  dateToUnixTimestamp,
  getDefaultDateRange,
  GOLD_SOURCE_LABELS,
  GoldFormData,
  GoldPriceRequest,
  GoldSource,
  isValidDateRange,
  SJC_GOLD_TYPE_CATEGORIES,
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
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState("0");

  // Generate category options: "category_name (category_name_en)"
  const categoryOptions = useMemo(() => {
    if (selectedSource !== "sjc") {
      return [];
    }
    return SJC_GOLD_TYPE_CATEGORIES.map((category, index) => ({
      value: String(index),
      label: `${category.category_name} (${category.category_name_en})`,
    }));
  }, [selectedSource]);

  // Generate location options based on selected category
  const locationOptions = useMemo(() => {
    if (selectedSource !== "sjc") {
      return [];
    }
    const categoryIndex = parseInt(selectedCategoryIndex, 10);
    const category = SJC_GOLD_TYPE_CATEGORIES[categoryIndex];
    if (!category) {
      return [];
    }
    return category.items.map((item) => ({
      value: item.id,
      label: `${item.location} (${item.location_en})`,
    }));
  }, [selectedSource, selectedCategoryIndex]);

  // Reset goldPriceId to first item when category changes
  useEffect(() => {
    if (locationOptions.length > 0) {
      setValue("goldPriceId", locationOptions[0].value);
    }
  }, [selectedCategoryIndex, locationOptions, setValue]);

  // Reset category and goldPriceId when source changes
  useEffect(() => {
    setSelectedCategoryIndex("0");
  }, [selectedSource]);

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

      {/* Gold Category Select */}
      <FormField label="Gold Category" required htmlFor="gold-category">
        <Select
          id="gold-category"
          value={selectedCategoryIndex}
          onChange={setSelectedCategoryIndex}
          options={categoryOptions}
          fullWidth
        />
      </FormField>

      {/* Gold Location Select */}
      <FormField
        label="Location"
        error={errors.goldPriceId?.message}
        required
        htmlFor="gold-price-id"
      >
        <Controller
          name="goldPriceId"
          control={control}
          rules={{ required: "Location is required" }}
          render={({ field }) => (
            <Select
              {...field}
              id="gold-price-id"
              options={locationOptions}
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
          background: "var(--color-amber-400)",
          boxShadow: "0 0 15px rgba(251, 191, 36, 0.5)",
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
