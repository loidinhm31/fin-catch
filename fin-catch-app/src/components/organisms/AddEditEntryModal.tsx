import React, { useEffect, useRef, useState } from "react";
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
  ErrorAlert,
  Input,
  Label,
  Modal,
  Select,
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
  const [assetType, setAssetType] = useState<"stock" | "gold">("stock");
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [fees, setFees] = useState("");
  const [source, setSource] = useState("");
  const [goldUnit, setGoldUnit] = useState<
    "gram" | "mace" | "tael" | "ounce" | "kg"
  >("mace");
  const [goldType, setGoldType] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateInputRef = useRef<HTMLInputElement>(null);

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
              .toISOString()
              .split("T")[0]
          : "",
      );
      setNotes(editingEntry.notes || "");
      setTags(editingEntry.tags || "");
      setFees(editingEntry.transaction_fees?.toString() || "");
      setSource(editingEntry.source || "");
      setGoldUnit((editingEntry.unit as any) || "mace");
      setGoldType(
        editingEntry.asset_type === "gold" ? editingEntry.symbol : "",
      );
    } else {
      resetForm();
    }
  }, [editingEntry, isOpen]);

  const resetForm = () => {
    setAssetType("stock");
    setSymbol("");
    setQuantity("");
    setPurchasePrice("");
    setCurrency("USD");
    setPurchaseDate("");
    setNotes("");
    setTags("");
    setFees("");
    setSource("");
    setGoldUnit("mace");
    setGoldType("");
    setError(null);
  };

  const handleAssetTypeChange = (newType: "stock" | "gold") => {
    setAssetType(newType);
    if (newType === "gold") {
      setCurrency("VND");
      setSource("sjc");
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
    if (!quantity || parseFloat(quantity) <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }
    if (!purchasePrice || parseFloat(purchasePrice) <= 0) {
      setError("Purchase price must be greater than 0");
      return;
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
      const entryData: PortfolioEntry = {
        id: editingEntry?.id,
        portfolio_id: portfolioId,
        asset_type: assetType,
        symbol: assetType === "gold" ? goldType : symbol,
        quantity: parseFloat(quantity),
        purchase_price: parseFloat(purchasePrice),
        currency,
        purchase_date: dateToUnixTimestamp(new Date(purchaseDate)),
        notes: notes.trim() || undefined,
        tags: tags.trim() || undefined,
        transaction_fees: fees ? parseFloat(fees) : undefined,
        source: source || undefined,
        created_at: editingEntry?.created_at || Math.floor(Date.now() / 1000),
        unit: assetType === "gold" ? goldUnit : undefined,
        gold_type: assetType === "gold" ? goldType : undefined,
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
            onChange={(e) =>
              handleAssetTypeChange(e.target.value as "stock" | "gold")
            }
          >
            <option value="stock">Stock</option>
            <option value="gold">Gold</option>
          </Select>
        </div>

        {assetType === "gold" ? (
          <>
            {/* Gold-specific fields */}
            <div>
              <Label required>Gold Price ID</Label>
              <Select
                value={goldType}
                onChange={(e) => handleGoldTypeChange(e.target.value)}
              >
                <option value="">Select gold price ID</option>
                <optgroup label="SJC - Gold Bars (per tael/lượng)">
                  <option value="1">SJC 1L, 10L, 1KG - Ho Chi Minh</option>
                  <option value="2">SJC 1L, 10L, 1KG - Ha Noi</option>
                </optgroup>
                <optgroup label="SJC - Jewelry/Rings (per mace/chỉ)">
                  <option value="49">
                    SJC Nhẫn 99.99% (1 chỉ, 2 chỉ, 5 chỉ)
                  </option>
                </optgroup>
              </Select>
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
                  onChange={(e) => setGoldUnit(e.target.value as any)}
                >
                  <option value="mace">
                    Mace/Chỉ (3.75g) - Default for VN
                  </option>
                  <option value="tael">Tael/Lượng (37.5g)</option>
                  <option value="gram">Gram (g)</option>
                  <option value="ounce">Troy Ounce (31.1g)</option>
                  <option value="kg">Kilogram (kg)</option>
                </Select>
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
            <Input
              ref={dateInputRef}
              type="date"
              value={purchaseDate}
              onChange={(e) => {
                setPurchaseDate(e.target.value);
                setTimeout(() => {
                  if (dateInputRef.current) {
                    dateInputRef.current.blur();
                  }
                }, 100);
              }}
              disabled={isSubmitting}
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
                onChange={(e) => handleSourceChange(e.target.value)}
              >
                <option value="">Select source</option>
                <option value="sjc">SJC Gold</option>
              </Select>
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
