import React, { useEffect, useState } from "react";
import { finCatchAPI } from "@/services/api";
import { CurrencyCode, PortfolioEntry } from "@/types";
import { dateToUnixTimestamp } from "@/utils/dateUtils";
import { formatCurrency } from "@/utils/currency";
import {
  getGoldUnitByIdAndSource,
  getUnitLabel,
} from "@/utils/goldConversions";
import {
  Button,
  CurrencySelect,
  DatePicker,
  ErrorAlert,
  Input,
  Label,
  Modal,
  SimpleSelect as Select,
  Textarea,
} from "../atoms";

export interface AddEditEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  portfolioId: number;
  editingEntry?: PortfolioEntry | null;
}

export const AddEditEntryModal: React.FC<AddEditEntryModalProps> = ({
                                                                      isOpen,
                                                                      onClose,
                                                                      onSuccess,
                                                                      portfolioId,
                                                                      editingEntry,
                                                                    }) => {
  const [assetType, setAssetType] = useState<"stock" | "gold" | "bond">("stock");
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [fees, setFees] = useState("");
  const [source, setSource] = useState("");
  const [goldUnit, setGoldUnit] = useState<
      "gram" | "mace" | "tael" | "ounce" | "kg"
  >("mace");
  const [goldType, setGoldType] = useState<string>("");
  // Bond-specific state
  const [bondIdentifier, setBondIdentifier] = useState("");
  const [bondInputMode, setBondInputMode] = useState<"direct" | "calculated">("direct");
  const [faceValue, setFaceValue] = useState("");
  const [couponRate, setCouponRate] = useState("");
  const [maturityDate, setMaturityDate] = useState<Date | undefined>(undefined);
  const [couponFrequency, setCouponFrequency] = useState<"annual" | "semiannual" | "quarterly" | "monthly">("semiannual");
  const [currentMarketPrice, setCurrentMarketPrice] = useState("");
  // Calculated mode inputs
  const [ytm, setYtm] = useState(""); // YTM (as percentage)
  const [totalInvestment, setTotalInvestment] = useState(""); // P_total
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with editing entry data
  useEffect(() => {
    if (editingEntry) {
      setAssetType(editingEntry.asset_type);
      setSymbol(editingEntry.symbol);
      setQuantity(editingEntry.quantity?.toString() || "");
      setPurchasePrice(editingEntry.purchase_price?.toString() || "");
      setCurrency(editingEntry.currency || "USD");
      setPurchaseDate(
          editingEntry.purchase_date
              ? new Date(editingEntry.purchase_date * 1000)
              : undefined
      );
      setNotes(editingEntry.notes || "");
      setTags(editingEntry.tags || "");
      setFees(editingEntry.transaction_fees?.toString() || "");
      setSource(editingEntry.source || "");
      setGoldUnit((editingEntry.unit as any) || "mace");
      setGoldType(
          editingEntry.asset_type === "gold" ? editingEntry.symbol : "",
      );
      // Initialize bond fields
      if (editingEntry.asset_type === "bond") {
        setBondIdentifier(editingEntry.symbol);
        setFaceValue(editingEntry.face_value?.toString() || "");
        setCouponRate(editingEntry.coupon_rate?.toString() || "");
        setMaturityDate(
            editingEntry.maturity_date
                ? new Date(editingEntry.maturity_date * 1000)
                : undefined
        );
        setCouponFrequency((editingEntry.coupon_frequency as any) || "semiannual");
        setCurrentMarketPrice(editingEntry.current_market_price?.toString() || "");
        setYtm(editingEntry.ytm?.toString() || "");
        // Set bond input mode based on whether ytm exists
        if (editingEntry.ytm) {
          setBondInputMode("calculated");
          // Calculate totalInvestment from quantity and purchase_price
          if (editingEntry.quantity && editingEntry.purchase_price) {
            setTotalInvestment((editingEntry.quantity * editingEntry.purchase_price).toString());
          }
        }
      }
    } else {
      resetForm();
    }
  }, [editingEntry, isOpen]);

  // Auto-calculate bond parameters when all required fields are filled in calculated mode
  useEffect(() => {
    if (assetType === "bond" && bondInputMode === "calculated") {
      if (totalInvestment && quantity && purchasePrice && ytm && maturityDate && purchaseDate && faceValue) {
        calculateBondParameters();
      }
    }
  }, [assetType, bondInputMode, totalInvestment, quantity, purchasePrice, ytm, maturityDate, purchaseDate, faceValue]);

  const resetForm = () => {
    setAssetType("stock");
    setSymbol("");
    setQuantity("");
    setPurchasePrice("");
    setCurrency("USD");
    setPurchaseDate(undefined);
    setNotes("");
    setTags("");
    setFees("");
    setSource("");
    setGoldUnit("mace");
    setGoldType("");
    // Reset bond fields
    setBondIdentifier("");
    setBondInputMode("direct");
    setFaceValue("");
    setCouponRate("");
    setMaturityDate(undefined);
    setCouponFrequency("semiannual");
    setCurrentMarketPrice("");
    setYtm("");
    setTotalInvestment("");
    setError(null);
  };

  const handleAssetTypeChange = (newType: "stock" | "gold" | "bond") => {
    setAssetType(newType);
    if (newType === "gold") {
      setCurrency("VND");
      setSource("sjc");
    } else if (newType === "bond") {
      setCurrency("USD");
      setSource("manual");
      setCouponFrequency("semiannual");
    } else {
      setCurrency("USD");
      setSource("");
    }
  };

  const handleGoldTypeChange = (newGoldType: string) => {
    setGoldType(newGoldType);
    if (newGoldType && source) {
      const correctUnit = getGoldUnitByIdAndSource(newGoldType, source);
      setGoldUnit(correctUnit);
    }
  };

  const handleSourceChange = (newSource: string) => {
    setSource(newSource);
    if (newSource && goldType) {
      const correctUnit = getGoldUnitByIdAndSource(goldType, newSource);
      setGoldUnit(correctUnit);
    }
  };

  // Calculate bond parameters from investment data
  const calculateBondParameters = () => {
    if (!totalInvestment || !quantity || !purchasePrice || !ytm || !maturityDate || !purchaseDate || !faceValue) {
      return; // Silently return if required fields are missing
    }

    const calculatedFV = parseFloat(faceValue);
    const P_total = parseFloat(totalInvestment);
    const N = parseFloat(quantity);
    const P_buy = parseFloat(purchasePrice);
    const YTM = parseFloat(ytm) / 100; // Convert percentage to decimal
    const maturityTimestamp = maturityDate ? maturityDate.getTime() / 1000 : 0;
    const purchasedTimestamp = purchaseDate ? purchaseDate.getTime() / 1000 : 0;

    // Calculate total time from purchase to maturity in days, then convert to years
    const totalDays = (maturityTimestamp - purchasedTimestamp) / (24 * 60 * 60);
    const allTime = totalDays / 365; // Time from purchase to maturity in years

    // Validate inputs
    if (isNaN(P_total) || isNaN(N) || isNaN(P_buy) || isNaN(YTM) || isNaN(calculatedFV) || allTime <= 0) {
      setError("Invalid investment parameters");
      return;
    }

    // Calculate Coupon Rate from bond pricing: P_buy = [FV + (FV × Coupon Rate × T)] / (1 + YTM)^T
    // Rearranged: Coupon Rate = [(P_buy × (1 + YTM)^T - FV) / (FV × T)] × 100
    const discountFactor = Math.pow(1 + YTM, allTime);
    const calculatedCouponRate = ((P_buy * discountFactor - calculatedFV) / (calculatedFV * allTime)) * 100;
    if (isNaN(calculatedCouponRate) || !isFinite(calculatedCouponRate)) {
      setError("Failed to calculate coupon rate");
      return;
    }
    setCouponRate(calculatedCouponRate.toFixed(2));

    setError(null); // Clear any previous errors
  };

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (assetType === "gold" && !goldType) {
      setError("Gold Price ID is required");
      return;
    }
    if (assetType === "stock" && !symbol) {
      setError("Symbol is required");
      return;
    }
    if (assetType === "bond") {
      if (!bondIdentifier) {
        setError("Bond identifier/ISIN is required");
        return;
      }

      if (bondInputMode === "calculated") {
        // Validate calculated mode inputs
        if (!totalInvestment || parseFloat(totalInvestment) <= 0) {
          setError("Total investment must be greater than 0");
          return;
        }
        if (!purchasePrice || parseFloat(purchasePrice) <= 0) {
          setError("Purchase price percentage must be greater than 0");
          return;
        }
        if (!ytm || parseFloat(ytm) < 0) {
          setError("YTM must be 0 or greater");
          return;
        }
        if (!maturityDate) {
          setError("Maturity date is required");
          return;
        }
        const maturityTimestamp = maturityDate ? dateToUnixTimestamp(maturityDate) : 0;
        if (maturityTimestamp <= Date.now() / 1000) {
          setError("Maturity date must be in the future");
          return;
        }
        // Calculate bond parameters before proceeding
        calculateBondParameters();
      } else {
        // Validate direct mode inputs
        if (!faceValue || parseFloat(faceValue) <= 0) {
          setError("Face value must be greater than 0");
          return;
        }
        if (!couponRate || parseFloat(couponRate) < 0) {
          setError("Coupon rate must be 0 or greater");
          return;
        }
        if (!maturityDate) {
          setError("Maturity date is required");
          return;
        }
        const maturityTimestamp = maturityDate ? dateToUnixTimestamp(maturityDate) : 0;
        if (maturityTimestamp <= Date.now() / 1000) {
          setError("Maturity date must be in the future");
          return;
        }
      }
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }
    // Purchase price validation - skip for calculated mode bonds
    if (!(assetType === "bond" && bondInputMode === "calculated")) {
      if (!purchasePrice || parseFloat(purchasePrice) <= 0) {
        setError("Purchase price must be greater than 0");
        return;
      }
    }
    if (!purchaseDate) {
      setError("Purchase date is required");
      return;
    }
    if (assetType === "gold" && !source) {
      setError("Source is required for gold entries");
      return;
    }

    setIsSubmitting(true);
    try {
      // Validate that calculated bond parameters exist
      if (assetType === "bond" && bondInputMode === "calculated") {
        if (!faceValue || !couponRate || !purchasePrice) {
          setError("Bond parameters could not be calculated. Please check your inputs.");
          setIsSubmitting(false);
          return;
        }
      }

      const entryData: PortfolioEntry = {
        id: editingEntry?.id,
        portfolio_id: portfolioId,
        asset_type: assetType,
        symbol: assetType === "bond" ? bondIdentifier : (assetType === "gold" ? goldType : symbol),
        quantity: parseFloat(quantity),
        purchase_price: parseFloat(purchasePrice),
        currency,
        purchase_date: purchaseDate ? dateToUnixTimestamp(purchaseDate) : 0,
        notes: notes.trim() || undefined,
        tags: tags.trim() || undefined,
        transaction_fees: fees ? parseFloat(fees) : undefined,
        source: source || undefined,
        created_at: editingEntry?.created_at || Math.floor(Date.now() / 1000),
        unit: assetType === "gold" ? goldUnit : undefined,
        gold_type: assetType === "gold" ? goldType : undefined,
        // Bond-specific fields
        face_value: assetType === "bond" ? parseFloat(faceValue) : undefined,
        coupon_rate: assetType === "bond" ? parseFloat(couponRate) : undefined,
        maturity_date: assetType === "bond" && maturityDate ? dateToUnixTimestamp(maturityDate) : undefined,
        coupon_frequency: assetType === "bond" ? couponFrequency : undefined,
        // Only save current_market_price for direct mode (when ytm is not set)
        current_market_price: assetType === "bond" && bondInputMode === "direct" && currentMarketPrice ? parseFloat(currentMarketPrice) : undefined,
        last_price_update: assetType === "bond" && bondInputMode === "direct" && currentMarketPrice ? Math.floor(Date.now() / 1000) : undefined,
        ytm: assetType === "bond" && ytm ? parseFloat(ytm) : undefined,
      };

      if (editingEntry) {
        await finCatchAPI.updateEntry(entryData);
      } else {
        await finCatchAPI.createEntry(entryData);
      }

      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const totalCost =
      quantity && purchasePrice
          ? parseFloat(purchasePrice) * parseFloat(quantity)
          : 0;

  return (
      <Modal
          isOpen={isOpen}
          onClose={handleClose}
          title={editingEntry ? "Edit Entry" : "Add Entry"}
          size="lg"
      >
        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
        <div className="space-y-4">
          <div>
            <Label required>Asset Type</Label>
            <Select
                value={assetType}
                onValueChange={(value) =>
                    handleAssetTypeChange(value as "stock" | "gold" | "bond")
                }
                options={[
                  { value: "stock", label: "Stock" },
                  { value: "gold", label: "Gold" },
                  { value: "bond", label: "Bond" },
                ]}
            />
          </div>

          {assetType === "bond" ? (
              <>
                {/* Bond-specific fields */}
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
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--cube-gray-500)", marginTop: "var(--space-1)" }}>
                    Annual yield to maturity percentage
                  </p>
                </div>
                {/* Input Mode Selector */}
                <div>
                  <Label>Input Mode</Label>
                  <Select
                      value={bondInputMode}
                      onValueChange={(value) => setBondInputMode(value as "direct" | "calculated")}
                      disabled={isSubmitting}
                      options={[
                        { value: "direct", label: "Direct Input (Manual Entry)" },
                        { value: "calculated", label: "Calculate from Investment Data" },
                      ]}
                  />
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--cube-gray-500)", marginTop: "var(--space-1)" }}>
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
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--cube-gray-500)", marginTop: "var(--space-1)" }}>
                    Par/nominal value per bond
                  </p>
                </div>
                {bondInputMode === "calculated" ? (
                    <>
                      {/* Calculated Mode Inputs */}
                      <div className="p-4" style={{ backgroundColor: "var(--cube-gray-50)", borderRadius: "var(--radius-md)", border: "1px solid var(--cube-gray-200)" }}>
                        <p style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)", marginBottom: "var(--space-3)" }}>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginTop: "var(--space-3)" }}>
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
                            <p style={{ fontSize: "var(--text-xs)", color: "var(--cube-gray-500)", marginTop: "var(--space-1)" }}>
                              Percentage of face value (e.g., 106.084 = 106.084%)
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginTop: "var(--space-3)" }}>
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

                        <div style={{ marginTop: "var(--space-3)", padding: "var(--space-2)", backgroundColor: "var(--cube-blue-50)", borderRadius: "var(--radius-md)", border: "1px solid var(--cube-blue-200)" }}>
                          <p style={{ fontSize: "var(--text-xs)", color: "var(--cube-blue-700)" }}>
                            Bond parameters will be calculated automatically as you fill in the fields above.
                          </p>
                        </div>
                      </div>

                      {/* Calculated Results */}
                      {faceValue && couponRate && purchasePrice && (
                          <div className="p-4" style={{ backgroundColor: "var(--cube-green-50)", borderRadius: "var(--radius-md)", border: "1px solid var(--cube-green-200)" }}>
                            <p style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)", marginBottom: "var(--space-3)", color: "var(--cube-green-800)" }}>
                              Calculated Results
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Face Value</Label>
                                <Input
                                    type="text"
                                    value={faceValue}
                                    readOnly
                                    style={{ backgroundColor: "#f9fafb", color: "#111827", cursor: "not-allowed", fontWeight: 600 }}
                                />
                              </div>
                              <div>
                                <Label>Purchase Price per Bond</Label>
                                <Input
                                    type="text"
                                    value={purchasePrice}
                                    readOnly
                                    style={{ backgroundColor: "#f9fafb", color: "#111827", cursor: "not-allowed", fontWeight: 600 }}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginTop: "var(--space-3)" }}>
                              <div>
                                <Label>Coupon Rate (%)</Label>
                                <Input
                                    type="text"
                                    value={couponRate}
                                    readOnly
                                    style={{ backgroundColor: "#f9fafb", color: "#111827", cursor: "not-allowed", fontWeight: 600 }}
                                />
                              </div>
                            </div>
                            <p style={{ fontSize: "var(--text-xs)", color: "var(--cube-green-700)", marginTop: "var(--space-2)" }}>
                              Note: Current market value will be calculated automatically based on time to maturity and YTM when viewing portfolio performance.
                            </p>
                          </div>
                      )}
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
                          <p style={{ fontSize: "var(--text-xs)", color: "var(--cube-gray-500)", marginTop: "var(--space-1)" }}>
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
                        <p style={{ fontSize: "var(--text-xs)", color: "var(--cube-gray-500)", marginTop: "var(--space-1)" }}>
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

                      <div style={{ backgroundColor: "#f0f9ff", padding: "var(--space-3)", borderRadius: "var(--radius-md)", border: "1px solid #bae6fd" }}>
                        <p style={{ fontSize: "var(--text-sm)", color: "#0369a1" }}>
                          <strong>Bond Valuation:</strong><br />
                          • Current value = current market price (or face value) × quantity<br />
                          • Performance includes both price changes and coupon income<br />
                          • Add coupon payments in the expanded card view after creation
                        </p>
                      </div>
                    </>
                )}

                {/* Coupon Frequency - Common for both modes */}
                {bondInputMode === "calculated" && (
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
                )}
              </>
          ) : assetType === "gold" ? (
              <>
                {/* Gold-specific fields */}
                <div>
                  <Label required>Gold Price ID</Label>
                  <Select
                      value={goldType}
                      onValueChange={handleGoldTypeChange}
                      placeholder="Select gold price ID"
                      options={[
                        { value: "1", label: "SJC 1L, 10L, 1KG - Ho Chi Minh (tael/lượng)" },
                        { value: "2", label: "SJC 1L, 10L, 1KG - Ha Noi (tael/lượng)" },
                        { value: "49", label: "SJC Nhẫn 99.99% (1 chỉ, 2 chỉ, 5 chỉ) (mace/chỉ)" },
                      ]}
                  />
                  <p
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--cube-gray-500)",
                        marginTop: "var(--space-1)",
                      }}
                  >
                    Select the gold price source to track
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label required>Unit</Label>
                    <Select
                        value={goldUnit}
                        onValueChange={(value) => setGoldUnit(value as any)}
                        options={[
                          { value: "mace", label: "Mace/Chỉ (3.75g) - Default for VN" },
                          { value: "tael", label: "Tael/Lượng (37.5g)" },
                          { value: "gram", label: "Gram (g)" },
                          { value: "ounce", label: "Troy Ounce (31.1g)" },
                          { value: "kg", label: "Kilogram (kg)" },
                        ]}
                    />
                    <p
                        style={{
                          fontSize: "var(--text-xs)",
                          color: "#6366f1",
                          marginTop: "var(--space-1)",
                        }}
                    >
                      💡 You can enter in any unit - prices will be auto-converted
                      for comparison
                    </p>
                    <p
                        style={{
                          fontSize: "var(--text-xs)",
                          color: "#10b981",
                          marginTop: "var(--space-1)",
                        }}
                    >
                      ℹ️ {source ? source.toUpperCase() : "API"} returns prices per
                      tael, conversion handled automatically
                    </p>
                  </div>
                  <div>
                    <Label required>Quantity</Label>
                    <Input
                        type="number"
                        step="0.01"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder={`Number of ${goldUnit}s`}
                        disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <Label required>
                    Purchase Price per {getUnitLabel(goldUnit)}
                  </Label>
                  <Input
                      type="number"
                      step="0.01"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      placeholder="Price per unit"
                      disabled={isSubmitting}
                  />
                  {totalCost > 0 && (
                      <p
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--cube-gray-600)",
                            marginTop: "var(--space-1)",
                          }}
                      >
                        Total: {formatCurrency(totalCost, currency)}
                      </p>
                  )}
                  <p
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "#10b981",
                        marginTop: "var(--space-1)",
                      }}
                  >
                    ✓ Enter your purchase price in your preferred unit - system
                    handles conversion
                  </p>
                </div>
              </>
          ) : (
              <>
                {/* Stock-specific fields */}
                <div>
                  <Label required>Symbol</Label>
                  <Input
                      type="text"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                      placeholder="e.g., AAPL, MSFT"
                      disabled={isSubmitting}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label required>Quantity</Label>
                    <Input
                        type="number"
                        step="0.01"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="Number of shares"
                        disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label required>Purchase Price per Share</Label>
                    <Input
                        type="number"
                        step="0.01"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value)}
                        placeholder="0.00"
                        disabled={isSubmitting}
                    />
                  </div>
                </div>
              </>
          )}

          <div>
            <CurrencySelect
                label="Currency"
                value={currency}
                onChange={setCurrency}
                id="entry-currency"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label>Transaction Fees</Label>
              <Input
                  type="number"
                  step="0.01"
                  value={fees}
                  onChange={(e) => setFees(e.target.value)}
                  placeholder="0.00"
                  disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <Label required={assetType === "gold"}>Source</Label>
            {assetType === "gold" ? (
                <>
                  <Select
                      value={source}
                      onValueChange={handleSourceChange}
                      placeholder="Select source"
                      options={[
                        { value: "sjc", label: "SJC Gold" },
                      ]}
                  />
                  <p
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "#2563eb",
                        marginTop: "var(--space-1)",
                      }}
                  >
                    💡 Source determines which API to use for current prices
                  </p>
                </>
            ) : (
                <Input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="e.g., yahoo_finance"
                    disabled={isSubmitting}
                />
            )}
          </div>

          <div>
            <Label>Tags</Label>
            <Input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., tech, growth"
                disabled={isSubmitting}
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
                rows={3}
                disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
                variant="secondary"
                className="flex-1"
                onClick={handleClose}
                disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
                variant="primary"
                className="flex-1"
                onClick={handleSubmit}
                disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : editingEntry ? "Update" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>
  );
};
