import React, { useEffect, useState } from "react";
import { finCatchAPI } from "@fin-catch/ui/services";
import {
  CurrencyCode,
  dateToUnixTimestamp,
  getGoldUnitByIdAndSource,
  PortfolioEntry,
} from "@fin-catch/shared";
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
} from "@fin-catch/ui/components/atoms";
import {
  BondEntryForm,
  GoldEntryForm,
  StockEntryForm,
} from "@fin-catch/ui/components/molecules";

export interface AddEditEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  portfolioId: string;
  editingEntry?: PortfolioEntry | null;
}

export const AddEditEntryModal: React.FC<AddEditEntryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  portfolioId,
  editingEntry,
}) => {
  const [assetType, setAssetType] = useState<"stock" | "gold" | "bond">(
    "stock",
  );
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
  const [bondInputMode, setBondInputMode] = useState<"direct" | "calculated">(
    "direct",
  );
  const [faceValue, setFaceValue] = useState("");
  const [couponRate, setCouponRate] = useState("");
  const [maturityDate, setMaturityDate] = useState<Date | undefined>(undefined);
  const [couponFrequency, setCouponFrequency] = useState<
    "annual" | "semiannual" | "quarterly" | "monthly"
  >("semiannual");
  const [currentMarketPrice, setCurrentMarketPrice] = useState("");
  // Calculated mode inputs
  const [ytm, setYtm] = useState(""); // YTM (as percentage)
  const [totalInvestment, setTotalInvestment] = useState(""); // P_total
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stockSources, setStockSources] = useState<string[]>([]);
  // Price alert fields (stock only)
  const [targetPrice, setTargetPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [alertEnabled, setAlertEnabled] = useState(true);

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
          : undefined,
      );
      setNotes(editingEntry.notes || "");
      setTags(editingEntry.tags || "");
      setFees(editingEntry.transaction_fees?.toString() || "");
      setSource(editingEntry.source || "");
      setGoldUnit((editingEntry.unit as any) || "mace");
      setGoldType(
        editingEntry.asset_type === "gold" ? editingEntry.symbol : "",
      );
      // Initialize price alert fields (stock only)
      if (editingEntry.asset_type === "stock") {
        setTargetPrice(editingEntry.target_price?.toString() || "");
        setStopLoss(editingEntry.stop_loss?.toString() || "");
        setAlertEnabled(editingEntry.alert_enabled !== false);
      }
      // Initialize bond fields
      if (editingEntry.asset_type === "bond") {
        setBondIdentifier(editingEntry.symbol);
        setFaceValue(editingEntry.face_value?.toString() || "");
        setCouponRate(editingEntry.coupon_rate?.toString() || "");
        setMaturityDate(
          editingEntry.maturity_date
            ? new Date(editingEntry.maturity_date * 1000)
            : undefined,
        );
        setCouponFrequency(
          (editingEntry.coupon_frequency as any) || "semiannual",
        );
        setCurrentMarketPrice(
          editingEntry.current_market_price?.toString() || "",
        );
        setYtm(editingEntry.ytm?.toString() || "");
        // Set bond input mode based on whether ytm exists
        if (editingEntry.ytm) {
          setBondInputMode("calculated");
          // Calculate totalInvestment from quantity and purchase_price
          if (editingEntry.quantity && editingEntry.purchase_price) {
            setTotalInvestment(
              (editingEntry.quantity * editingEntry.purchase_price).toString(),
            );
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
      if (
        totalInvestment &&
        quantity &&
        purchasePrice &&
        ytm &&
        maturityDate &&
        purchaseDate &&
        faceValue
      ) {
        calculateBondParameters();
      }
    }
  }, [
    assetType,
    bondInputMode,
    totalInvestment,
    quantity,
    purchasePrice,
    ytm,
    maturityDate,
    purchaseDate,
    faceValue,
  ]);

  // Fetch available stock sources on mount
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const sources = await finCatchAPI.getSources();
        if (sources.stock) {
          setStockSources(sources.stock);
        }
      } catch (err) {
        console.error("Failed to fetch stock sources:", err);
        // Fallback to common sources if fetch fails
        setStockSources(["vndirect", "ssi", "yahoo_finance"]);
      }
    };
    fetchSources();
  }, []);

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
    // Reset alert fields
    setTargetPrice("");
    setStopLoss("");
    setAlertEnabled(true);
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
      // Set default stock source to vndirect if available
      setSource(stockSources.length > 0 ? stockSources[0] : "vndirect");
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
    if (
      !totalInvestment ||
      !quantity ||
      !purchasePrice ||
      !ytm ||
      !maturityDate ||
      !purchaseDate ||
      !faceValue
    ) {
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
    if (
      isNaN(P_total) ||
      isNaN(N) ||
      isNaN(P_buy) ||
      isNaN(YTM) ||
      isNaN(calculatedFV) ||
      allTime <= 0
    ) {
      setError("Invalid investment parameters");
      return;
    }

    // Calculate Coupon Rate from bond pricing: P_buy = [FV + (FV × Coupon Rate × T)] / (1 + YTM)^T
    // Rearranged: Coupon Rate = [(P_buy × (1 + YTM)^T - FV) / (FV × T)] × 100
    const discountFactor = Math.pow(1 + YTM, allTime);
    const calculatedCouponRate =
      ((P_buy * discountFactor - calculatedFV) / (calculatedFV * allTime)) *
      100;
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
        const maturityTimestamp = maturityDate
          ? dateToUnixTimestamp(maturityDate)
          : 0;
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
        const maturityTimestamp = maturityDate
          ? dateToUnixTimestamp(maturityDate)
          : 0;
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
          setError(
            "Bond parameters could not be calculated. Please check your inputs.",
          );
          setIsSubmitting(false);
          return;
        }
      }

      const entryData: PortfolioEntry = {
        id: editingEntry?.id || "", // Backend will generate UUID for new entries
        portfolio_id: portfolioId,
        asset_type: assetType,
        symbol:
          assetType === "bond"
            ? bondIdentifier
            : assetType === "gold"
              ? goldType
              : symbol,
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
        maturity_date:
          assetType === "bond" && maturityDate
            ? dateToUnixTimestamp(maturityDate)
            : undefined,
        coupon_frequency: assetType === "bond" ? couponFrequency : undefined,
        // Only save current_market_price for direct mode (when ytm is not set)
        current_market_price:
          assetType === "bond" &&
          bondInputMode === "direct" &&
          currentMarketPrice
            ? parseFloat(currentMarketPrice)
            : undefined,
        last_price_update:
          assetType === "bond" &&
          bondInputMode === "direct" &&
          currentMarketPrice
            ? Math.floor(Date.now() / 1000)
            : undefined,
        ytm: assetType === "bond" && ytm ? parseFloat(ytm) : undefined,
        // Price alert fields (stock only)
        target_price:
          assetType === "stock" && targetPrice
            ? parseFloat(targetPrice)
            : undefined,
        stop_loss:
          assetType === "stock" && stopLoss ? parseFloat(stopLoss) : undefined,
        alert_enabled:
          assetType === "stock" && (targetPrice || stopLoss)
            ? alertEnabled
            : undefined,
        sync_version: editingEntry?.sync_version || 1,
        synced_at: editingEntry?.synced_at,
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
          <BondEntryForm
            bondIdentifier={bondIdentifier}
            setBondIdentifier={setBondIdentifier}
            bondInputMode={bondInputMode}
            setBondInputMode={setBondInputMode}
            faceValue={faceValue}
            setFaceValue={setFaceValue}
            couponRate={couponRate}
            setCouponRate={setCouponRate}
            maturityDate={maturityDate}
            setMaturityDate={setMaturityDate}
            couponFrequency={couponFrequency}
            setCouponFrequency={setCouponFrequency}
            currentMarketPrice={currentMarketPrice}
            setCurrentMarketPrice={setCurrentMarketPrice}
            ytm={ytm}
            setYtm={setYtm}
            totalInvestment={totalInvestment}
            setTotalInvestment={setTotalInvestment}
            quantity={quantity}
            setQuantity={setQuantity}
            purchasePrice={purchasePrice}
            setPurchasePrice={setPurchasePrice}
            purchaseDate={purchaseDate}
            setPurchaseDate={setPurchaseDate}
            error={error}
            isSubmitting={isSubmitting}
          />
        ) : assetType === "gold" ? (
          <GoldEntryForm
            goldType={goldType}
            setGoldType={setGoldType}
            goldUnit={goldUnit}
            setGoldUnit={setGoldUnit}
            quantity={quantity}
            setQuantity={setQuantity}
            purchasePrice={purchasePrice}
            setPurchasePrice={setPurchasePrice}
            source={source}
            setSource={setSource}
            currency={currency}
            isSubmitting={isSubmitting}
            handleGoldTypeChange={handleGoldTypeChange}
            handleSourceChange={handleSourceChange}
          />
        ) : (
          <StockEntryForm
            symbol={symbol}
            setSymbol={setSymbol}
            quantity={quantity}
            setQuantity={setQuantity}
            purchasePrice={purchasePrice}
            setPurchasePrice={setPurchasePrice}
            isSubmitting={isSubmitting}
            targetPrice={targetPrice}
            setTargetPrice={setTargetPrice}
            stopLoss={stopLoss}
            setStopLoss={setStopLoss}
            alertEnabled={alertEnabled}
            setAlertEnabled={setAlertEnabled}
          />
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
          {/* Only show purchase date if not bond in calculated mode (those have it in the form) */}
          {!(assetType === "bond" && bondInputMode === "calculated") && (
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
          )}
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

        {assetType === "stock" && (
          <div>
            <Label>Source</Label>
            <Select
              value={source}
              onValueChange={setSource}
              options={stockSources.map((src) => ({
                value: src,
                label: src,
              }))}
              placeholder="Select source"
              disabled={isSubmitting}
            />
          </div>
        )}

        {assetType === "bond" && (
          <div>
            <Label>Source</Label>
            <Input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g., manual"
              disabled={isSubmitting}
            />
          </div>
        )}

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
