import React from "react";
import {
  DatePicker,
  Input,
  Label,
  SimpleSelect as Select,
} from "@/components/atoms";

export interface BondEntryFormProps {
  bondIdentifier: string;
  setBondIdentifier: (value: string) => void;
  bondInputMode: "direct" | "calculated";
  setBondInputMode: (value: "direct" | "calculated") => void;
  faceValue: string;
  setFaceValue: (value: string) => void;
  couponRate: string;
  setCouponRate: (value: string) => void;
  maturityDate: Date | undefined;
  setMaturityDate: (date: Date | undefined) => void;
  couponFrequency: "annual" | "semiannual" | "quarterly" | "monthly";
  setCouponFrequency: (
    value: "annual" | "semiannual" | "quarterly" | "monthly",
  ) => void;
  currentMarketPrice: string;
  setCurrentMarketPrice: (value: string) => void;
  ytm: string;
  setYtm: (value: string) => void;
  totalInvestment: string;
  setTotalInvestment: (value: string) => void;
  quantity: string;
  setQuantity: (value: string) => void;
  purchasePrice: string;
  setPurchasePrice: (value: string) => void;
  purchaseDate: Date | undefined;
  setPurchaseDate: (date: Date | undefined) => void;
  error: string | null;
  isSubmitting: boolean;
}

export const BondEntryForm: React.FC<BondEntryFormProps> = ({
  bondIdentifier,
  setBondIdentifier,
  bondInputMode,
  setBondInputMode,
  faceValue,
  setFaceValue,
  couponRate,
  setCouponRate,
  maturityDate,
  setMaturityDate,
  couponFrequency,
  setCouponFrequency,
  currentMarketPrice,
  setCurrentMarketPrice,
  ytm,
  setYtm,
  totalInvestment,
  setTotalInvestment,
  quantity,
  setQuantity,
  purchasePrice,
  setPurchasePrice,
  purchaseDate,
  setPurchaseDate,
  error,
  isSubmitting,
}) => {
  return (
    <>
      <div>
        <Label required>Bond Identifier/ISIN</Label>
        <Input
          type="text"
          value={bondIdentifier}
          onChange={(e) => setBondIdentifier(e.target.value)}
          placeholder="e.g., US912828Z749"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <Label required>Expected Yield (YTM %)</Label>
        <Input
          type="number"
          step="0.01"
          value={ytm}
          onChange={(e) => setYtm(e.target.value)}
          placeholder="e.g., 6.5"
          disabled={isSubmitting}
        />
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--cube-gray-500)",
            marginTop: "var(--space-1)",
          }}
        >
          Annual yield to maturity percentage
        </p>
      </div>

      <div>
        <Label>Input Mode</Label>
        <Select
          value={bondInputMode}
          onValueChange={(value) =>
            setBondInputMode(value as "direct" | "calculated")
          }
          disabled={isSubmitting}
          options={[
            { value: "direct", label: "Direct Input (Manual Entry)" },
            { value: "calculated", label: "Calculate from Investment Data" },
          ]}
        />
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--cube-gray-500)",
            marginTop: "var(--space-1)",
          }}
        >
          {bondInputMode === "direct"
            ? "Manually enter face value, coupon rate, and prices"
            : "Calculate bond parameters from investment amount and expected yield"}
        </p>
      </div>

      <div>
        <Label required>Face Value</Label>
        <Input
          type="number"
          step="0.01"
          value={faceValue}
          onChange={(e) => setFaceValue(e.target.value)}
          placeholder="e.g., 1000"
          disabled={isSubmitting}
        />
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--cube-gray-500)",
            marginTop: "var(--space-1)",
          }}
        >
          Par/nominal value per bond
        </p>
      </div>

      {bondInputMode === "calculated" ? (
        <>
          {/* Calculated Mode Inputs */}
          <div
            className="p-4"
            style={{
              backgroundColor: "var(--cube-gray-50)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--cube-gray-200)",
            }}
          >
            <p
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-medium)",
                marginBottom: "var(--space-3)",
              }}
            >
              Investment Parameters
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label required>Total Investment (P_total)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={totalInvestment}
                  onChange={(e) => setTotalInvestment(e.target.value)}
                  placeholder="Total amount invested"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label required>Quantity (N)</Label>
                <Input
                  type="number"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Number of bonds"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              style={{ marginTop: "var(--space-3)" }}
            >
              <div>
                <Label required>Purchase Price (P_buy)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="e.g., 106.084"
                  disabled={isSubmitting}
                />
                <p
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--cube-gray-500)",
                    marginTop: "var(--space-1)",
                  }}
                >
                  Percentage of face value (e.g., 106.084 = 106.084%)
                </p>
              </div>
            </div>

            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              style={{ marginTop: "var(--space-3)" }}
            >
              <div>
                <Label required>Purchase Date</Label>
                <DatePicker
                  date={purchaseDate}
                  onDateChange={setPurchaseDate}
                  placeholder="Select purchase date"
                  disabled={isSubmitting}
                  error={!purchaseDate && !!error}
                />
              </div>
              <div>
                <Label required>Maturity Date</Label>
                <DatePicker
                  date={maturityDate}
                  onDateChange={setMaturityDate}
                  placeholder="Select maturity date"
                  disabled={isSubmitting}
                  error={!maturityDate && !!error}
                />
              </div>
            </div>

            <div
              style={{
                marginTop: "var(--space-3)",
                padding: "var(--space-2)",
                backgroundColor: "var(--cube-blue-50)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--cube-blue-200)",
              }}
            >
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--cube-blue-700)",
                }}
              >
                Bond parameters will be calculated automatically as you fill in
                the fields above.
              </p>
            </div>
          </div>

          {/* Calculated Results */}
          {faceValue && couponRate && purchasePrice && (
            <div
              className="p-4"
              style={{
                backgroundColor: "var(--cube-green-50)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--cube-green-200)",
              }}
            >
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  marginBottom: "var(--space-3)",
                  color: "var(--cube-green-800)",
                }}
              >
                Calculated Results
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Face Value</Label>
                  <Input
                    type="text"
                    value={faceValue}
                    readOnly
                    style={{
                      backgroundColor: "#f9fafb",
                      color: "#111827",
                      cursor: "not-allowed",
                      fontWeight: 600,
                    }}
                  />
                </div>
                <div>
                  <Label>Purchase Price per Bond</Label>
                  <Input
                    type="text"
                    value={purchasePrice}
                    readOnly
                    style={{
                      backgroundColor: "#f9fafb",
                      color: "#111827",
                      cursor: "not-allowed",
                      fontWeight: 600,
                    }}
                  />
                </div>
              </div>
              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                style={{ marginTop: "var(--space-3)" }}
              >
                <div>
                  <Label>Coupon Rate (%)</Label>
                  <Input
                    type="text"
                    value={couponRate}
                    readOnly
                    style={{
                      backgroundColor: "#f9fafb",
                      color: "#111827",
                      cursor: "not-allowed",
                      fontWeight: 600,
                    }}
                  />
                </div>
              </div>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--cube-green-700)",
                  marginTop: "var(--space-2)",
                }}
              >
                Note: Current market value will be calculated automatically
                based on time to maturity and YTM when viewing portfolio
                performance.
              </p>
            </div>
          )}

          <div>
            <Label required>Coupon Frequency</Label>
            <Select
              value={couponFrequency}
              onValueChange={(value) => setCouponFrequency(value as any)}
              disabled={isSubmitting}
              options={[
                { value: "annual", label: "Annual" },
                { value: "semiannual", label: "Semi-Annual" },
                { value: "quarterly", label: "Quarterly" },
                { value: "monthly", label: "Monthly" },
              ]}
            />
          </div>
        </>
      ) : (
        <>
          {/* Direct Input Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label required>Annual Coupon Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={couponRate}
                onChange={(e) => setCouponRate(e.target.value)}
                placeholder="e.g., 5.0"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label required>Quantity</Label>
              <Input
                type="number"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Number of bonds"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label required>Purchase Price per Bond</Label>
              <Input
                type="number"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="Price paid per bond"
                disabled={isSubmitting}
              />
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--cube-gray-500)",
                  marginTop: "var(--space-1)",
                }}
              >
                May differ from face value (premium/discount)
              </p>
            </div>
          </div>

          <div>
            <Label>Current Market Price (Optional)</Label>
            <Input
              type="number"
              step="0.01"
              value={currentMarketPrice}
              onChange={(e) => setCurrentMarketPrice(e.target.value)}
              placeholder="Manual price for valuation"
              disabled={isSubmitting}
            />
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--cube-gray-500)",
                marginTop: "var(--space-1)",
              }}
            >
              Leave empty to use face value
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label required>Maturity Date</Label>
              <DatePicker
                date={maturityDate}
                onDateChange={setMaturityDate}
                placeholder="Select maturity date"
                disabled={isSubmitting}
                error={!maturityDate && !!error}
              />
            </div>
            <div>
              <Label required>Coupon Frequency</Label>
              <Select
                value={couponFrequency}
                onValueChange={(value) => setCouponFrequency(value as any)}
                disabled={isSubmitting}
                options={[
                  { value: "annual", label: "Annual" },
                  { value: "semiannual", label: "Semi-Annual" },
                  { value: "quarterly", label: "Quarterly" },
                  { value: "monthly", label: "Monthly" },
                ]}
              />
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#f0f9ff",
              padding: "var(--space-3)",
              borderRadius: "var(--radius-md)",
              border: "1px solid #bae6fd",
            }}
          >
            <p style={{ fontSize: "var(--text-sm)", color: "#0369a1" }}>
              <strong>Bond Valuation:</strong>
              <br />
              • Current value = current market price (or face value) × quantity
              <br />
              • Performance includes both price changes and coupon income
              <br />• Add coupon payments in the expanded card view after
              creation
            </p>
          </div>
        </>
      )}
    </>
  );
};
